import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, 
  TrendingUp, 
  Clock, 
  Star, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  User as UserIcon
} from 'lucide-react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../src/firebase';
import { UserProfile, Booking } from '../src/types';

interface WorkerWalletDashboardProps {
  user: User;
  profile: UserProfile;
}

export const WorkerWalletDashboard: React.FC<WorkerWalletDashboardProps> = ({ user, profile }) => {
  const [activeTab, setActiveTab] = useState<'Earnings' | 'Dues'>('Earnings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [workerProfile, setWorkerProfile] = useState<UserProfile>(profile);
  const [paymentInitiated, setPaymentInitiated] = useState(false);

  // Real-time listener for bookings
  useEffect(() => {
    if (!user.uid) return;
    const q = query(
      collection(db, 'order'),
      where('assignedWorkerId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      // Sort client-side to avoid needing a composite index
      orders.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      setBookings(orders);
    });

    return () => unsubscribe();
  }, [user.uid]);

  // Real-time listener for worker profile (for dues and payment status)
  useEffect(() => {
    if (!user.uid) return;
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        setWorkerProfile({ uid: doc.id, ...doc.data() } as UserProfile);
      }
    });
    return () => unsubscribe();
  }, [user.uid]);

  // Calculations for "Today"
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayCompletedJobs = bookings.filter(job => {
    if (job.status !== 'completed' || !job.completedAt) return false;
    const completionDate = job.completedAt.toDate ? job.completedAt.toDate() : new Date(job.completedAt);
    return completionDate >= today;
  });

  const totalEarningsToday = todayCompletedJobs.reduce((sum, job) => {
    const price = job.basePrice || job.grandTotal || 0;
    return sum + (price * 0.90);
  }, 0);

  const totalHoursToday = todayCompletedJobs.reduce((sum, job) => {
    if (!job.completedAt || !job.acceptedAt) return sum;
    const end = job.completedAt.toDate ? job.completedAt.toDate().getTime() : new Date(job.completedAt).getTime();
    const start = job.acceptedAt.toDate ? job.acceptedAt.toDate().getTime() : new Date(job.acceptedAt).getTime();
    const hours = (end - start) / (1000 * 60 * 60);
    return sum + hours;
  }, 0);

  const avgRating = workerProfile.ratingCount && workerProfile.totalRatingPoints 
    ? (workerProfile.totalRatingPoints / workerProfile.ratingCount).toFixed(1) 
    : (workerProfile.rating || 0).toFixed(1);

  const platformDues = workerProfile.platformDues || 0;
  const paymentStatus = workerProfile.paymentStatus || 'pending';

  const handlePaymentSuccess = async () => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        paymentStatus: 'under_review'
      });
      setPaymentInitiated(false);
    } catch (error) {
      console.error("Error updating payment status:", error);
    }
  };

  const upiLink = `upi://pay?pa=8440000190-4@ybl&pn=OrGo%20Services&am=${platformDues.toFixed(2)}&cu=INR&tn=OrGo_Dues_${user.uid}`;

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const isToday = date.toDateString() === new Date().toDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return isToday ? `Today, ${timeStr}` : `${date.toLocaleDateString()}, ${timeStr}`;
  };

  return (
    <div className="min-h-screen bg-white pb-32 overflow-y-auto no-scrollbar">
      {/* 1. The Premium Navy Header */}
      <div className="bg-slate-950 rounded-b-[2.5rem] pt-12 pb-20 px-6 relative shadow-2xl shadow-slate-900/20">
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-lg">
              <UserIcon size={20} className="text-white" />
            </div>
            <span className="text-white font-bold text-sm tracking-wide">My Dashboard</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/5">
            <TrendingUp size={20} className="text-red-500" />
          </div>
        </div>

        <div className="text-center">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mb-2">Today's Net Earnings</p>
          <h1 className="text-6xl font-black text-white tracking-tighter">₹{Math.round(totalEarningsToday)}</h1>
        </div>
      </div>

      {/* 2. Performance Ribbon */}
      <div className="relative z-10 -mt-8 mx-4">
        <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-6 border border-gray-50">
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            <div className="text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Jobs</p>
              <p className="text-lg font-black text-slate-950">{todayCompletedJobs.length}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Hours</p>
              <p className="text-lg font-black text-slate-950">{totalHoursToday.toFixed(1)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Rating</p>
              <p className="text-lg font-black text-slate-950 flex items-center justify-center gap-1">
                {avgRating} <Star size={14} className="fill-amber-400 text-amber-400" />
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Platform Dues Center (Red Themed) */}
      <div className="mt-6 mx-4">
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-950 uppercase tracking-widest">Platform Dues</h3>
              <p className="text-3xl font-black text-red-600 mt-1">₹{platformDues.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
              <AlertCircle size={24} className="text-red-600" />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {paymentStatus === 'under_review' ? (
              <motion.div 
                key="under_review"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center gap-2 py-6 bg-amber-50 rounded-2xl border border-amber-100"
              >
                <Clock size={32} className="text-amber-600 animate-pulse" />
                <span className="text-sm font-bold text-amber-900 uppercase tracking-widest">Payment Under Review</span>
                <p className="text-[10px] text-amber-600 font-medium">We are verifying your payment</p>
              </motion.div>
            ) : paymentInitiated ? (
              <motion.div 
                key="initiated"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <p className="text-center text-sm font-bold text-slate-900">Did your payment succeed?</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setPaymentInitiated(false)}
                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold text-xs uppercase tracking-widest"
                  >
                    No
                  </button>
                  <button 
                    onClick={handlePaymentSuccess}
                    className="flex-[2] py-4 bg-red-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-red-600/20"
                  >
                    Yes, I Paid
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.a 
                key="pay-button"
                href={upiLink}
                onClick={() => setPaymentInitiated(true)}
                className="block w-full py-4 bg-red-600 text-white text-center rounded-2xl font-black text-sm shadow-lg shadow-red-600/20 active:scale-[0.98] transition-all uppercase tracking-widest"
              >
                Pay Dues via UPI
              </motion.a>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 5. Segmented Transaction History */}
      <div className="mt-8 px-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-slate-950">Recent Activity</h3>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {(['Earnings', 'Dues'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                  activeTab === tab 
                    ? 'bg-white text-red-600 shadow-sm' 
                    : 'text-gray-400'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {bookings
            .filter(t => t.status === 'completed')
            .map((t) => {
              const price = t.basePrice || t.grandTotal || 0;
              const earning = price * 0.90;
              const due = price * 0.10;
              
              return (
                <motion.div 
                  key={t.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-50 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100">
                      <img 
                        src={t.userPhotoUrl || 'https://ui-avatars.com/api/?name=' + (t.customerName || 'User') + '&background=e2e8f0&color=0f172a'} 
                        alt="User" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-950">{t.cartItems?.[0]?.title || 'Service'}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{formatDate(t.completedAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black ${
                      activeTab === 'Earnings' ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {activeTab === 'Earnings' ? '+' : '-'} ₹{(activeTab === 'Earnings' ? earning : due).toFixed(2)}
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Success</span>
                      <CheckCircle2 size={10} className="text-emerald-500" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          
          {bookings.filter(t => t.status === 'completed').length === 0 && (
            <div className="text-center py-10 text-gray-400">
              <p className="text-xs font-bold uppercase tracking-widest">No transactions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
