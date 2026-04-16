import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  signOut,
  GoogleAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../src/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { HardHat, User, Wrench, Hammer, Home, UserPlus, Sparkles } from 'lucide-react';
// Import the native Capacitor Google Auth plugin
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

interface AuthProps {
  onLoginSuccess: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      // THE BYPASS: Force the Client ID right before signing in so Android can't miss it
      GoogleAuth.initialize({
        clientId: '787837715214-bh93hp1tsncrd55m1784ta0bub9d8oti.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });

      // 1. Trigger the Native Android Account Picker
      const googleUser = await GoogleAuth.signIn();
      
      if (!googleUser || !googleUser.authentication || !googleUser.authentication.idToken) {
        throw new Error("Google Sign-In failed or was cancelled.");
      }

      // 2. Create the Firebase Credential using the Native Token
      const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
      
      // 3. Sign into Firebase safely inside the app
      const result = await signInWithCredential(auth, credential);
      const user = result.user;

      // 4. Save to Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
          await setDoc(userDocRef, {
              name: user.displayName || 'User',
              email: user.email || '',
              photo: user.photoURL || '',
              phone: user.phoneNumber || '', 
              city: '',
              addresses: [],
              createdAt: new Date().toISOString()
          });
      }

      onLoginSuccess();
    } catch (err: any) {
      console.error("Google Login Error:", err);
      
      // Keeping the popup debug trick just in case!
      const errorDetail = err.message || JSON.stringify(err);
      alert("FIREBASE ERROR: " + errorDetail);
      
      setError(errorDetail);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        if (!userCredential.user.emailVerified) {
          await signOut(auth);
          setError("Please verify your email before logging in.");
          setLoading(false);
          return;
        }

        const userDocRef = doc(db, "users", userCredential.user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            await setDoc(userDocRef, {
                name: userCredential.user.displayName || 'User',
                email: userCredential.user.email,
                photo: userCredential.user.photoURL || '',
                phone: '', 
                city: '',
                addresses: [],
                createdAt: new Date().toISOString()
            });
        }

        onLoginSuccess();
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        await updateProfile(userCredential.user, {
            displayName: name
        });
        
        await setDoc(doc(db, "users", userCredential.user.uid), {
            name: name,
            email: email,
            phone: '',
            city: '',
            photo: '',
            addresses: [],
            createdAt: new Date().toISOString()
        });

        await sendEmailVerification(userCredential.user);
        await signOut(auth);
        
        setIsLogin(true);
        setMessage("Verification email sent! Please check your inbox and verify your email before logging in.");
        setPassword(''); // Clear password for security
      }
    } catch (err: any) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent! Check your inbox.");
      setError(null);
    } catch (err: any) {
      setError(err.message.replace('Firebase: ', ''));
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 overflow-hidden bg-white relative max-w-md mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={isLogin ? 'login' : 'signup'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="w-full flex flex-col"
        >
          {/* Illustration */}
          <div className="w-full h-32 sm:h-40 mb-6 flex items-center justify-center shrink-0">
            {isLogin ? (
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-red-100 rounded-full shadow-inner"></div>
                <div className="absolute inset-2 border border-red-200 rounded-full border-dashed"></div>
                
                <div className="relative z-10 flex items-center justify-center">
                  <div className="relative flex flex-col items-center">
                    <HardHat size={42} className="text-red-600 drop-shadow-md z-20 relative -mb-3" strokeWidth={1.5} fill="#dc2626" />
                    <User size={54} className="text-[#0A192F] z-10" strokeWidth={1.5} />
                  </div>
                </div>
                
                <div className="absolute bottom-0 right-0 bg-white p-3 rounded-2xl shadow-lg border border-red-100 z-30 rotate-12">
                  <Wrench size={28} className="text-red-600" strokeWidth={1.5} />
                </div>
                <div className="absolute top-4 left-0 bg-white p-2 rounded-xl shadow-md border border-red-50 z-30 -rotate-12">
                  <Hammer size={20} className="text-[#0A192F]" strokeWidth={1.5} />
                </div>
              </div>
            ) : (
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-red-100 rounded-full shadow-inner"></div>
                
                <div className="relative z-10 flex items-center justify-center">
                  <Home size={64} className="text-[#0A192F]" strokeWidth={1.5} />
                </div>
                
                <div className="absolute bottom-0 right-0 bg-red-600 p-3 rounded-2xl shadow-lg border-2 border-white z-30 -rotate-6">
                  <UserPlus size={28} className="text-white" strokeWidth={1.5} />
                </div>
                <div className="absolute top-2 left-2 bg-white
