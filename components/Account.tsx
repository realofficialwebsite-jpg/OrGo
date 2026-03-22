import React, { useEffect, useState } from 'react';
import { User, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
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
  ArrowLeft,
  X
} from 'lucide-react';
import { AppView, UserProfile } from '../src/types';
import { motion, AnimatePresence } from 'motion/react';
import { WorkerRegistration } from './WorkerRegistration';

interface AccountProps {
  user: User;
  onLogout: () => void;
  navigate: (view: AppView) => void;
  onUpdateProfile: () => void;
  setActiveMode?: (mode: 'customer' | 'worker') => void;
  profile?: UserProfile | null;
}

export const Account: React.FC<AccountProps> = ({ user, onLogout, navigate, onUpdateProfile, setActiveMode, profile: initialProfile }) => {
  const [loading, setLoading] = useState(true);
  const [activeSubView, setActiveSubView] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>(initialProfile || {
    uid: user.uid,
    name: user.displayName || '',
    email: user.email || '',
    photo: '',
    phone: ''
  });

  const fetchProfile = async () => {
    if (initialProfile) {
      setProfile(initialProfile);
      setLoading(false);
      return;
    }
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

  const renderSavedAddresses = () => {
    const addresses = profile.addresses || [];
    
    const handleDeleteAddress = async (index: number) => {
      if (!window.confirm('Delete this address?')) return;
      const newAddresses = [...addresses];
      newAddresses.splice(index, 1);
      try {
        await updateDoc(doc(db, 'users', user.uid), { addresses: newAddresses });
        fetchProfile();
      } catch (error) {
        console.error('Error deleting address:', error);
      }
    };

    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-full">
        {renderSubViewHeader('Saved Addresses')}
        
        <div className="space-y-4">
          {addresses.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <MapPin size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-500 font-bold">No saved addresses</p>
              <p className="text-xs text-gray-400 mt-1">Add your home or office address for faster booking</p>
            </div>
          ) : (
            addresses.map((addr: any, index: number) => (
              <div key={index} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{addr.type || 'Address'}</h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{addr.fullAddress}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteAddress(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            ))
          )}
          
          <button 
            onClick={() => setActiveSubView('add_address')}
            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm shadow-lg active:scale-[0.98] transition-all mt-4"
          >
            Add New Address
          </button>
        </div>
      </motion.div>
    );
  };

  const renderAddAddress = () => {
    const [type, setType] = useState('Home');
    const [fullAddress, setFullAddress] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
      if (!fullAddress) return alert('Please enter full address');
      setSaving(true);
      try {
        const newAddress = { type, fullAddress, createdAt: new Date().toISOString() };
        const currentAddresses = profile.addresses || [];
        await updateDoc(doc(db, 'users', user.uid), { 
          addresses: [...currentAddresses, newAddress] 
        });
        await fetchProfile();
        setActiveSubView('addresses');
      } catch (error) {
        console.error('Error saving address:', error);
      } finally {
        setSaving(false);
      }
    };

    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-full">
        {renderSubViewHeader('Add New Address')}
        
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Address Type</label>
            <div className="flex gap-3">
              {['Home', 'Work', 'Other'].map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${type === t ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white border border-gray-100 text-gray-500'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Full Address</label>
            <textarea
              value={fullAddress}
              onChange={(e) => setFullAddress(e.target.value)}
              placeholder="House No, Building Name, Street, Area..."
              className="w-full p-5 bg-white border border-gray-100 rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none h-32"
            />
          </div>

          <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
          >
            {saving ? 'Saving...' : 'Save Address'}
          </button>
        </div>
      </motion.div>
    );
  };

  const renderFavorites = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      {renderSubViewHeader('Favorites')}
      <div className="text-center py-10 text-gray-500">Favorites view...</div>
    </motion.div>
  );

  const renderWorkerRegistration = () => (
    <WorkerRegistration 
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
          profile.role === 'professional' ? (
            { icon: UserIcon, label: 'Switch to Worker Mode', id: 'switch_worker' }
          ) : (
            { icon: ShieldCheck, label: 'Join as a Professional', id: 'professional' }
          ),
          { icon: HelpCircle, label: 'Help & Support', id: 'help' },
          { icon: Info, label: 'About OrGo', id: 'about' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'switch_worker' && setActiveMode) {
                setActiveMode('worker');
                return;
              }
              setActiveSubView(item.id);
            }}
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
            {activeSubView === 'add_address' && renderAddAddress()}
            {activeSubView === 'favorites' && renderFavorites()}
            {activeSubView === 'professional' && renderWorkerRegistration()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
