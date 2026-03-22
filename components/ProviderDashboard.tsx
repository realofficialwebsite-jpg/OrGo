import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Settings, 
  ChevronRight, 
  Star, 
  MapPin, 
  Clock, 
  Check, 
  X, 
  User as UserIcon,
  LogOut,
  Briefcase,
  Wallet,
  Shield,
  HelpCircle,
  Smartphone
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  arrayUnion,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../src/firebase';
import { UserProfile, Booking } from '../src/types';

interface ProviderDashboardProps {
  user: any;
  profile: UserProfile;
  onSwitchMode: () => void;
  onLogout: () => void;
  fetchProfile: () => void;
}

export const ProviderDashboard: React.FC<ProviderDashboardProps> = ({ user, profile, onSwitchMode, onLogout, fetchProfile }) => {
  const [activeOrders, setActiveOrders] = useState<Booking[]>([]);
  const [newRequests, setNewRequests] = useState<Booking[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<Booking | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>('dashboard');

  useEffect(() => {
    if (!profile.uid) return;

    // Listen for new requests (broadcasted or specifically for this worker)
    const qNew = query(
      collection(db, 'order'),
      where('status', '==', 'pending')
    );

    const unsubNew = onSnapshot(qNew, (snap) => {
      const orders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      // Filter out orders where this worker has already expressed interest
      const filtered = orders.filter(o => 
        !o.interestedWorkers?.some(w => w.uid === profile.uid) &&
        (!o.rejectedBy || !o.rejectedBy.includes(profile.uid))
      );
      setNewRequests(filtered);
    });

    // Listen for active orders assigned to this worker
    const qActive = query(
      collection(db, 'order'),
      where('assignedWorkerId', '==', profile.uid),
      where('status', 'in', ['assigned', 'on_the_way'])
    );

    const unsubActive = onSnapshot(qActive, (snap) => {
      const orders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setActiveOrders(orders);
    });

    return () => {
      unsubNew();
      unsubActive();
    };
  }, [profile.uid]);

  const handleOrderAction = async (orderId: string, action: 'accept' | 'reject') => {
    try {
      if (action === 'accept') {
        // Add worker to interested list
        await updateDoc(doc(db, 'order', orderId), {
          interestedWorkers: arrayUnion({
            uid: profile.uid,
            name: profile.name,
            photo: profile.photo || '',
            rating: profile.rating || 5.0,
            totalReviews: profile.totalReviews || 0,
            phone: profile.phone
          })
        });
        setSelectedRequest(null);
      } else {
        // Add to rejected list so it doesn't show up again
        await updateDoc(doc(db, 'order', orderId), {
          rejectedBy: arrayUnion(profile.uid)
        });
        setSelectedRequest(null);
      }
    } catch (error) {
      console.error("Error handling order action:", error);
    }
  };

  if (activeTab === 'settings') {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white p-6 pt-12 rounded-b-[40px] shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-display font-bold text-gray-900">Settings</h1>
            <button onClick={() => setActiveTab('dashboard')} className="p-2 bg-gray-100 rounded-full">
              <X size={20} />
            </button>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <img 
              src={profile.photo || 'https://picsum.photos/seed/worker/200'} 
              alt="Profile" 
              className="w-20 h-20 rounded-3xl object-cover border-4 border-emerald-50 shadow-lg"
              referrerPolicy="no-referrer"
            />
            <div>
              <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
              <div className="flex items-center gap-2 text-emerald-600 font-bold mt-1">
                <Star size={16} fill="currentColor" />
                <span>{profile.rating?.toFixed(1) || '5.0'}</span>
                <span className="text-gray-400 font-medium">({profile.totalReviews || 0} reviews)</span>
              </div>
            </div>
          </div>

          <button 
            onClick={onSwitchMode}
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 mb-8"
          >
            <Smartphone size={20} /> Switch to Customer Mode
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-white rounded-3xl p-4 shadow-sm space-y-1">
            <SettingsItem icon={<UserIcon size={20} />} title="Personal Info" />
            <SettingsItem icon={<Wallet size={20} />} title="Payout Settings" />
            <SettingsItem icon={<Shield size={20} />} title="Security" />
          </div>
          <div className="bg-white rounded-3xl p-4 shadow-sm space-y-1">
            <SettingsItem icon={<HelpCircle size={20} />} title="Help Center" />
            <SettingsItem icon={<LogOut size={20} />} title="Logout" color="text-red-500" onClick={() => auth.signOut()} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white p-6 pt-12 rounded-b-[40px] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <Briefcase size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Worker Mode</p>
              <h1 className="text-xl font-bold text-gray-900">Hello, {profile.name.split(' ')[0]}</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-3 bg-gray-50 rounded-2xl text-gray-600 relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <button onClick={() => setActiveTab('settings')} className="p-3 bg-gray-50 rounded-2xl text-gray-600">
              <Settings size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-emerald-600 p-5 rounded-3xl text-white shadow-lg shadow-emerald-600/20">
            <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mb-1">Today's Earnings</p>
            <p className="text-2xl font-bold">₹1,240</p>
          </div>
          <div className="bg-gray-900 p-5 rounded-3xl text-white shadow-lg shadow-gray-900/20">
            <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mb-1">Completed Jobs</p>
            <p className="text-2xl font-bold">12</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Active Jobs */}
        {activeOrders.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Active Jobs</h2>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                {activeOrders.length} Ongoing
              </span>
            </div>
            <div className="space-y-4">
              {activeOrders.map(order => (
                <div key={order.id} className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900">{order.cartItems[0].title}</h3>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <MapPin size={12} /> {order.address}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-600 font-bold">₹{order.grandTotal}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Assigned</p>
                    </div>
                  </div>
                  <button className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm shadow-lg active:scale-[0.98] transition-all">
                    Go to Tracking
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* New Requests */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">New Requests</h2>
            <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
              {newRequests.length} Available
            </span>
          </div>
          
          {newRequests.length === 0 ? (
            <div className="bg-white p-12 rounded-[40px] text-center border-2 border-dashed border-gray-100">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                <Briefcase size={32} />
              </div>
              <p className="text-gray-500 font-medium">No new requests nearby</p>
              <p className="text-xs text-gray-400 mt-1">We'll notify you when jobs arrive</p>
            </div>
          ) : (
            <div className="space-y-4">
              {newRequests.map(order => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={order.id} 
                  className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-100"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-emerald-600">
                        <Smartphone size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{order.cartItems[0].title}</h3>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <MapPin size={12} /> {order.address.split(',')[0]}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-600 font-bold text-lg">₹{order.grandTotal}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{order.isInstant ? 'Instant' : 'Scheduled'}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleOrderAction(order.id, 'accept')}
                      className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-2xl text-xs active:scale-95 transition-all"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => setSelectedRequest(order)}
                      className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-2xl text-xs active:scale-95 transition-all"
                    >
                      Details
                    </button>
                    <button 
                      onClick={() => handleOrderAction(order.id, 'reject')}
                      className="flex-1 py-3 bg-red-50 text-red-600 font-bold rounded-2xl text-xs active:scale-95 transition-all"
                    >
                      Reject
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>

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

const SettingsItem = ({ icon, title, color = "text-gray-700", onClick }: { icon: React.ReactNode, title: string, color?: string, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors"
  >
    <div className="flex items-center gap-3">
      <div className={`${color} opacity-80`}>{icon}</div>
      <span className={`font-bold text-sm ${color}`}>{title}</span>
    </div>
    <ChevronRight size={16} className="text-gray-300" />
  </button>
);
