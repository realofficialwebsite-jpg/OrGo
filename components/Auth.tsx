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
import { Lock, Mail, User as UserIcon, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthProps {
  onLoginSuccess: () => void;
}

type AuthMode = 'LOGIN' | 'SIGNUP' | 'FORGOT';

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user document exists, if not create it
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
          await setDoc(userDocRef, {
              name: user.displayName || 'User',
              email: user.email || '',
              photo: user.photoURL || '',
              phone: user.phoneNumber || '', 
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

  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResendVerification = async () => {
    if (cooldown > 0) return;

    const targetEmail = email || sentEmail;
    if (!targetEmail) {
      setError("Please enter your email address first.");
      return;
    }
    setResendLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, targetEmail, password);
      await sendEmailVerification(userCredential.user);
      await signOut(auth);
      setMessage("Verification email resent! Please check your inbox.");
      setError("");
      setCooldown(60); // 60 seconds cooldown
    } catch (err: any) {
      if (err.code === 'auth/too-many-requests') {
        setError("Too many requests. Please wait a few minutes before trying again.");
        setCooldown(60);
      } else {
        setError("Failed to resend verification email: " + err.message.replace('Firebase: ', ''));
      }
    } finally {
      setResendLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === 'LOGIN') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (!user.emailVerified) {
          await signOut(auth);
          setError("Please verify your email address before logging in. Check your inbox for the verification link.");
          setLoading(false);
          return;
        }

        // Check if user document exists, if not create it (sync legacy users or external auth)
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            await setDoc(userDocRef, {
                name: user.displayName || 'User',
                email: user.email,
                photo: user.photoURL || '',
                phone: '', 
                addresses: [],
                createdAt: new Date().toISOString()
            });
        }

        onLoginSuccess();
      } else if (mode === 'SIGNUP') {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update Auth Profile
        await updateProfile(user, {
            displayName: fullName
        });
        
        // Create Firestore Document
        await setDoc(doc(db, "users", user.uid), {
            name: fullName,
            email: email,
            photo: '',
            addresses: [],
            createdAt: new Date().toISOString()
        });

        await sendEmailVerification(user);
        
        // Sign out after signup to enforce verification
        await signOut(auth);
        
        setSentEmail(email);
        setVerificationSent(true);
      } else if (mode === 'FORGOT') {
        await sendPasswordResetEmail(auth, email);
        setMessage("Password reset email sent! Check your inbox.");
        setMode('LOGIN');
      }
    } catch (err: any) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-sans max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {verificationSent ? (
          <motion.div
            key="verification"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full text-center"
          >
            <div className="w-20 h-20 bg-green-50 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
              <CheckCircle size={40} strokeWidth={2.5} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4 font-display">Verify your email</h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              We've sent a verification link to <br/>
              <span className="font-bold text-gray-900">{sentEmail}</span>. <br/>
              Please verify to continue.
            </p>
            
            {message && (
              <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-6 text-sm font-bold">
                {message}
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-bold">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={() => {
                  setVerificationSent(false);
                  setMode('LOGIN');
                  setMessage(null);
                  setError(null);
                }}
                className="btn-primary w-full"
              >
                Back to Login
              </button>
              
              <button
                onClick={handleResendVerification}
                disabled={resendLoading || cooldown > 0}
                className="w-full text-gray-400 py-2 text-sm font-bold hover:text-primary transition-colors disabled:opacity-50"
              >
                {resendLoading ? "Sending..." : (cooldown > 0 ? `Resend in ${cooldown}s` : "Didn't get it? Resend Email")}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="auth-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full"
          >
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary rounded-2xl mb-6">
                <Sparkles size={32} strokeWidth={2.5} />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight font-display mb-2">OrGo</h1>
              <p className="text-gray-500 font-medium">Professional Home Services</p>
            </div>

            <div className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900 font-display">
                  {mode === 'LOGIN' && 'Welcome back'}
                  {mode === 'SIGNUP' && 'Create account'}
                  {mode === 'FORGOT' && 'Reset password'}
                </h2>
                <p className="text-sm text-gray-500">
                  {mode === 'LOGIN' && 'Sign in to access your bookings'}
                  {mode === 'SIGNUP' && 'Join us for premium home services'}
                  {mode === 'FORGOT' && 'Enter your email to get a reset link'}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3 text-sm border border-red-100">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold mb-1">Error</p>
                    <p className="font-medium opacity-90">{error}</p>
                    {error.includes("verify your email") && (
                      <button
                        onClick={handleResendVerification}
                        disabled={resendLoading || cooldown > 0}
                        className="mt-2 text-xs font-bold underline decoration-2 underline-offset-2"
                      >
                        {resendLoading ? "Sending..." : (cooldown > 0 ? `Resend in ${cooldown}s` : "Resend verification email")}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {message && (
                <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-3 text-sm border border-green-100">
                  <CheckCircle size={18} className="shrink-0" />
                  <span className="font-bold">{message}</span>
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-5">
                {mode === 'SIGNUP' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Full Name</label>
                    <div className="relative group">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                      <input
                        type="text"
                        placeholder="John Doe"
                        className="input-field pl-11"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                    <input
                      type="email"
                      placeholder="name@example.com"
                      className="input-field pl-11"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {(mode === 'LOGIN' || mode === 'SIGNUP') && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Password</label>
                      {mode === 'LOGIN' && (
                        <button type="button" onClick={() => setMode('FORGOT')} className="text-[10px] font-bold text-primary uppercase tracking-wider hover:underline">Forgot?</button>
                      )}
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="input-field pl-11"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                {mode === 'SIGNUP' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Confirm Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="input-field pl-11"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full mt-4"
                >
                  {loading ? 'Processing...' : (
                    mode === 'LOGIN' ? 'Sign In' : 
                    mode === 'SIGNUP' ? 'Create Account' : 'Reset Password'
                  )}
                </button>
              </form>

              <div className="pt-4">
                <div className="relative flex items-center justify-center mb-8">
                  <div className="absolute w-full h-px bg-gray-100"></div>
                  <span className="relative bg-white px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Or continue with</span>
                </div>

                <button 
                  type="button" 
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full bg-white border border-gray-200 py-3.5 rounded-xl flex items-center justify-center gap-3 text-gray-700 font-bold hover:bg-gray-50 transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm"
                >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                    Google Account
                </button>
              </div>

              <div className="text-center">
                {mode === 'LOGIN' ? (
                  <p className="text-gray-500 font-medium text-sm">
                    New to OrGo?{' '}
                    <button onClick={() => setMode('SIGNUP')} className="text-primary font-bold hover:underline">Create Account</button>
                  </p>
                ) : (
                  <p className="text-gray-500 font-medium text-sm">
                    Already have an account?{' '}
                    <button onClick={() => setMode('LOGIN')} className="text-primary font-bold hover:underline">Sign In</button>
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};