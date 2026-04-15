import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  deleteDoc, 
  setDoc, 
  query, 
  serverTimestamp,
  orderBy 
} from 'firebase/firestore';
import { db } from '../src/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  X, 
  Check, 
  Trash2, 
  User, 
  Contact, 
  Briefcase, 
  Lock,
  Loader2,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

interface PendingWorker {
  id: string;
  userId: string;
  fullName: string;
  age: string;
  aadhaarNumber: string;
  panNumber: string;
  servicesOffered: string[];
  profilePhotoBase64: string;
  mobileNumber: string;
  email: string;
  yearsOfExperience: string;
  permanentAddress: string;
  faceScanBase64: string;
  createdAt: any;
}

export const AdminDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [pendingWorkers, setPendingWorkers] = useState<PendingWorker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;

    // CRITICAL BUG FIX: Ensure collection name is 'pendingWorkers' exactly
    const q = query(collection(db, 'pendingWorkers'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // CRITICAL BUG FIX: Proper data mapping
      const workers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PendingWorker[];
      setPendingWorkers(workers);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching pending workers:", error instanceof Error ? error.message : String(error));
      toast.error("Failed to load applications");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '8899') {
      setIsAuthenticated(true);
      toast.success("Access Granted");
    } else {
      toast.error("Invalid PIN");
      setPin('');
    }
  };

  const handleApprove = async (worker: PendingWorker) => {
    try {
      const mappedUserData = {
        name: worker.fullName || '',
        phone: worker.mobileNumber || '',
        email: worker.email || '',
        photo: worker.profilePhotoBase64 || '',
        skills: worker.servicesOffered || [],
        role: "professional",
        status: "approved",
        platformDues: 0,
        isOnline: false,
        createdAt: serverTimestamp(),
        age: worker.age || '',
        experience: worker.yearsOfExperience || '',
        // Keep the original KYC data for records just in case
        aadhaarNumber: worker.aadhaarNumber || '',
        panNumber: worker.panNumber || '',
        permanentAddress: worker.permanentAddress || '',
        faceScanBase64: worker.faceScanBase64 || ''
      };

      // 1. Save to the 'workers' collection (for the onboarding listener)
      await setDoc(doc(db, 'workers', worker.userId), mappedUserData);

      // 2. Also update the 'users' collection (for the main app profile)
      await setDoc(doc(db, 'users', worker.userId), mappedUserData);

      // 3. Delete from 'pendingWorkers'
      await deleteDoc(doc(db, 'pendingWorkers', worker.id));
      
      toast.success(`Worker ${worker.fullName} Approved!`);
    } catch (error) {
      console.error("Error approving worker:", error instanceof Error ? error.message : String(error));
      toast.error("Approval failed");
    }
  };

  const handleReject = async (worker: PendingWorker) => {
    if (!window.confirm(`Are you sure you want to reject ${worker.fullName}?`)) return;
    
    try {
      await deleteDoc(doc(db, 'pendingWorkers', worker.id));
      toast.error("Application Rejected");
    } catch (error) {
      console.error("Error rejecting worker:", error instanceof Error ? error.message : String(error));
      toast.error("Rejection failed");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex flex-col items-center justify-center p-6 z-[200]">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-sm"
        >
          <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-gray-100 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <Lock size={28} className="text-black" />
            </div>
            <h1 className="text-2xl font-black text-black mb-2">Admin Portal</h1>
            <p className="text-gray-400 text-sm mb-10">Secure access required</p>
            
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="relative">
                <input 
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter PIN"
                  maxLength={4}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 text-center text-2xl tracking-[0.5em] text-black focus:bg-white focus:border-black outline-none transition-all placeholder:tracking-normal placeholder:text-gray-300"
                  autoFocus
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg active:scale-95 transition-all shadow-lg shadow-black/10"
              >
                Continue
              </button>
            </form>
          </div>
          <p className="text-center text-gray-400 text-xs mt-8 font-medium uppercase tracking-widest">OrGo Security Systems</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white px-8 py-12 sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-black">Admin Dashboard</h1>
            <p className="text-gray-500 mt-2 font-medium">Worker application dashboard: approve and reject</p>
          </div>
          <div className="hidden md:flex items-center gap-3 bg-gray-50 px-5 py-2.5 rounded-2xl border border-gray-100">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Live System</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 size={32} className="text-black animate-spin mb-4" />
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Synchronizing Data...</p>
          </div>
        ) : pendingWorkers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border border-gray-100 shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <Check size={32} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-black text-black">Queue Empty</h3>
            <p className="text-gray-400 text-sm mt-2">No pending applications at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AnimatePresence mode="popLayout">
              {pendingWorkers.map((worker) => (
                <motion.div 
                  key={worker.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm hover:shadow-xl hover:shadow-black/5 transition-all group"
                >
                  {/* Top Section */}
                  <div className="flex items-start gap-6 mb-8">
                    <div className="relative">
                      <img 
                        src={worker.profilePhotoBase64 || 'https://picsum.photos/seed/worker/200'} 
                        alt={worker.fullName}
                        className="w-24 h-24 rounded-3xl object-cover bg-gray-50 border-4 border-white shadow-md"
                      />
                      <div className="absolute -bottom-2 -right-2 bg-black text-white text-[10px] font-black px-2 py-1 rounded-lg">
                        {worker.age}Y
                      </div>
                    </div>
                    <div className="flex-1 pt-2">
                      <h3 className="text-xl font-black text-black leading-tight">{worker.fullName}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Professional</span>
                        <span className="w-1 h-1 bg-gray-200 rounded-full" />
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{worker.yearsOfExperience} Exp</span>
                      </div>
                    </div>
                  </div>

                  {/* KYC Data Section */}
                  <div className="space-y-4 mb-10">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                      <div className="flex items-center gap-3">
                        <Contact size={18} className="text-gray-400" />
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Aadhaar</span>
                      </div>
                      <span className="text-sm font-black text-black">{worker.aadhaarNumber}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                      <div className="flex items-center gap-3">
                        <Contact size={18} className="text-gray-400" />
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">PAN</span>
                      </div>
                      <span className="text-sm font-black text-black">{worker.panNumber}</span>
                    </div>
                    <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100/50">
                      <div className="flex items-center gap-3 mb-3">
                        <Briefcase size={18} className="text-gray-400" />
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Services</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {worker.servicesOffered?.map((service, idx) => (
                          <span key={idx} className="text-[10px] font-bold bg-white border border-gray-200 text-gray-600 px-3 py-1 rounded-full">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleReject(worker)}
                      className="text-gray-400 hover:text-red-600 font-bold text-sm px-4 py-2 transition-colors flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      Reject
                    </button>
                    <button 
                      onClick={() => handleApprove(worker)}
                      className="flex-1 bg-black text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-black/10 hover:bg-gray-900 transition-all active:scale-95"
                    >
                      Approve & Activate
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};
