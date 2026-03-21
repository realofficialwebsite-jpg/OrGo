import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../src/firebase';
import { AppView, UserProfile } from '../src/types';
import { ArrowLeft, Loader2, ShieldCheck, Check, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
// Import CATEGORIES from App if possible, or redefine here for now
import { APP_CATEGORIES } from '../src/constants';

interface ProfessionalRegistrationProps {
  user: User;
  profile: UserProfile;
  onComplete: () => void;
  onBack: () => void;
  navigate: (view: AppView) => void;
}

export const ProfessionalRegistration: React.FC<ProfessionalRegistrationProps> = ({ user, profile, onComplete, onBack, navigate }) => {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [experience, setExperience] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleCompleteRegistration = async () => {
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        role: 'professional',
        providedServices: selectedSubCategories,
        isOnline: false,
        phone: `+91${phone}`,
        age,
        experience
      }, { merge: true });
      onComplete();
      navigate(AppView.PROVIDER_DASHBOARD);
    } catch (error) {
      console.error('Error registering as professional:', error);
      alert('Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Name</label>
              <input type="text" value={profile.name} disabled className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-900" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Mobile Number (+91)</label>
              <input type="tel" maxLength={10} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-primary transition-all" placeholder="9876543210" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Age</label>
              <input type="number" value={age} onChange={e => setAge(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-primary transition-all" placeholder="25" />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Years of Experience</label>
              <select value={experience} onChange={e => setExperience(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-primary transition-all">
                <option value="">Select Experience</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(y => <option key={y} value={y}>{y} Years</option>)}
              </select>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Select Categories</label>
              <div className="grid grid-cols-2 gap-2">
                {APP_CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setSelectedCategories(prev => prev.includes(cat.id) ? prev.filter(id => id !== cat.id) : [...prev, cat.id])} className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${selectedCategories.includes(cat.id) ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-gray-600'}`}>
                    {selectedCategories.includes(cat.id) && <Check size={14} />}
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
            {selectedCategories.length > 0 && (
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Select Sub-Categories</label>
                <div className="grid grid-cols-1 gap-2">
                  {APP_CATEGORIES.filter(cat => selectedCategories.includes(cat.id)).flatMap(cat => cat.subCategories).map(sub => (
                    <button key={sub.id} onClick={() => setSelectedSubCategories(prev => prev.includes(sub.title) ? prev.filter(t => t !== sub.title) : [...prev, sub.title])} className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${selectedSubCategories.includes(sub.title) ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-gray-600'}`}>
                      {selectedSubCategories.includes(sub.title) && <Check size={14} />}
                      {sub.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-6 pb-24 max-w-2xl mx-auto">
      <button onClick={step > 1 ? () => setStep(step - 1) : onBack} className="mb-6 p-2 -ml-2 hover:bg-gray-100 rounded-full">
        <ArrowLeft size={24} />
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-2 font-display">Join as a Professional - Step {step}</h1>
      <p className="text-gray-500 mb-8">Complete your profile to start providing services.</p>

      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        {renderStep()}
      </div>

      <button 
        onClick={step < 3 ? () => setStep(step + 1) : handleCompleteRegistration}
        disabled={loading}
        className="w-full mt-8 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="animate-spin" /> : step < 3 ? <>Next <ChevronRight size={20} /></> : <><ShieldCheck size={20} /> Complete Registration</>}
      </button>
    </motion.div>
  );
};
