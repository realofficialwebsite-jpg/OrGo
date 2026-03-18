import React, { useEffect, useState } from 'react';
import { User, deleteUser, updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../src/firebase';
import { handleFirestoreError, OperationType } from '../utils/firestore-errors';
import { 
  LogOut, 
  User as UserIcon, 
  Mail, 
  Phone, 
  Camera, 
  Edit2, 
  Save, 
  X, 
  Trash2,
  ChevronRight,
  ClipboardList,
  MapPin,
  CreditCard,
  Settings,
  HelpCircle
} from 'lucide-react';
import { AppView, UserProfile } from '../src/types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface AccountProps {
  user: User;
  onLogout: () => void;
  navigate: (view: AppView) => void;
}

const SPENDING_DATA = [
  { name: 'Aug', amount: 500 },
  { name: 'Sep', amount: 1200 },
  { name: 'Oct', amount: 450 },
];

export const Account: React.FC<AccountProps> = ({ user, onLogout, navigate }) => {
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    uid: user.uid,
    name: user.displayName || '',
    email: user.email || '',
    photo: '',
    phone: ''
  });
  const [editForm, setEditForm] = useState<UserProfile>(profile);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          setProfile(data);
          setEditForm(data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user.uid]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, {
        name: editForm.name,
        phone: editForm.phone || '',
        photo: editForm.photo || ''
      });

      if (auth.currentUser && editForm.name !== user.displayName) {
        await updateProfile(auth.currentUser, { displayName: editForm.name });
      }

      setProfile(editForm);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirm = window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone.");
    if (confirm) {
      try {
        await deleteDoc(doc(db, 'users', user.uid));
        if (auth.currentUser) {
            await deleteUser(auth.currentUser);
        }
        onLogout();
      } catch (error) {
        console.error("Error deleting account:", error);
        handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}`);
      }
    }
  };

  if (loading && !profile.email) return <div className="p-8 text-center text-gray-500">Loading Profile...</div>;

  return (
    <div className="pb-24 p-4">
      {/* Profile Header */}
      <div className="flex items-start justify-between mb-8 mt-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-red-50 relative">
             {profile.photo ? (
                <img src={profile.photo} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
             ) : (
                <span className="text-red-600 text-2xl font-bold">{profile.name ? profile.name[0].toUpperCase() : 'U'}</span>
             )}
             {isEditing && (
                 <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                     <Camera size={20} className="text-white" />
                 </div>
             )}
          </div>
          <div>
            {!isEditing ? (
                <>
                    <h2 className="text-xl font-bold text-gray-800">{profile.name || 'User'}</h2>
                    <p className="text-gray-500 text-sm">{profile.email}</p>
                    {profile.phone && <p className="text-gray-400 text-xs mt-1">{profile.phone}</p>}
                </>
            ) : (
                <div className="flex flex-col gap-2">
                     <input 
                        type="text" 
                        value={editForm.name} 
                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                        className="border rounded px-2 py-1 text-sm font-bold w-40 focus:ring-red-500 outline-none"
                        placeholder="Name"
                     />
                     <input 
                        type="text" 
                        value={editForm.photo} 
                        onChange={e => setEditForm({...editForm, photo: e.target.value})}
                        className="border rounded px-2 py-1 text-xs w-40 focus:ring-red-500 outline-none"
                        placeholder="Photo URL"
                     />
                     <input 
                        type="tel" 
                        value={editForm.phone} 
                        onChange={e => setEditForm({...editForm, phone: e.target.value})}
                        className="border rounded px-2 py-1 text-xs w-40 focus:ring-red-500 outline-none"
                        placeholder="Phone"
                     />
                </div>
            )}
          </div>
        </div>
        
        {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="text-red-600 p-2 hover:bg-red-50 rounded-full">
                <Edit2 size={20} />
            </button>
        ) : (
            <div className="flex gap-2">
                <button onClick={() => setIsEditing(false)} className="text-gray-500 p-2 hover:bg-gray-100 rounded-full">
                    <X size={20} />
                </button>
                <button onClick={handleSave} disabled={loading} className="text-green-600 p-2 hover:bg-green-50 rounded-full">
                    <Save size={20} />
                </button>
            </div>
        )}
      </div>

      {/* Stats */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
          <h3 className="font-bold text-gray-800 mb-4">Spending Analysis</h3>
          <div className="h-40 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SPENDING_DATA}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: '#fee2e2'}} />
                    <Bar dataKey="amount" fill="#dc2626" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
            </ResponsiveContainer>
          </div>
      </div>

      {/* Menu Actions */}
      <div className="space-y-2 mb-8">
        {[
          { icon: ClipboardList, label: 'My Bookings', action: () => navigate(AppView.ORDERS) },
          { icon: MapPin, label: 'Saved Addresses' },
          { icon: CreditCard, label: 'Payment Methods' },
          { icon: Settings, label: 'Settings' },
          { icon: HelpCircle, label: 'Help & Support' },
        ].map((item, idx) => (
          <button 
            key={idx} 
            onClick={item.action} 
            className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:bg-gray-50 transition"
          >
             <div className="flex items-center gap-3 text-gray-700">
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
             </div>
             <ChevronRight size={18} className="text-gray-400" />
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <button onClick={onLogout} className="w-full py-3 bg-gray-200 text-gray-700 font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-gray-300 transition">
            <LogOut size={20} /> Logout
        </button>
        
        {isEditing && (
            <button onClick={handleDeleteAccount} className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-lg flex items-center justify-center gap-2 border border-red-200 hover:bg-red-100 transition">
                <Trash2 size={20} /> Delete Account
            </button>
        )}
      </div>
    </div>
  );
};