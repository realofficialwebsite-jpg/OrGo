import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  UserCredential,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../src/firebase';
import { Lock, Mail, User as UserIcon, AlertCircle, CheckCircle } from 'lucide-react';

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
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} />
                <span className="font-bold">Error</span>
              </div>
              <p>{error}</p>
              {error.includes('billing-not-enabled') && (
                <div className="mt-2 p-2 bg-white rounded border border-red-100 text-xs">
                  <p className="font-bold mb-1">💡 Solution:</p>
                  <p>Firebase now requires a <b>Blaze (Paid) Plan</b> for SMS authentication in many regions. You can use <b>Google Login</b> or <b>Email</b> instead, which are completely free.</p>
                </div>
              )}
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
              </>
            )}

            {(mode === 'LOGIN' || mode === 'SIGNUP' || mode === 'FORGOT') && (
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
            )}

            {(mode === 'LOGIN' || mode === 'SIGNUP') && (
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
            <div className="mt-4 flex flex-col gap-2 text-center">
              <button 
                onClick={() => setMode('FORGOT')}
                className="text-gray-500 text-xs font-medium hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3">
            {(mode === 'LOGIN' || mode === 'SIGNUP') && (
                <>
                <button 
                  type="button" 
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full border border-gray-300 py-3 rounded-lg flex items-center justify-center gap-2 text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
                >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                    Continue with Google
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