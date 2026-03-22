import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Loader2, User as UserIcon } from 'lucide-react';
import { User, updateProfile, updateEmail } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../src/firebase';
import { UserProfile } from '../src/types';

interface EditProfileModalProps {
  user: User;
  profile: UserProfile | null;
  onClose: () => void;
  onUpdate: () => Promise<void>;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, profile, onClose, onUpdate }) => {
  const [name, setName] = useState(profile?.name || user.displayName || '');
  const [email, setEmail] = useState(user.email || '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user.photoURL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      let newPhotoUrl = user.photoURL;

      if (photoFile) {
        const storageRef = ref(storage, `profilePhotos/${user.uid}`);
        await uploadBytes(storageRef, photoFile);
        newPhotoUrl = await getDownloadURL(storageRef);
      }

      const promises = [];

      if (name !== user.displayName || newPhotoUrl !== user.photoURL) {
        promises.push(updateProfile(user, { displayName: name, photoURL: newPhotoUrl }));
      }

      if (email !== user.email) {
        promises.push(updateEmail(user, email));
      }

      await Promise.all(promises);

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name,
        email,
        photoUrl: newPhotoUrl
      });

      await onUpdate();
      onClose();
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
            <button onClick={onClose} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg mb-4">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <UserIcon size={40} />
                  </div>
                )}
                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                  <Upload size={24} className="text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </label>
              </div>
              <p className="text-xs text-gray-500 font-medium">Tap to change photo</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-100 bg-gray-50">
            <button 
              onClick={handleSave}
              disabled={loading}
              className="w-full py-3.5 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-200 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
