import React, { useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  signOut,
  UserCredential,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../src/firebase';
import { motion, AnimatePresence } from 'motion/react';

interface AuthProps {
  onLoginSuccess: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(1); // 0: Login, 1: Intro, 2: Profile, 3: Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

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
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        await signOut(auth);
        setError("Please verify your email address before logging in.");
        setLoading(false);
        return;
      }

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
          await setDoc(userDocRef, {
              name: user.displayName || 'User',
              email: user.email,
              photo: user.photoURL || '',
              phone: '', 
              city: '',
              addresses: [],
              createdAt: new Date().toISOString()
          });
      }

      onLoginSuccess();
    } catch (err: any) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await updateProfile(user, {
          displayName: fullName
      });
      
      await setDoc(doc(db, "users", user.uid), {
          name: fullName,
          email: email,
          phone: phone,
          city: city,
          photo: '',
          addresses: [],
          createdAt: new Date().toISOString()
      });

      await sendEmailVerification(user);
      await signOut(auth);
      
      setStep(0);
      setMessage("Account created! Please check your email to verify your account before logging in.");
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

  const renderProgressDots = (currentStep: number) => (
    <div className="flex gap-2 justify-center w-full mb-8 mt-4">
      {[1, 2, 3].map((s) => (
        <div 
          key={s} 
          className={`h-1.5 rounded-full transition-all duration-300 ${s === currentStep ? 'w-6 bg-red-600' : 'w-1.5 bg-[#0A192F]/20'}`}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col items-center p-6 font-sans max-w-md mx-auto relative overflow-hidden">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full flex-1 flex flex-col"
          >
            {renderProgressDots(1)}

            <div className="w-full flex-1 flex flex-col items-center justify-center">
              {/* 
                INSTRUCTIONS FOR ADDING A MANUAL IMAGE:
                1. Import your local image at the top of the file:
                   import myCustomGraphic from '../assets/images/my-custom-graphic.png';
                2. Replace the 'src' attribute in the <img> tag below with {myCustomGraphic}
              */}
              <div className="relative w-full aspect-square max-h-72 mb-10 flex items-center justify-center p-4">
                <img 
                  src="https://illustrations.popsy.co/amber/location-tracking.svg" 
                  alt="OrGo Premium Illustration" 
                  className="w-full h-full object-contain drop-shadow-xl" 
                />
              </div>
              <h1 className="text-3xl font-display font-bold text-[#0A192F] mb-3 text-center tracking-tight">Welcome to OrGo</h1>
              <p className="text-sm text-[#0A192F]/70 mb-12 text-center font-medium">Effortless Organization. Premium Solutions.</p>
              
              <button 
                onClick={() => setStep(2)} 
                className="w-3/4 py-3.5 bg-white text-[#0A192F] border border-[#0A192F]/10 text-sm font-bold rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all active:scale-[0.98]"
              >
                Get Started
              </button>
              
              <div className="text-center mt-8">
                <button onClick={() => setStep(0)} className="text-xs font-bold text-[#0A192F]/60 hover:text-[#0A192F] transition-colors">
                  Already have an account? Login
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full flex-1 flex flex-col"
          >
            {renderProgressDots(2)}

            <div className="w-full h-40 mb-8 flex items-center justify-center p-2">
              <img 
                src="https://illustrations.popsy.co/amber/graphic-design.svg" 
                alt="Setup Profile" 
                className="w-full h-full object-contain drop-shadow-md" 
              />
            </div>

            <div className="w-full flex-1 flex flex-col">
              <h2 className="text-2xl font-display font-bold text-[#0A192F] mb-8 tracking-tight text-center">Setup Your Profile</h2>
              
              <div className="space-y-5 mb-10">
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-[#0A192F] uppercase tracking-wider mb-2 ml-1">First Name</label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full p-3.5 border border-[#0A192F]/20 rounded-2xl text-sm text-[#0A192F] outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 bg-transparent transition-all" 
                  />
                </div>
                
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-[#0A192F] uppercase tracking-wider mb-2 ml-1">Phone Number</label>
                  <div className="flex border border-[#0A192F]/20 rounded-2xl overflow-hidden focus-within:border-red-600 focus-within:ring-1 focus-within:ring-red-600 bg-transparent transition-all">
                    <div className="flex items-center gap-2 px-4 bg-[#0A192F]/[0.02] border-r border-[#0A192F]/10">
                      <span className="text-base">🇮🇳</span>
                      <span className="text-sm font-bold text-[#0A192F]">+91</span>
                    </div>
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full p-3.5 text-sm text-[#0A192F] outline-none bg-transparent" 
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-[#0A192F] uppercase tracking-wider mb-2 ml-1">City</label>
                  <input 
                    type="text" 
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full p-3.5 border border-[#0A192F]/20 rounded-2xl text-sm text-[#0A192F] outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 bg-transparent transition-all" 
                  />
                </div>
              </div>

              {error && <p className="text-xs text-red-600 text-center mb-4 font-medium">{error}</p>}

              <button 
                onClick={() => {
                  if (!fullName || !phone || !city) {
                    setError("Please fill in all fields.");
                    return;
                  }
                  setError(null);
                  setStep(3);
                }} 
                className="w-full py-3.5 bg-[#0A192F] text-white text-sm font-bold rounded-full shadow-lg shadow-red-600/10 hover:bg-[#0A192F]/90 transition-all active:scale-[0.98] border border-transparent hover:border-red-600/30"
              >
                Create Profile
              </button>

              <div className="text-center mt-auto pt-6">
                <button onClick={() => setStep(0)} className="text-xs font-bold text-[#0A192F]/60 hover:text-[#0A192F] transition-colors">
                  Already have an account? Login
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full flex-1 flex flex-col"
          >
            {renderProgressDots(3)}

            <div className="w-full flex-1 flex flex-col">
              <h2 className="text-2xl font-display font-bold text-[#0A192F] mb-3 tracking-tight text-center">Secure Your Account</h2>
              <p className="text-sm text-[#0A192F]/70 mb-10 text-center font-medium">Enter your email and create a password.</p>
              
              <form onSubmit={handleSignup} className="space-y-5 mb-10">
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-[#0A192F] uppercase tracking-wider mb-2 ml-1">Email Address</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="w-full p-3.5 border border-[#0A192F]/20 rounded-2xl text-sm text-[#0A192F] outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 bg-transparent transition-all" 
                    required
                  />
                </div>
                
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-[#0A192F] uppercase tracking-wider mb-2 ml-1">Password</label>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="w-full p-3.5 border border-[#0A192F]/20 rounded-2xl text-sm text-[#0A192F] outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 bg-transparent transition-all" 
                    required
                  />
                </div>

                {error && <p className="text-xs text-red-600 font-medium text-center">{error}</p>}

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full py-3.5 bg-[#0A192F] text-white text-sm font-bold rounded-full shadow-lg shadow-red-600/10 hover:bg-[#0A192F]/90 transition-all active:scale-[0.98] border border-transparent hover:border-red-600/30 disabled:opacity-50 mt-4"
                >
                  {loading ? 'Processing...' : 'Submit'}
                </button>
              </form>

              <div className="text-center mt-auto pt-6">
                <button type="button" onClick={() => setStep(2)} className="text-xs font-bold text-[#0A192F]/60 hover:text-[#0A192F] transition-colors">
                  Back to Profile Setup
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 0 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full flex-1 flex flex-col justify-center"
          >
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-display font-bold text-[#0A192F] mb-3 tracking-tight">Welcome Back</h2>
              <p className="text-sm text-[#0A192F]/70 font-medium">Login to your OrGo account.</p>
            </div>
            
            {message && (
              <div className="bg-green-50 text-green-700 p-3.5 rounded-2xl text-xs font-bold mb-8 border border-green-100 text-center">
                {message}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5 mb-8">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-[#0A192F] uppercase tracking-wider mb-2 ml-1">Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="w-full p-3.5 border border-[#0A192F]/20 rounded-2xl text-sm text-[#0A192F] outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 bg-transparent transition-all" 
                  required
                />
              </div>
              
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-2 ml-1">
                  <label className="text-[10px] font-bold text-[#0A192F] uppercase tracking-wider">Password</label>
                  <button type="button" onClick={handleForgotPassword} className="text-[10px] font-bold text-red-600 hover:text-red-700 transition-colors">Forgot?</button>
                </div>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="w-full p-3.5 border border-[#0A192F]/20 rounded-2xl text-sm text-[#0A192F] outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 bg-transparent transition-all" 
                  required
                />
              </div>

              {error && <p className="text-xs text-red-600 font-medium text-center">{error}</p>}

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-3.5 bg-[#0A192F] text-white text-sm font-bold rounded-full shadow-lg shadow-red-600/10 hover:bg-[#0A192F]/90 transition-all active:scale-[0.98] border border-transparent hover:border-red-600/30 disabled:opacity-50 mt-4"
              >
                {loading ? 'Processing...' : 'Login'}
              </button>
            </form>

            <div className="relative flex items-center justify-center mb-8">
              <div className="absolute w-full h-px bg-[#0A192F]/10"></div>
              <span className="relative bg-white px-4 text-[10px] font-bold text-[#0A192F]/40 uppercase tracking-widest">Or</span>
            </div>

            <button 
              type="button" 
              onClick={handleGoogleLogin} 
              disabled={loading} 
              className="w-full py-3.5 bg-white border border-[#0A192F]/10 text-[#0A192F] text-sm font-bold rounded-full mb-10 flex items-center justify-center gap-3 shadow-[0_4px_14px_0_rgba(10,25,47,0.05)] hover:shadow-[0_6px_20px_rgba(10,25,47,0.08)] transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-4 h-4" />
              Continue with Google
            </button>

            <div className="text-center mt-auto">
              <button type="button" onClick={() => setStep(1)} className="text-xs font-bold text-[#0A192F]/60 hover:text-[#0A192F] transition-colors">
                Don't have an account? Sign up
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};