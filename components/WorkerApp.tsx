import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../src/firebase';
import { AppView, UserProfile, Booking } from '../src/types';
import { APP_CATEGORIES } from '../src/constants';
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  User as UserIcon, 
  History, 
  ClipboardList, 
  Activity,
  Power,
  ChevronRight,
  XCircle,
  Check,
  X,
  Navigation,
  LogOut,
  RefreshCw,
  Edit2,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { Tracking } from './Tracking';

interface WorkerAppProps {
  user: User;
  profile: UserProfile;
  onSwitchMode: () => void;
  onLogout: () => void;
  fetchProfile: () => void;
}

enum WorkerTab {
  REQUESTS = 'REQUESTS',
  MAP = 'MAP',
  HISTORY = 'HISTORY',
  PROFILE = 'PROFILE'
}

export const WorkerApp: React.FC<WorkerAppProps> = ({ user, profile, onSwitchMode, onLogout, fetchProfile }) => {
  const [activeTab, setActiveTab] = useState<WorkerTab>(WorkerTab.REQUESTS);
  const [isOnline, setIsOnline] = useState(profile.isOnline || false);
  const [requests, setRequests] = useState<Booking[]>([]);
  const [activeJobs, setActiveJobs] = useState<Booking[]>([]);
  const [history, setHistory] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditServices, setShowEditServices] = useState(false);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<Booking | null>(null);
  const [tempSkills, setTempSkills] = useState<string[]>(profile.skills || []);
  const [selectedRequest, setSelectedRequest] = useState<Booking | null>(null);

  useEffect(() => {
    if (showEditServices) {
      setTempSkills(profile.skills || []);
    }
  }, [showEditServices]); // Only run when modal opens

  useEffect(() => {
    setActiveTrackingOrder(prev => {
      if (!prev) return null;
      const updated = activeJobs.find(j => j.id === prev.id);
      if (updated) return updated;
      const inHistory = history.find(j => j.id === prev.id);
      if (inHistory) return inHistory;
      return null;
    });
  }, [activeJobs, history]);

  const allServices = Array.from(new Set(APP_CATEGORIES.flatMap(c => c.subCategories.flatMap(sc => sc.items.map(i => i.title)))));

  const totalJobs = history.filter(h => h.status === 'completed').length;
  const totalEarnings = history.filter(h => h.status === 'completed').reduce((sum, order) => sum + (order.grandTotal || 0), 0);
  const today = new Date().toDateString();
  const todayEarnings = history.filter(h => {
    if (h.status !== 'completed') return false;
    if (!h.createdAt) return false;
    const orderDate = h.createdAt?.toDate ? h.createdAt.toDate().toDateString() : new Date(h.createdAt).toDateString();
    return orderDate === today;
  }).reduce((sum, order) => sum + (order.grandTotal || 0), 0);

  useEffect(() => {
    if (!user) return;

    const qRequests = query(
      collection(db, 'order'),
      where('status', '==', 'searching')
    );

    const qActive = query(
      collection(db, 'order'),
      where('assignedWorkerId', '==', user.uid),
      where('status', '==', 'assigned')
    );

    const qHistory = query(
      collection(db, 'order'),
      where('assignedWorkerId', '==', user.uid),
      where('status', 'in', ['completed', 'cancelled'])
    );

    const unsubRequests = onSnapshot(qRequests, (snapshot) => {
      const allRequests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      const filtered = allRequests.filter(req => {
        const serviceName = req.cartItems?.[0]?.title;
        return profile.skills?.includes(serviceName);
      });
      // Sort by createdAt descending in memory
      filtered.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      setRequests(filtered);
      setLoading(false);
    });

    const unsubActive = onSnapshot(qActive, (snapshot) => {
      const jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      jobs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      setActiveJobs(jobs);
    });

    const unsubHistory = onSnapshot(qHistory, (snapshot) => {
      const hist = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      hist.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      setHistory(hist);
    });

    return () => {
      unsubRequests();
      unsubActive();
      unsubHistory();
    };
  }, [user, profile.skills]);

  const toggleOnline = async () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    try {
      await updateDoc(doc(db, 'users', user.uid), { isOnline: newStatus });
    } catch (error) {
      console.error('Error updating status:', error);
      setIsOnline(!newStatus);
    }
  };

  const handleSaveServices = async () => {
    try {
      await updateDoc(doc(db, 'users', user.uid), { skills: tempSkills });
      setShowEditServices(false);
      fetchProfile();
    } catch (error) {
      console.error('Error updating services:', error);
      alert('Failed to update services.');
    }
  };

  const handleOrderAction = async (orderId: string, action: 'accept' | 'reject') => {
    if (!orderId) return;
    try {
      const orderRef = doc(db, 'order', orderId);
      if (action === 'accept') {
        const workerData = {
          workerId: user.uid,
          name: profile.name,
          photo: profile.photo || 'https://picsum.photos/seed/worker/200',
          experience: profile.experience || '5',
          phone: profile.phone || '',
          rating: profile.rating || 0,
          totalReviews: profile.totalReviews || 0
        };
        await updateDoc(orderRef, {
          interestedWorkers: arrayUnion(workerData)
        });
        setSelectedRequest(null);
        setRequests(prev => prev.filter(r => r.id !== orderId));
        alert('Bid submitted! Waiting for customer to confirm.');
      } else {
        setSelectedRequest(null);
        setRequests(prev => prev.filter(r => r.id !== orderId));
      }
    } catch (error) {
      console.error(`Error updating order:`, error);
      alert('Failed to submit bid.');
    }
  };

  const handleCompleteJob = async (orderId: string) => {
    if (!orderId) return;
    try {
      await updateDoc(doc(db, 'order', orderId), { status: 'completed' });
    } catch (error) {
      console.error('Error completing job:', error);
    }
  };

  const renderRequests = () => {
    if (!isOnline) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Power size={32} />
          </div>
          <p className="font-bold text-sm uppercase tracking-widest">You are offline</p>
          <p className="text-xs mt-1">Go online to receive new jobs</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Bell size={32} />
            </div>
            <p className="font-bold text-sm uppercase tracking-widest">No new requests</p>
            <p className="text-xs mt-1">Stay online to receive new jobs</p>
          </div>
        ) : (
          requests.map(order => (
            <motion.div 
              key={order.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">New Request</p>
                  <h3 className="font-bold text-gray-900">{order?.cartItems?.[0]?.title}</h3>
                  <p className="text-xs text-gray-500">{order.address}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-gray-900">₹{order.grandTotal}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{order.scheduledDate}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleOrderAction(order.id, 'accept')}
                  className="flex-1 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-[10px] flex items-center justify-center gap-1 active:scale-95 transition-all"
                >
                  Accept
                </button>
                <button 
                  onClick={() => setSelectedRequest(order)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl text-[10px] flex items-center justify-center gap-1 active:scale-95 transition-all"
                >
                  Details
                </button>
                <button 
                  onClick={() => handleOrderAction(order.id, 'reject')}
                  className="flex-1 py-2.5 bg-red-50 text-red-600 font-bold rounded-xl text-[10px] flex items-center justify-center gap-1 active:scale-95 transition-all"
                >
                  Reject
                </button>
              </div>
            </motion.div>
          ))
        )}

        {/* Request Details Modal */}
        <AnimatePresence>
          {selectedRequest && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              >
                <div className="p-6 overflow-y-auto no-scrollbar">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-display font-bold text-gray-900">Order Context</h2>
                      <p className="text-sm text-gray-500 font-medium mt-1">Review all details before deciding</p>
                    </div>
                    <button 
                      onClick={() => setSelectedRequest(null)}
                      className="p-2 bg-gray-100 rounded-full text-gray-500"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Client Info */}
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Client Information</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-600">
                          <UserIcon size={20} />
                        </div>
                        <p className="font-bold text-gray-900">{selectedRequest.customerName || 'Customer'}</p>
                      </div>
                    </div>

                    {/* Job Info */}
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Job Information</p>
                      <h4 className="font-bold text-gray-900 mb-1">{selectedRequest.cartItems[0].title}</h4>
                      {selectedRequest.instructions && (
                        <p className="text-sm text-gray-600 mb-3">{selectedRequest.instructions}</p>
                      )}
                      {selectedRequest.imageUrl && (
                        <div className="mt-3 rounded-xl overflow-hidden border border-gray-200">
                          <img src={selectedRequest.imageUrl} alt="Problem" className="w-full h-40 object-cover" referrerPolicy="no-referrer" />
                        </div>
                      )}
                    </div>

                    {/* Logistics */}
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Logistics</p>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <MapPin size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                          <p className="text-sm font-medium text-gray-700">{selectedRequest.address}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Clock size={16} className="text-emerald-600 shrink-0" />
                          <p className="text-sm font-medium text-gray-700">
                            {selectedRequest.isInstant ? 'Instant Service' : `Scheduled: ${selectedRequest.scheduledDate} at ${selectedRequest.scheduledTime}`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Earnings */}
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Estimated Earnings</p>
                      <p className="text-2xl font-bold text-emerald-700">₹{selectedRequest.grandTotal}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                  <button 
                    onClick={() => handleOrderAction(selectedRequest.id!, 'reject')}
                    className="flex-1 py-4 bg-white text-red-600 border border-red-100 rounded-2xl font-bold text-sm active:scale-[0.98] transition-all"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => handleOrderAction(selectedRequest.id!, 'accept')}
                    className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all"
                  >
                    Accept Job
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderActiveJobs = () => (
    <div className="space-y-4">
      {activeJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Activity size={32} />
          </div>
          <p className="font-bold text-sm uppercase tracking-widest">No active jobs</p>
        </div>
      ) : (
        activeJobs.map(order => (
          <motion.div 
            key={order.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-900 text-white p-6 rounded-[32px] shadow-xl shadow-emerald-900/20"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Job in Progress</p>
                </div>
                <h3 className="text-xl font-bold font-display">{order?.cartItems?.[0]?.title}</h3>
                <p className="text-xs text-emerald-200/60 mt-1 flex items-center gap-1.5">
                  <MapPin size={12} /> {order.address}
                </p>
              </div>
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                <Navigation size={24} className="text-emerald-400" />
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/10">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-800 rounded-full flex items-center justify-center">
                    <UserIcon size={20} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Customer</p>
                    <p className="text-sm font-bold">Booking ID: #{order?.id?.slice(-6)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Earnings</p>
                  <p className="text-lg font-bold">₹{order.grandTotal}</p>
                </div>
              </div>
              <div 
                onClick={() => setActiveTrackingOrder(order)}
                className="h-40 bg-emerald-800/50 rounded-xl flex items-center justify-center border border-white/5 overflow-hidden relative cursor-pointer active:scale-[0.98] transition-all"
              >
                <img src="https://picsum.photos/seed/map/400/200" alt="Map" className="w-full h-full object-cover opacity-40 grayscale contrast-125" referrerPolicy="no-referrer" />
                <div className="absolute flex flex-col items-center">
                  <MapPin size={32} className="text-emerald-400 animate-bounce" />
                  <p className="text-[10px] font-bold uppercase tracking-widest mt-2">Open Map View</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => handleCompleteJob(order.id)}
              className="w-full py-4 bg-emerald-400 text-emerald-950 font-bold rounded-2xl shadow-lg shadow-emerald-400/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <CheckCircle2 size={20} /> Mark as Completed
            </button>
          </motion.div>
        ))
      )}
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-3">
      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <History size={32} />
          </div>
          <p className="font-bold text-sm uppercase tracking-widest">No history found</p>
        </div>
      ) : (
        history.map(order => (
          <div key={order.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${order.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {order.status === 'completed' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">{order?.cartItems?.[0]?.title}</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{order.scheduledDate}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900 text-sm">₹{order.grandTotal}</p>
              <div className="flex flex-col items-end gap-1">
                <p className={`text-[10px] font-bold uppercase tracking-widest ${order.status === 'completed' ? 'text-emerald-600' : 'text-red-600'}`}>{order.status}</p>
                {order.isRated && (
                  <div className="flex items-center gap-1 bg-yellow-50 px-1.5 py-0.5 rounded-md">
                    <Star size={10} className="text-yellow-500 fill-yellow-500" />
                    <span className="text-[10px] font-bold text-yellow-700">{order.rating}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col items-center">
        <div className="w-24 h-24 rounded-full bg-emerald-50 border-4 border-white shadow-xl overflow-hidden mb-4">
          <img src={profile.photo || 'https://picsum.photos/seed/worker/200'} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 font-display">{profile.name}</h2>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Professional Partner</p>
        
        <div className="grid grid-cols-3 gap-8 w-full mt-8 pt-8 border-t border-gray-50">
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">{profile.rating ? profile.rating.toFixed(1) : 'N/A'}</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Rating</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">{totalJobs}</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Jobs</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">₹{totalEarnings}</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Earned</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900">My Services & Skills</h3>
          <button 
            onClick={() => setShowEditServices(true)}
            className="text-emerald-600 text-xs font-bold uppercase tracking-widest flex items-center gap-1"
          >
            <Edit2 size={14} /> Edit
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.skills?.map(skill => (
            <span key={skill} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">
              {skill}
            </span>
          ))}
          {(!profile.skills || profile.skills.length === 0) && (
            <p className="text-sm text-gray-400">No services added yet.</p>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm mt-6">
        <h3 className="font-bold text-gray-900 mb-4">My Reviews</h3>
        {history.filter(h => h.isRated).length === 0 ? (
          <p className="text-sm text-gray-400">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {history.filter(h => h.isRated).map(review => (
              <div key={review.id} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-gray-900 text-sm">{review.customerName || 'Customer'}</p>
                  <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                    <Star size={12} className="text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-bold text-yellow-700">{review.rating}</span>
                  </div>
                </div>
                {review.reviewText && (
                  <p className="text-sm text-gray-600 italic">"{review.reviewText}"</p>
                )}
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">{review.scheduledDate}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2 mt-6">
        <button 
          onClick={onSwitchMode}
          className="w-full p-5 bg-emerald-600 text-white rounded-3xl font-bold flex items-center justify-between shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <RefreshCw size={20} />
            </div>
            <div className="text-left">
              <p className="text-sm">Switch to Customer</p>
              <p className="text-[10px] opacity-60 font-bold uppercase tracking-widest">Book services for yourself</p>
            </div>
          </div>
          <ChevronRight size={20} />
        </button>

        <button 
          onClick={onLogout}
          className="w-full p-5 bg-red-50 text-red-600 rounded-3xl font-bold flex items-center justify-between active:scale-95 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <LogOut size={20} />
            </div>
            <span>Logout</span>
          </div>
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );

  if (activeTrackingOrder) {
    return (
      <Tracking 
        order={activeTrackingOrder} 
        userRole="professional" 
        onBack={() => setActiveTrackingOrder(null)}
        onCompleteJob={() => {
          handleCompleteJob(activeTrackingOrder.id);
          setActiveTrackingOrder(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Worker Header */}
      <div className="bg-emerald-950 p-6 pt-12 rounded-b-[40px] shadow-xl shadow-emerald-950/10">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-900 border border-emerald-800 flex items-center justify-center overflow-hidden">
              <img src={profile.photo || 'https://picsum.photos/seed/worker/200'} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Welcome back</p>
              <p className="text-white font-bold text-sm">{profile.name}</p>
            </div>
          </div>
          <button 
            onClick={toggleOnline}
            className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl font-bold text-xs transition-all ${isOnline ? 'bg-emerald-500 text-emerald-950 shadow-lg shadow-emerald-500/30' : 'bg-red-500 text-white shadow-lg shadow-red-500/30'}`}
          >
            <Power size={14} strokeWidth={3} />
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 backdrop-blur-md rounded-3xl p-4 border border-white/10">
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Today's Earnings</p>
            <p className="text-2xl font-bold text-white font-display">₹{todayEarnings}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-md rounded-3xl p-4 border border-white/10">
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Total Jobs</p>
            <p className="text-2xl font-bold text-white font-display">{totalJobs}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 font-display">
            {activeTab === WorkerTab.REQUESTS && 'New Requests'}
            {activeTab === WorkerTab.MAP && 'Active Jobs Map'}
            {activeTab === WorkerTab.HISTORY && 'Job History'}
            {activeTab === WorkerTab.PROFILE && 'My Profile'}
          </h2>
          {activeTab === WorkerTab.REQUESTS && requests.length > 0 && (
            <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
              {requests.length} New
            </span>
          )}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === WorkerTab.REQUESTS && renderRequests()}
            {activeTab === WorkerTab.MAP && renderActiveJobs()}
            {activeTab === WorkerTab.HISTORY && renderHistory()}
            {activeTab === WorkerTab.PROFILE && renderProfile()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Worker Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-xl border-t border-gray-100 flex justify-around py-3 pb-safe z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.04)]">
        {[
          { id: WorkerTab.REQUESTS, icon: Bell, label: 'Requests', count: requests.length },
          { id: WorkerTab.MAP, icon: MapPin, label: 'Map', count: activeJobs.length },
          { id: WorkerTab.HISTORY, icon: History, label: 'History' },
          { id: WorkerTab.PROFILE, icon: UserIcon, label: 'Profile' },
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id)} 
            className={`flex flex-col items-center gap-1.5 py-1 flex-1 transition-all active:scale-90 relative ${activeTab === item.id ? 'text-emerald-600' : 'text-gray-400'}`}
          >
            <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            <span className={`text-[9px] font-bold uppercase tracking-[0.1em] ${activeTab === item.id ? 'opacity-100' : 'opacity-60'}`}>{item.label}</span>
            {item.count && item.count > 0 && (
              <span className="absolute top-0 right-1/4 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {item.count}
              </span>
            )}
          </button>
        ))}
      </div>
      {/* Selected Request Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Job Details</h2>
                  <p className="text-sm text-gray-500 mt-1">Review before accepting</p>
                </div>
                <button onClick={() => setSelectedRequest(null)} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Customer</p>
                  <p className="font-bold text-gray-900 text-lg">{selectedRequest.customerName || 'Customer'}</p>
                </div>

                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Estimated Earnings</p>
                  <p className="font-bold text-emerald-700 text-2xl">₹{selectedRequest.grandTotal}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Service Location</p>
                  <div className="flex items-start gap-2 mt-1">
                    <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                    <p className="text-sm font-medium text-gray-700">{selectedRequest.address}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Contact Options (After Accept)</p>
                  <div className="flex gap-3">
                    <div className="flex-1 py-2 bg-gray-200 text-gray-500 font-bold rounded-xl text-xs flex items-center justify-center gap-2">
                      Call
                    </div>
                    <div className="flex-1 py-2 bg-gray-200 text-gray-500 font-bold rounded-xl text-xs flex items-center justify-center gap-2">
                      WhatsApp
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => handleOrderAction(selectedRequest.id, 'accept')}
                  className="flex-1 py-4 bg-emerald-600 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-600/20"
                >
                  <Check size={18} strokeWidth={3} /> Accept Job
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Services Modal */}
      <AnimatePresence>
        {showEditServices && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[80vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold font-display">Edit Services</h2>
                <button onClick={() => setShowEditServices(false)} className="p-2 bg-gray-100 rounded-full text-gray-500">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {allServices.map(service => (
                  <label key={service} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={tempSkills.includes(service)}
                      onChange={async (e) => {
                        const newSkills = e.target.checked 
                          ? [...tempSkills, service] 
                          : tempSkills.filter(s => s !== service);
                        setTempSkills(newSkills);
                        try {
                          await updateDoc(doc(db, 'users', user.uid), { skills: newSkills });
                        } catch (error) {
                          console.error('Error updating services:', error);
                        }
                      }}
                      className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium text-gray-700">{service}</span>
                  </label>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <button 
                  onClick={() => {
                    setShowEditServices(false);
                    fetchProfile();
                  }}
                  className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
