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
      
      // THIS IS THE TRICK: Force a popup on the phone with the real error details
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
                <div className="absolute top-2 left-2 bg-white p-2 rounded-full shadow-md border border-red-50 z-30">
                  <Sparkles size={20} className="text-red-600" strokeWidth={1.5} />
                </div>
              </div>
            )}
          </div>

          <div className="mb-5 text-center shrink-0">
            <h2 className="text-2xl font-display font-bold text-[#0A192F] mb-1 tracking-tight">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-xs text-[#0A192F]/70 font-medium">
              {isLogin ? 'Login to your OrGo account.' : 'Join OrGo for premium services.'}
            </p>
          </div>
          
          {message && (
            <div className="bg-green-50 text-green-700 p-3 rounded-xl text-xs font-bold mb-4 border border-green-100 text-center shrink-0">
              {message}
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold mb-4 border border-red-100 text-center shrink-0">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-3 shrink-0">
            {!isLogin && (
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-[#0A192F] uppercase tracking-wider mb-1 ml-1">Full Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="w-full p-3 border border-[#0A192F]/20 rounded-xl text-sm text-[#0A192F] outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 bg-transparent transition-all" 
                  required
                />
              </div>
            )}

            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-[#0A192F] uppercase tracking-wider mb-1 ml-1">Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="w-full p-3 border border-[#0A192F]/20 rounded-xl text-sm text-[#0A192F] outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 bg-transparent transition-all" 
                required
              />
            </div>
            
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-1 ml-1">
                <label className="text-[10px] font-bold text-[#0A192F] uppercase tracking-wider">Password</label>
                {isLogin && (
                  <button type="button" onClick={handleForgotPassword} className="text-[10px] font-bold text-red-600 hover:text-red-700 transition-colors">Forgot?</button>
                )}
              </div>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full p-3 border border-[#0A192F]/20 rounded-xl text-sm text-[#0A192F] outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 bg-transparent transition-all" 
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-3 bg-red-600 text-white text-sm font-bold rounded-full shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all active:scale-[0.98] border border-transparent disabled:opacity-50 mt-2"
            >
              {loading ? 'Processing...' : (isLogin ? 'Login' : 'Create Account')}
            </button>
          </form>

          <div className="relative flex items-center justify-center my-5 shrink-0">
            <div className="absolute w-full h-px bg-[#0A192F]/10"></div>
            <span className="relative bg-white px-4 text-[10px] font-bold text-[#0A192F]/40 uppercase tracking-widest">Or</span>
          </div>

          <button 
            type="button" 
            onClick={handleGoogleLogin} 
            disabled={loading} 
            className="w-full py-3 bg-white border border-[#0A192F]/10 text-[#0A192F] text-sm font-bold rounded-full mb-4 flex items-center justify-center gap-3 shadow-[0_4px_14px_0_rgba(10,25,47,0.05)] hover:shadow-[0_6px_20px_rgba(10,25,47,0.08)] transition-all active:scale-[0.98] disabled:opacity-50 shrink-0"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-4 h-4" />
            Continue with Google
          </button>

          <div className="text-center mt-auto pt-2 pb-4 shrink-0">
            <button 
              type="button" 
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setMessage(null);
              }} 
              className="text-xs font-bold text-[#0A192F]/60 hover:text-[#0A192F] transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
