import React, { useEffect, useState } from 'react';
import { User, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../src/firebase';
import { handleFirestoreError, OperationType } from '../utils/firestore-errors';
import { 
  LogOut, 
  User as UserIcon, 
  Mail, 
  Phone, 
  MapPin, 
  ChevronRight,
  HelpCircle,
  ShieldCheck,
  Heart,
  Share2,
  Info,
  ArrowLeft
} from 'lucide-react';
import { AppView, UserProfile } from '../src/types';
import { motion, AnimatePresence } from 'motion/react';
import { ProfessionalRegistration } from './ProfessionalRegistration';

interface AccountProps {
  user: User;
  onLogout: () => void;
  navigate: (view: AppView) => void;
  onUpdateProfile: () => void;
}

export const Account: React.FC<AccountProps> = ({ user, onLogout, navigate, onUpdateProfile }) => {
  const [loading, setLoading] = useState(true);
  const [activeSubView, setActiveSubView] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>({
    uid: user.uid,
    name: user.displayName || '',
    email: user.email || '',
    photo: '',
    phone: ''
  });

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user.uid]);

  const handleLogout = async () => {
    await signOut(auth);
    onLogout();
  };

  const renderSubViewHeader = (title: string) => (
    <div className="flex items-center gap-4 mb-6">
      <button onClick={() => setActiveSubView(null)} className="p-2 hover:bg-gray-100 rounded-full">
        <ArrowLeft size={20} />
      </button>
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
    </div>
  );

  const renderSavedAddresses = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      {renderSubViewHeader('Saved Addresses')}
      <div className="text-center py-10 text-gray-500">Saved addresses view...</div>
    </motion.div>
  );

  const renderFavorites = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      {renderSubViewHeader('Favorites')}
      <div className="text-center py-10 text-gray-500">Favorites view...</div>
    </motion.div>
  );

  const renderProfessionalRegistration = () => (
    <ProfessionalRegistration 
      user={user} 
      profile={profile} 
      onComplete={() => {
        setActiveSubView(null);
        onUpdateProfile();
        fetchProfile();
      }}
      onBack={() => setActiveSubView(null)}
      navigate={navigate}
    />
  );

  return (
    <div className="pb-24">
      <div className="bg-white p-6 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Account</h1>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <UserIcon className="text-primary" size={20} />
            <span className="font-bold text-gray-900">{profile.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="text-primary" size={20} />
            <span className="text-gray-600">{profile.email}</span>
          </div>
          <div className="flex items-center gap-3 bg-primary/5 p-4 rounded-xl border border-primary/10">
            <Phone className="text-primary" size={20} />
            <span className="font-bold text-primary">{profile.phone || 'Add Mobile Number'}</span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-2">
        {[
          { icon: MapPin, label: 'Saved Addresses', id: 'addresses' },
          { icon: Heart, label: 'Favorites', id: 'favorites' },
          { icon: ShieldCheck, label: 'Join as a Professional', id: 'professional' },
          { icon: HelpCircle, label: 'Help & Support', id: 'help' },
          { icon: Info, label: 'About OrGo', id: 'about' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSubView(item.id)}
            className="w-full p-4 flex items-center justify-between bg-white rounded-2xl border border-gray-100 hover:border-primary/20 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600">
                <item.icon size={20} />
              </div>
              <span className="font-bold text-gray-900">{item.label}</span>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
        ))}
      </div>

      <div className="p-6 space-y-4">
        <button 
          onClick={() => navigator.share({ title: 'OrGo', url: window.location.href })}
          className="w-full p-4 flex items-center justify-center gap-2 bg-white rounded-2xl border border-gray-100 font-bold text-gray-900"
        >
          <Share2 size={20} /> Share App
        </button>
        <button 
          onClick={handleLogout}
          className="w-full p-4 flex items-center justify-center gap-2 bg-red-50 text-red-600 rounded-2xl font-bold"
        >
          <LogOut size={20} /> Logout
        </button>
      </div>

      <AnimatePresence>
        {activeSubView && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            className="fixed inset-0 bg-gray-50 z-50 p-6 overflow-y-auto"
          >
            {activeSubView === 'addresses' && renderSavedAddresses()}
            {activeSubView === 'favorites' && renderFavorites()}
            {activeSubView === 'professional' && renderProfessionalRegistration()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
