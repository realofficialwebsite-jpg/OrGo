import React, { useEffect, useState } from 'react';
import { User, signOut, deleteUser } from 'firebase/auth';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
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
  X,
  Wrench,
  Plus,
  Trash2,
  RefreshCw,
  Layout,
  Edit2
} from 'lucide-react';
import { AppView, UserProfile } from '../src/types';
import { motion, AnimatePresence } from 'motion/react';
import { WorkerOnboarding } from './WorkerOnboarding';
import { APP_CATEGORIES } from '../src/constants';

interface AccountProps {
  user: User;
  onLogout: () => void;
  navigate: (view: AppView) => void;
  onUpdateProfile: () => void;
  setActiveMode?: (mode: 'customer' | 'worker') => void;
  profile?: UserProfile | null;
  favorites: string[];
  toggleFavorite: (id: string) => void;
}

export const Account: React.FC<AccountProps> = ({ user, onLogout, navigate, onUpdateProfile, setActiveMode, profile: initialProfile, favorites, toggleFavorite }) => {
  const [loading, setLoading] = useState(true);
  const [activeSubView, setActiveSubView] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>(initialProfile || {
    uid: user.uid,
    name: user.displayName || '',
    email: user.email || '',
    photo: '',
    phone: ''
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editData, setEditData] = useState({ name: '', email: '', photo: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Hooks moved from sub-render functions to comply with Rules of Hooks
  const [editingAddress, setEditingAddress] = useState<{data: any, index: number} | null>(null);
  const [addressFormData, setAddressFormData] = useState({
    id: '',
    name: '',
    phone: '',
    flatNo: '',
    street: '',
    landmark: '',
    city: '',
    pincode: '',
    state: '',
    type: 'Home' as 'Home' | 'Work' | 'Other'
  });
  const [savingAddress, setSavingAddress] = useState(false);

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

  useEffect(() => {
    if (profile) {
      setEditData({ 
        name: profile.name || '', 
        email: profile.email || '', 
        photo: profile.photo || '' 
      });
    }
  }, [profile]);

  useEffect(() => {
    if (activeSubView === 'add_address') {
      setEditingAddress(null);
      setAddressFormData({
        id: '',
        name: '',
        phone: '',
        flatNo: '',
        street: '',
        landmark: '',
        city: '',
        pincode: '',
        state: '',
        type: 'Home'
      });
    }
  }, [activeSubView]);

  useEffect(() => {
    if (editingAddress) {
      setAddressFormData(editingAddress.data);
    }
  }, [editingAddress]);

  const handleUpdateProfile = async () => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: editData.name,
        email: editData.email,
        photo: editData.photo
      });
      setIsEditingProfile(false);
      onUpdateProfile();
      fetchProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action is irreversible and all your data (profile, addresses, favorites) will be permanently lost.')) return;
    
    setIsDeleting(true);
    try {
      // 1. Delete Firestore document
      await deleteDoc(doc(db, 'users', user.uid));
      
      // 2. Delete Firebase Auth user
      await deleteUser(user);
      
      onLogout();
    } catch (error: any) {
      console.error("Error deleting account:", error);
      if (error.code === 'auth/requires-recent-login') {
        alert("For security reasons, you must have recently logged in to delete your account. Please logout and login again, then try deleting your account.");
      } else {
        alert("Failed to delete account: " + (error.message || "Unknown error"));
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const getDisplayPhone = () => {
    if (profile.addresses && profile.addresses.length > 0) {
      return profile.addresses[0].phone || profile.phone || 'No phone added';
    }
    return profile.phone || 'Add Mobile Number';
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="animate-spin text-primary" size={32} />
      </div>
    );
  }

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

    if (editingAddress) {
      return renderAddAddress(editingAddress.data, editingAddress.index);
    }

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
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900">{addr.type || 'Address'}</h4>
                      {addr.name && <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500 font-bold uppercase">{addr.name}</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      {addr.flatNo}, {addr.street}, {addr.landmark && `${addr.landmark}, `}{addr.city}, {addr.state} - {addr.pincode}
                    </p>
                    {addr.phone && <p className="text-[10px] text-gray-400 mt-1 font-bold">Phone: {addr.phone}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => setEditingAddress({ data: addr, index })}
                    className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDeleteAddress(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
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

  const renderAddAddress = (editAddress?: any, editIndex?: number) => {
    const handleSave = async () => {
      if (!addressFormData.flatNo || !addressFormData.street || !addressFormData.city || !addressFormData.pincode) {
        return alert('Please fill in all required fields (Flat No, Street, City, Pincode)');
      }
      setSavingAddress(true);
      try {
        const currentAddresses = [...(profile.addresses || [])];
        if (editIndex !== undefined) {
          currentAddresses[editIndex] = { 
            ...addressFormData, 
            id: addressFormData.id || currentAddresses[editIndex].id,
            updatedAt: new Date().toISOString() 
          };
        } else {
          const newAddress = { 
            ...addressFormData, 
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString() 
          };
          currentAddresses.push(newAddress);
        }
 
        await updateDoc(doc(db, 'users', user.uid), { 
          addresses: currentAddresses 
        });
        await fetchProfile();
        setActiveSubView('addresses');
        setEditingAddress(null);
      } catch (error) {
        console.error('Error saving address:', error);
      } finally {
        setSavingAddress(false);
      }
    };
 
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-full pb-10">
        {renderSubViewHeader(editIndex !== undefined ? 'Edit Address' : 'Add New Address')}
        
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Address Type</label>
            <div className="flex gap-3">
              {['Home', 'Work', 'Other'].map(t => (
                <button
                  key={t}
                  onClick={() => setAddressFormData((prev: any) => ({ ...prev, type: t as any }))}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${addressFormData.type === t ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white border border-gray-100 text-gray-500'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
 
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Receiver Name</label>
              <input
                type="text"
                value={addressFormData.name}
                onChange={(e) => setAddressFormData((prev: any) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. John Doe"
                className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
              <input
                type="tel"
                value={addressFormData.phone}
                onChange={(e) => setAddressFormData((prev: any) => ({ ...prev, phone: e.target.value }))}
                placeholder="10-digit number"
                className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
 
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Flat / House No.</label>
              <input
                type="text"
                value={addressFormData.flatNo}
                onChange={(e) => setAddressFormData((prev: any) => ({ ...prev, flatNo: e.target.value }))}
                placeholder="e.g. A-101"
                className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Pincode</label>
              <input
                type="text"
                value={addressFormData.pincode}
                onChange={(e) => setAddressFormData((prev: any) => ({ ...prev, pincode: e.target.value }))}
                placeholder="6-digit pincode"
                className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
 
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Street / Area</label>
            <input
              type="text"
              value={addressFormData.street}
              onChange={(e) => setAddressFormData((prev: any) => ({ ...prev, street: e.target.value }))}
              placeholder="e.g. MG Road, Sector 5"
              className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
 
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Landmark (Optional)</label>
            <input
              type="text"
              value={addressFormData.landmark}
              onChange={(e) => setAddressFormData((prev: any) => ({ ...prev, landmark: e.target.value }))}
              placeholder="e.g. Near City Mall"
              className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
 
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">City</label>
              <input
                type="text"
                value={addressFormData.city}
                onChange={(e) => setAddressFormData((prev: any) => ({ ...prev, city: e.target.value }))}
                placeholder="e.g. Mumbai"
                className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">State</label>
              <input
                type="text"
                value={addressFormData.state}
                onChange={(e) => setAddressFormData((prev: any) => ({ ...prev, state: e.target.value }))}
                placeholder="e.g. Maharashtra"
                className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
 
          <button 
            onClick={handleSave}
            disabled={savingAddress}
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
          >
            {savingAddress ? 'Saving...' : (editIndex !== undefined ? 'Update Address' : 'Save Address')}
          </button>
        </div>
      </motion.div>
    );
  };

  const renderFavorites = () => {
    const allServices = APP_CATEGORIES.flatMap(cat => cat.subCategories.flatMap(sub => sub.items));
    const favoriteServices = allServices.filter(item => favorites.includes(item.id));

    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
        {renderSubViewHeader('Favorites')}
        <div className="p-5 space-y-4">
          {favoriteServices.length > 0 ? (
            favoriteServices.map(item => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4">
                  <img src={item.imageUrl} alt={item.title} className="w-16 h-16 rounded-xl object-cover" referrerPolicy="no-referrer" />
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{item.title}</h4>
                    <p className="text-xs text-gray-500">₹{item.price}</p>
                  </div>
                </div>
                <button onClick={() => toggleFavorite(item.id)} className="p-2 text-red-500">
                  <Heart size={20} className="fill-red-500" />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-500">No favorites yet.</div>
          )}
        </div>
      </motion.div>
    );
  };

  const renderWorkerRegistration = () => (
    <WorkerOnboarding 
      onComplete={() => {
        setActiveSubView(null);
        onUpdateProfile();
        fetchProfile();
      }}
      onCancel={() => setActiveSubView(null)}
    />
  );

  const renderHelp = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-full">
      {renderSubViewHeader('Help & Support')}
      <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-6 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary mb-4">
          <HelpCircle size={32} />
        </div>
        <p className="text-gray-600 leading-relaxed">
          For any issues with your booking or technical support, please contact us. Our team is available 24/7 to assist you.
        </p>
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Email Support</p>
          <p className="text-lg font-bold text-gray-900">queries.girish@gmail.com</p>
        </div>
        <button 
          onClick={() => window.location.href = "mailto:queries.girish@gmail.com"}
          className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
        >
          Email Support
        </button>
      </div>
    </motion.div>
  );

  const renderAbout = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col h-full">
      {renderSubViewHeader('About OrGo')}
      <div className="flex-1 p-6 bg-white rounded-3xl border border-gray-100 shadow-sm text-center flex flex-col items-center justify-center">
        <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center text-white mb-6 shadow-xl shadow-primary/20">
          <Wrench size={40} />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">OrGo</h3>
        <p className="text-gray-600 leading-relaxed mb-8">
          OrGo is a professional on-demand home service platform designed to bridge the gap between skilled service providers and households. We provide reliable AC repair, plumbing, and housekeeping services at the tap of a button.
        </p>
      </div>
      <div className="mt-auto py-6 text-center">
        <p className="text-sm text-gray-400 font-medium">Developed by Girish Sharma</p>
      </div>
    </motion.div>
  );

  return (
    <div className="pb-24">
      <div className="bg-white p-8 border-b border-gray-100 text-center">
        <div className="relative inline-block mb-4">
          <div className="w-24 h-24 bg-primary/10 rounded-[32px] flex items-center justify-center text-primary border-4 border-white shadow-xl overflow-hidden">
            {profile.photo ? (
              <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <UserIcon size={40} />
            )}
          </div>
          <button className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-lg border border-gray-100 text-primary">
            <Edit2 size={16} />
          </button>
        </div>

        {isEditingProfile ? (
          <div className="space-y-4 max-w-xs mx-auto">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-left px-1">Full Name</label>
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-center font-bold text-lg focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="Your Name"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-left px-1">Email Address</label>
              <input
                type="email"
                value={editData.email}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-center text-gray-600 focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="Your Email"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-left px-1">Photo URL</label>
              <input
                type="text"
                value={editData.photo}
                onChange={(e) => setEditData({ ...editData, photo: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-center text-xs text-gray-500 focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="Photo URL"
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsEditingProfile(false)}
                className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateProfile}
                className="flex-1 py-2 bg-primary text-white rounded-xl font-bold text-sm"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">{profile.name}</h1>
            <p className="text-gray-500 mb-6 flex items-center justify-center gap-2">
              {profile.email}
              <button onClick={() => setIsEditingProfile(true)} className="text-primary p-1">
                <Edit2 size={14} />
              </button>
            </p>
            
            <div className="inline-flex items-center gap-3 bg-primary/5 px-6 py-3 rounded-2xl border border-primary/10">
              <Phone className="text-primary" size={18} />
              <span className="font-bold text-primary">{getDisplayPhone()}</span>
            </div>
          </>
        )}
      </div>

      <div className="p-6 space-y-2">
        {[
          { icon: MapPin, label: 'Saved Addresses', id: 'addresses' },
          { icon: Heart, label: 'Favorites', id: 'favorites' },
          profile.role === 'professional' ? (
            { icon: RefreshCw, label: 'Switch to Worker Mode', id: 'switch_worker' }
          ) : (
            { icon: ShieldCheck, label: 'Join as a Professional', id: 'professional' }
          ),
          { icon: HelpCircle, label: 'Help & Support', id: 'help' },
          { icon: Info, label: 'About OrGo', id: 'about' },
        ].filter(Boolean).map((item: any) => (
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
        <button 
          onClick={handleDeleteAccount}
          disabled={isDeleting}
          className="w-full p-4 flex items-center justify-center gap-2 text-red-400 font-bold text-sm hover:text-red-600 transition-colors"
        >
          {isDeleting ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
          Delete Account
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
            {activeSubView === 'help' && renderHelp()}
            {activeSubView === 'about' && renderAbout()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
