import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  UserCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore/lite';
import { auth, db } from '../firebase';
import { Lock, Mail, Phone, User as UserIcon, AlertCircle, CheckCircle } from 'lucide-react';

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
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === 'LOGIN') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Check if user document exists, if not create it (sync legacy users or external auth)
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            await setDoc(userDocRef, {
                name: user.displayName || 'User',
                email: user.email,
                photo: user.photoURL || '',
                phone: '', 
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
            phone: phone,
            createdAt: new Date().toISOString()
        });

        await sendEmailVerification(user);
        
        setMessage("Account created! Verification email sent.");
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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-red-600 p-8 text-center text-white">
          <h1 className="text-4xl font-bold tracking-tighter mb-2">OrGo</h1>
          <p className="text-red-100 font-medium">Home Services in Jaipur</p>
        </div>

        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            {mode === 'LOGIN' && 'Welcome Back'}
            {mode === 'SIGNUP' && 'Create Account'}
            {mode === 'FORGOT' && 'Reset Password'}
          </h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 flex items-center gap-2 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 flex items-center gap-2 text-sm">
              <CheckCircle size={16} />
              {message}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {mode === 'SIGNUP' && (
              <>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="tel"
                    placeholder="Phone (+91)"
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="email"
                placeholder="Email Address"
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {mode !== 'FORGOT' && (
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            )}

            {mode === 'SIGNUP' && (
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-red-700 transition disabled:opacity-50"
            >
              {loading ? 'Processing...' : (
                mode === 'LOGIN' ? 'Login' : 
                mode === 'SIGNUP' ? 'Sign Up' : 'Send Reset Link'
              )}
            </button>
          </form>

          {mode === 'LOGIN' && (
            <div className="mt-4 text-center">
              <button 
                onClick={() => setMode('FORGOT')}
                className="text-red-600 text-sm font-medium hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3">
            {(mode === 'LOGIN' || mode === 'SIGNUP') && (
                <>
                <button type="button" className="w-full border border-gray-300 py-3 rounded-lg flex items-center justify-center gap-2 text-gray-600 hover:bg-gray-50">
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                    Continue with Google
                </button>
                <button type="button" className="w-full border border-gray-300 py-3 rounded-lg flex items-center justify-center gap-2 text-gray-600 hover:bg-gray-50">
                    <img src="https://www.svgrepo.com/show/511330/apple-173.svg" alt="Apple" className="w-5 h-5" />
                    Continue with Apple
                </button>
                </>
            )}
          </div>

          <div className="mt-8 text-center text-gray-600">
            {mode === 'LOGIN' ? (
              <>
                Don't have an account?{' '}
                <button onClick={() => setMode('SIGNUP')} className="text-red-600 font-bold hover:underline">Create Account</button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button onClick={() => setMode('LOGIN')} className="text-red-600 font-bold hover:underline">Login</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};