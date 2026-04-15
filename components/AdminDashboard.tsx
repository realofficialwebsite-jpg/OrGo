import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  deleteDoc, 
  setDoc, 
  query, 
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
  AlertCircle
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
  phone: string;
  email: string;
  experience: string;
  category: string;
  createdAt: any;
}

export const AdminDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [pendingWorkers, setPendingWorkers] = useState<PendingWorker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;

    const q = query(collection(db, 'pendingWorkers'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const workers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PendingWorker[];
      setPendingWorkers(workers);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching pending workers:", error);
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
      // 1. Create worker in 'users' collection (or 'workers' as per request)
      // The request says 'workers' collection, but the app uses 'users' for profiles.
      // I will follow the request: 'workers' collection.
      await setDoc(doc(db, 'workers', worker.userId), {
        ...worker,
        status: 'approved',
        platformDues: 0,
        role: 'professional',
        isOnline: false,
        rating: 5.0,
        totalReviews: 0,
        approvedAt: new Date()
      });

      // 2. Delete from pending
      await deleteDoc(doc(db, 'pendingWorkers', worker.id));
      
      toast.success(`Worker ${worker.fullName} Approved!`);
    } catch (error) {
      console.error("Error approving worker:", error);
      toast.error("Approval failed");
    }
  };

  const handleReject = async (worker: PendingWorker) => {
    if (!window.confirm(`Are you sure you want to reject ${worker.fullName}?`)) return;
    
    try {
      await deleteDoc(doc(db, 'pendingWorkers', worker.id));
      toast.error("Application Rejected");
    } catch (error) {
      console.error("Error rejecting worker:", error);
      toast.error("Rejection failed");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 z-[200]">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm text-center"
        >
          <div className="w-20 h-20 bg-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-red-600/20">
            <Lock size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Admin Portal</h1>
          <p className="text-slate-400 mb-8">Enter security PIN to continue</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              maxLength={4}
              className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl py-4 text-center text-3xl tracking-[1em] text-white focus:border-red-600 outline-none transition-all"
              autoFocus
            />
            <button 
              type="submit"
              className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-red-600/20 active:scale-95 transition-all"
            >
              Unlock Dashboard
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-8 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Master KYC Control</h1>
            <p className="text-sm text-gray-500 mt-1">Review and approve worker applications</p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full font-bold text-xs">
            <ShieldCheck size={16} />
            System Secure
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={40} className="text-red-600 animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Loading applications...</p>
          </div>
        ) : pendingWorkers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Check size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-bold text-lg">All caught up!</p>
            <p className="text-gray-400 text-sm">No pending KYC applications found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {pendingWorkers.map((worker) => (
                <motion.div 
                  key={worker.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 flex flex-col"
                >
                  {/* Top Section */}
                  <div className="flex gap-4 mb-6">
                    <img 
                      src={worker.profilePhotoBase64 || 'https://picsum.photos/seed/worker/200'} 
                      alt={worker.fullName}
                      className="w-24 h-24 rounded-lg object-cover bg-gray-100"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">{worker.fullName}</h3>
                      <p className="text-sm text-gray-500 font-medium mt-1">Age: {worker.age}</p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded w-fit">
                        <Briefcase size={12} />
                        {worker.category}
                      </div>
                    </div>
                  </div>

                  {/* Middle Section (KYC Data) */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-6">
                    <div className="flex items-start gap-3">
                      <Contact size={16} className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Aadhaar Number</p>
                        <p className="text-sm font-bold text-slate-700">{worker.aadhaarNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Contact size={16} className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">PAN Number</p>
                        <p className="text-sm font-bold text-slate-700">{worker.panNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 border-t border-gray-200 pt-3">
                      <Briefcase size={16} className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Services Offered</p>
                        <p className="text-xs font-medium text-slate-600 leading-relaxed">
                          {worker.servicesOffered?.join(', ') || 'None specified'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Section (Action Buttons) */}
                  <div className="flex gap-3 mt-auto">
                    <button 
                      onClick={() => handleReject(worker)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-red-100 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors"
                    >
                      <X size={18} />
                      Reject
                    </button>
                    <button 
                      onClick={() => handleApprove(worker)}
                      className="flex-[1.5] flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-colors"
                    >
                      <Check size={18} />
                      Approve & Activate
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
