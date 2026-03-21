import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../src/firebase';
import { AppView, UserProfile } from '../src/types';
import { APP_CATEGORIES } from '../src/constants';
import { 
  ArrowLeft, 
  Loader2, 
  ShieldCheck, 
  Check, 
  ChevronRight, 
  Camera,
  User as UserIcon,
  Phone,
  Briefcase
} from 'lucide-react';
import { motion } from 'motion/react';

interface WorkerRegistrationProps {
  user: User;
  profile: UserProfile;
  onComplete: () => void;
  onBack: () => void;
  navigate: (view: AppView) => void;
}

export const WorkerRegistration: React.FC<WorkerRegistrationProps> = ({ user, profile, onComplete, onBack, navigate }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(profile.photo || '');
  const [name, setName] = useState(profile.name || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCompleteRegistration = async () => {
    setLoading(true);
    try {
      let photoUrl = imagePreview;
      if (imageFile) {
        const storageRef = ref(storage, `profiles/${user.uid}`);
        await uploadBytes(storageRef, imageFile);
        photoUrl = await getDownloadURL(storageRef);
      }

      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        role: 'professional',
        name,
        phone,
        photo: photoUrl,
        skills: selectedSkills,
        isOnline: false,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      onComplete();
      navigate(AppView.WORKER_APP);
    } catch (error) {
      console.error('Error registering as professional:', error);
      alert('Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentCategory = APP_CATEGORIES.find(c => c.id === selectedCategoryId);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-primary/20 overflow-hidden flex items-center justify-center">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <UserIcon size={40} className="text-gray-400" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg">
                  <Camera size={16} />
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Profile Photo</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm focus:bg-white focus:border-primary transition-all" 
                    placeholder="Enter your name"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm focus:bg-white focus:border-primary transition-all" 
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Select Main Category</label>
            <div className="grid grid-cols-2 gap-3">
              {APP_CATEGORIES.map(cat => (
                <button 
                  key={cat.id} 
                  onClick={() => {
                    setSelectedCategoryId(cat.id);
                    setSelectedSkills([]);
                  }}
                  className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${selectedCategoryId === cat.id ? 'bg-primary/5 border-primary shadow-sm' : 'bg-white border-gray-100'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedCategoryId === cat.id ? 'bg-primary text-white' : 'bg-gray-50 text-gray-400'}`}>
                    <Briefcase size={20} />
                  </div>
                  <span className={`text-xs font-bold ${selectedCategoryId === cat.id ? 'text-primary' : 'text-gray-600'}`}>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Select Your Skills in {currentCategory?.name}</label>
            <div className="space-y-2">
              {currentCategory?.subCategories.map(sub => (
                <button 
                  key={sub.id} 
                  onClick={() => setSelectedSkills(prev => prev.includes(sub.title) ? prev.filter(s => s !== sub.title) : [...prev, sub.title])}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedSkills.includes(sub.title) ? 'bg-primary/5 border-primary' : 'bg-white border-gray-100'}`}
                >
                  <span className={`text-sm font-bold ${selectedSkills.includes(sub.title) ? 'text-primary' : 'text-gray-700'}`}>{sub.title}</span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${selectedSkills.includes(sub.title) ? 'bg-primary border-primary text-white' : 'border-gray-200'}`}>
                    {selectedSkills.includes(sub.title) && <Check size={14} strokeWidth={3} />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const isNextDisabled = () => {
    if (step === 1) return !name || !phone;
    if (step === 2) return !selectedCategoryId;
    if (step === 3) return selectedSkills.length === 0;
    return false;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen bg-white p-6 pb-32">
      <div className="max-w-md mx-auto">
        <button onClick={step > 1 ? () => setStep(step - 1) : onBack} className="mb-8 p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 font-display mb-2">Professional Onboarding</h1>
          <p className="text-gray-500 text-sm">Step {step} of 3: {step === 1 ? 'Basic Details' : step === 2 ? 'Category' : 'Skills'}</p>
        </div>

        <div className="space-y-8">
          {renderStep()}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 max-w-md mx-auto">
          <button 
            onClick={step < 3 ? () => setStep(step + 1) : handleCompleteRegistration}
            disabled={loading || isNextDisabled()}
            className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : step < 3 ? (
              <>Next Step <ChevronRight size={20} /></>
            ) : (
              <><ShieldCheck size={20} /> Complete Onboarding</>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
