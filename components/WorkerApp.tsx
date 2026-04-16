import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc, arrayUnion, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
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
  Star,
  ArrowLeft,
  Wrench,
  Phone,
  Search,
  Calendar as CalendarIcon,
  MessageSquare,
  Send,
  Plus,
  Wallet,
  AlertTriangle
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

import { Tracking } from './Tracking';
import { WorkerWalletDashboard } from './WorkerWalletDashboard';
import { FaceVerificationModal } from './FaceVerificationModal';

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
  WALLET = 'WALLET',
  HISTORY = 'HISTORY',
  PROFILE = 'PROFILE'
}

export const WorkerApp: React.FC<WorkerAppProps> = ({ user, profile, onSwitchMode, onLogout, fetchProfile }) => {
  const alarmAudio = React.useRef<HTMLAudioElement | null>(null);
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
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [hasNewRequest, setHasNewRequest] = useState(false);
  const [workingHours, setWorkingHours] = useState(profile.workingHours || { start: '09:00', end: '18:00' });
  const [availableDays, setAvailableDays] = useState<string[]>(profile.availableDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingAvailability, setIsEditingAvailability] = useState(false);
  const [editProfileData, setEditProfileData] = useState({ name: profile.name, email: profile.email, photo: profile.photo || '' });
  const [showFaceVerification, setShowFaceVerification] = useState(false);

  useEffect(() => {
    if (!alarmAudio.current) {
      alarmAudio.current = new Audio('/notification.mp3');
      alarmAudio.current.loop = true;
    }
    return () => {
      if (alarmAudio.current) {
        alarmAudio.current.pause();
      }
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (userData.dailySecurityStatus === 'pending') {
          setIsOnline(false); // Force them offline while waiting
        } else if (userData.dailySecurityStatus === 'approved') {
          setIsOnline(true); // Auto-connect them once Admin approves
          // Reset status back to idle after going online so they have to verify again tomorrow
          updateDoc(doc(db, 'users', user.uid), { 
            isOnline: true, 
            status: 'online',
            dailySecurityStatus: 'idle'
          }).catch(console.error);
        }
      }
    });
    return () => unsubUser();
  }, [user]);

  useEffect(() => {
    if (requests.length > 0 && activeTab !== WorkerTab.REQUESTS) {
      setHasNewRequest(true);
    }
  }, [requests.length, activeTab]);

  useEffect(() => {
    if (activeTab === WorkerTab.REQUESTS) {
      setHasNewRequest(false);
    }
  }, [activeTab]);

  const saveAvailabilitySettings = async () => {
    setIsSavingSettings(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        workingHours,
        availableDays
      });
      fetchProfile();
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSavingSettings(false);
    }
  };

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

  const getMonthlyEarnings = () => {
    const monthly: { [key: string]: number } = {};
    history.forEach(job => {
      if (job.status === 'completed') {
        const date = job.completedAt ? new Date(job.completedAt) : (job.createdAt?.toDate ? job.createdAt.toDate() : new Date(job.createdAt));
        const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        monthly[monthYear] = (monthly[monthYear] || 0) + (job.grandTotal || 0);
      }
    });
    return Object.entries(monthly).sort((a, b) => {
      const dateA = new Date(a[0]);
      const dateB = new Date(b[0]);
      return dateB.getTime() - dateA.getTime();
    });
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [activeChatJob, setActiveChatJob] = useState<Booking | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (!activeChatJob) return;
    
    const q = query(
      collection(db, 'messages'),
      where('orderId', '==', activeChatJob.id),
      orderBy('createdAt', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChatMessages(msgs);
    });
    
    return () => unsubscribe();
  }, [activeChatJob]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChatJob) return;
    
    try {
      await addDoc(collection(db, 'messages'), {
        orderId: activeChatJob.id,
        senderId: user.uid,
        senderName: profile.name,
        text: newMessage,
        createdAt: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const filteredHistory = history.filter(h => {
    const matchesStatus = filterStatus === 'all' || h.status === filterStatus;
    const orderDate = h.createdAt?.toDate ? h.createdAt.toDate() : new Date(h.createdAt);
    
    // Set end date to end of day
    const endDate = dateRange.end ? new Date(dateRange.end) : null;
    if (endDate) endDate.setHours(23, 59, 59, 999);
    
    const matchesDate = (!dateRange.start || orderDate >= new Date(dateRange.start)) && 
                        (!endDate || orderDate <= endDate);
    
    const serviceTitle = h.cartItems?.[0]?.title || '';
    const customerName = h.customerName || '';
    const matchesSearch = serviceTitle.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          customerName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesDate && matchesSearch;
  });

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
      
      // Check if there's a truly "new" request for notification
      if (filtered.length > requests.length && activeTab !== WorkerTab.REQUESTS) {
        setHasNewRequest(true);
        const newReq = filtered[0];
        toast.success(`New Request: ${newReq.cartItems?.[0]?.title}`, {
          description: `Location: ${newReq.address}`,
          action: {
            label: 'View',
            onClick: () => setActiveTab(WorkerTab.REQUESTS)
          }
        });
        if (alarmAudio.current) {
          alarmAudio.current.play().catch(err => console.log('Browser blocked autoplay', err));
        }
      }
      
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
    if (!isOnline) {
      // Gatekeeper logic: Check if approved
      if (profile.dailySecurityStatus === 'approved') {
        setIsOnline(true);
        try {
          await updateDoc(doc(db, 'users', user.uid), { 
            isOnline: true, 
            status: 'online' 
          });
          toast.success('Welcome back!');
        } catch (error) {
          console.error('Error updating status:', error);
          setIsOnline(false);
        }
      } else {
        toast.error('Please complete required actions to go online.');
      }
    } else {
      // Go Offline
      setIsOnline(false);
      try {
        await updateDoc(doc(db, 'users', user.uid), { 
          isOnline: false, 
          status: 'offline' 
        });
      } catch (error) {
        console.error('Error updating status:', error);
        setIsOnline(true);
      }
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
    if (alarmAudio.current) {
      alarmAudio.current.pause();
      alarmAudio.current.currentTime = 0;
    }
    if (!orderId) return;
    try {
      const orderRef = doc(db, 'order', orderId);
      if (action === 'accept') {
        const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
        const workerData = {
          workerId: user.uid,
          name: profile.name,
          photo: profile.photo || 'https://picsum.photos/seed/worker/200',
          experience: profile.experience || '5',
          phone: profile.phone || '',
          rating: profile.rating || 0,
          totalReviews: profile.totalReviews || 0
        };
        
        // For this app's flow, we'll assign the worker immediately upon acceptance
        await updateDoc(orderRef, {
          status: 'assigned',
          startOtp: generatedOtp,
          assignedWorkerId: user.uid,
          workerName: profile.name,
          workerPhoto: profile.photo || 'https://picsum.photos/seed/worker/200',
          workerPhone: profile.phone || '',
          interestedWorkers: arrayUnion(workerData)
        });
        
        // Fetch the updated order to set it for tracking
        const updatedDoc = await getDoc(orderRef);
        if (updatedDoc.exists()) {
          const updatedOrder = { id: updatedDoc.id, ...updatedDoc.data() } as Booking;
          setActiveTrackingOrder(updatedOrder);
          setActiveTab(WorkerTab.MAP);
        }
        
        setSelectedRequest(null);
        setRequests(prev => prev.filter(r => r.id !== orderId));
      } else {
        setSelectedRequest(null);
        setRequests(prev => prev.filter(r => r.id !== orderId));
      }
    } catch (error) {
      console.error(`Error updating order:`, error);
      alert('Failed to process request.');
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
    const showActionRequired = !isOnline && profile.dailySecurityStatus !== 'approved';

    if (!isOnline && !showActionRequired) {
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

    const filteredByCat = requests.filter(req => 
      selectedCategory === 'All' || req.cartItems?.[0]?.title === selectedCategory
    );

    return (
      <div className="space-y-4">
        {showActionRequired && (
          <button 
            onClick={() => setShowFaceVerification(true)}
            className="w-full bg-red-50 border border-red-100 rounded-[32px] p-6 text-left active:scale-[0.98] transition-all shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-red-900 text-lg mb-1">Required actions (1) - Go online when resolved</h3>
                <p className="text-sm text-red-700">Take a photo of yourself to confirm it's your account.</p>
              </div>
            </div>
          </button>
        )}

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
          {['All', ...(profile.skills || [])].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border whitespace-nowrap ${
                selectedCategory === cat 
                  ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/20' 
                  : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {filteredByCat.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Bell size={32} />
            </div>
            <p className="font-bold text-sm uppercase tracking-widest">No {selectedCategory !== 'All' ? selectedCategory : ''} requests</p>
            <p className="text-xs mt-1">Stay online to receive new jobs</p>
          </div>
        ) : (
          filteredByCat.map(order => (
            <motion.div 
              key={order.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1">New Request</p>
                  <h3 className="font-bold text-gray-900">{order?.cartItems?.[0]?.title}</h3>
                  <p className="text-xs text-gray-500">{order.address}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-gray-900">₹{order.grandTotal}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{order.scheduledDate}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setSelectedRequest(order)}
                  className="flex-1 py-3 bg-red-600 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <ClipboardList size={16} strokeWidth={3} /> View Details
                </button>
                <button 
                  onClick={() => handleOrderAction(order.id, 'reject')}
                  className="flex-1 py-3 bg-red-50 text-red-600 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <X size={16} strokeWidth={3} /> Reject
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    );
  };

  const handleWhatsApp = (order: Booking) => {
    const targetPhone = order.customerPhone;
    if (!targetPhone) return alert('Phone number not available');
    const cleanPhone = targetPhone.replace(/\D/g, '');
    const msg = "Hello, I'm on my way for your service.";
    window.open('https://wa.me/91' + cleanPhone + '?text=' + encodeURIComponent(msg), '_blank');
  };

  const renderActiveJobs = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <button 
          onClick={() => setActiveTab(WorkerTab.REQUESTS)}
          className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100"
        >
          <ArrowLeft size={18} strokeWidth={3} />
          <span className="text-xs font-bold uppercase tracking-widest">Back to Home</span>
        </button>
      </div>

      {activeJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <MapPin size={32} />
          </div>
          <p className="font-bold text-sm uppercase tracking-widest">No active jobs</p>
          <p className="text-xs mt-1">Your assigned jobs will appear here</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Active Job Details</h3>
            {activeJobs.map(order => (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
                      <Activity size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{order?.cartItems?.[0]?.title}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={12} /> {order.address}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">₹{order.grandTotal}</p>
                    <span className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-[8px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0 min-w-max">In Progress</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setActiveTrackingOrder(order)}
                    className="flex-1 py-2.5 bg-gray-900 text-white font-bold rounded-xl text-[10px] flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
                  >
                    <Navigation size={16} /> Track
                  </button>
                  <button 
                    onClick={() => handleWhatsApp(order)}
                    className="flex-1 py-2.5 bg-red-50 text-red-600 font-bold rounded-xl text-[10px] flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
                  >
                    <MessageSquare size={16} /> WhatsApp
                  </button>
                  <button 
                    onClick={() => handleCompleteJob(order.id)}
                    className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl text-[10px] flex flex-col items-center justify-center gap-1 shadow-lg shadow-red-600/20 active:scale-95 transition-all"
                  >
                    <CheckCircle2 size={16} /> Complete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderHistory = () => (
    <div className="pb-32">
      {/* Search and Filters */}
      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by service or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm focus:bg-white focus:border-red-500 transition-all shadow-sm"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {(['all', 'completed', 'cancelled'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-6 py-2.5 rounded-2xl text-xs font-bold capitalize transition-all whitespace-nowrap border ${
                filterStatus === status 
                  ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20' 
                  : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-gray-400 uppercase ml-1">From</p>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input 
                type="date" 
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full pl-9 pr-3 py-3 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-700 outline-none"
              />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-gray-400 uppercase ml-1">To</p>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input 
                type="date" 
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full pl-9 pr-3 py-3 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-700 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[40px] border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <History size={40} className="text-gray-200" />
            </div>
            <p className="font-bold text-gray-900 text-lg">No {filterStatus !== 'all' ? filterStatus : ''} jobs found</p>
            <p className="text-gray-400 text-sm mt-1">Your job history will appear here</p>
          </div>
        ) : (
          filteredHistory.map(order => (
            <div key={order.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all">
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${order.status === 'completed' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                  {order.status === 'completed' ? <CheckCircle2 size={24} strokeWidth={2.5} /> : <XCircle size={24} strokeWidth={2.5} />}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base mb-1">{order?.cartItems?.[0]?.title}</h4>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{order.scheduledDate}</p>
                    <span className="w-1 h-1 bg-gray-200 rounded-full" />
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{order.scheduledTime}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900 text-lg mb-1">₹{order.grandTotal}</p>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0 min-w-max ${order.status === 'completed' ? 'bg-red-50 text-red-600' : 'bg-red-50 text-red-600'}`}>
                    {order.status}
                  </span>
                  {order.isRated && (
                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
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
    </div>
  );

  const renderProfile = () => {
    const monthlyEarnings = getMonthlyEarnings();
    
    if (showAllReviews) {
      return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="pb-32">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setShowAllReviews(false)} className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
              <ArrowLeft size={20} className="text-gray-900" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 font-display">All Reviews</h2>
          </div>
          <div className="space-y-4">
            {history.filter(h => h.isRated).map((job) => (
              <div key={job.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-gray-900 text-base mb-1">{job.cartItems?.[0]?.title}</h4>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{job.customerName || 'Customer'}</p>
                      <span className="w-1 h-1 bg-gray-200 rounded-full" />
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(job.completedAt || job.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 rounded-xl text-xs font-bold text-yellow-700 border border-yellow-100">
                    <Star size={14} className="fill-yellow-700" /> {job.rating}
                  </div>
                </div>
                <p className="text-sm text-gray-600 italic leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  "{reviewText(job) || 'No comment provided'}"
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col items-center text-center relative">
          <button 
            onClick={onLogout}
            className="absolute top-6 right-6 p-3 bg-red-50 text-red-600 rounded-2xl active:scale-95 transition-all"
          >
            <LogOut size={20} />
          </button>
          
          {isEditingProfile ? (
            <div className="w-full space-y-4 pt-4">
              <div className="relative inline-block mb-4">
                <div className="w-28 h-28 rounded-[32px] bg-red-50 border-4 border-white shadow-xl overflow-hidden">
                  <img src={editProfileData.photo || 'https://picsum.photos/seed/worker/200'} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <button className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-lg border border-gray-100 text-red-600">
                  <Edit2 size={16} />
                </button>
              </div>
              <input
                type="text"
                value={editProfileData.name}
                onChange={(e) => setEditProfileData({ ...editProfileData, name: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-center font-bold text-lg outline-none"
                placeholder="Name"
              />
              <input
                type="email"
                value={editProfileData.email}
                onChange={(e) => setEditProfileData({ ...editProfileData, email: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-center text-gray-600 outline-none"
                placeholder="Email"
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsEditingProfile(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    try {
                      await updateDoc(doc(db, 'users', user.uid), {
                        name: editProfileData.name,
                        email: editProfileData.email,
                        photo: editProfileData.photo
                      });
                      setIsEditingProfile(false);
                      fetchProfile();
                    } catch (error) {
                      console.error("Error updating profile:", error);
                    }
                  }}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-xs"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="relative mb-6">
                <div className="w-28 h-28 rounded-[32px] bg-red-50 border-4 border-white shadow-xl overflow-hidden">
                  <img src={profile.photo || 'https://picsum.photos/seed/worker/200'} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-white shadow-lg ${isOnline ? 'bg-red-500' : 'bg-gray-400'}`} />
                <button 
                  onClick={() => setIsEditingProfile(true)}
                  className="absolute -top-2 -left-2 p-2 bg-white rounded-xl shadow-lg border border-gray-100 text-red-600"
                >
                  <Edit2 size={16} />
                </button>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 font-display mb-1">{profile.name}</h2>
              <p className="text-sm text-gray-500 mb-1">{profile.email}</p>
              <p className="text-sm text-red-600 font-bold uppercase tracking-widest mb-6">{profile.category}</p>
            </>
          )}
          
          <div className="grid grid-cols-3 gap-8 w-full py-6 border-y border-gray-50">
            <div>
              <p className="text-lg font-bold text-gray-900">{profile.rating ? profile.rating.toFixed(1) : '5.0'}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Rating</p>
            </div>
            <div className="border-x border-gray-50">
              <p className="text-lg font-bold text-gray-900">{totalJobs}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Jobs</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">₹{totalEarnings}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Earned</p>
            </div>
          </div>
        </div>

        {/* Availability & Working Hours */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isOnline ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'}`}>
                <Power size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Job Availability</h3>
                <p className="text-xs text-gray-500 font-medium">Receive new job requests</p>
              </div>
            </div>
            <button 
              onClick={toggleOnline}
              className={`w-14 h-8 rounded-full relative transition-all duration-300 ${isOnline ? 'bg-red-500' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${isOnline ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="pt-6 border-t border-gray-50 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Working Hours & Days</h4>
              <button 
                onClick={() => setIsEditingAvailability(!isEditingAvailability)}
                className="text-red-600 text-xs font-bold uppercase tracking-widest flex items-center gap-1"
              >
                {isEditingAvailability ? 'Cancel' : <><Edit2 size={14} /> Edit</>}
              </button>
            </div>
            
            {isEditingAvailability ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-bold text-gray-400 uppercase ml-1">Start Time</p>
                    <input 
                      type="time" 
                      value={workingHours.start}
                      onChange={(e) => setWorkingHours(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-bold text-gray-400 uppercase ml-1">End Time</p>
                    <input 
                      type="time" 
                      value={workingHours.end}
                      onChange={(e) => setWorkingHours(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <button
                      key={day}
                      onClick={() => {
                        setAvailableDays(prev => 
                          prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
                        );
                      }}
                      className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all border ${
                        availableDays.includes(day)
                          ? 'bg-red-50 text-red-600 border-red-100'
                          : 'bg-white text-gray-400 border-gray-100'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>

                <button
                  onClick={async () => {
                    await saveAvailabilitySettings();
                    setIsEditingAvailability(false);
                  }}
                  disabled={isSavingSettings}
                  className="w-full py-3 bg-gray-900 text-white text-xs font-bold rounded-xl active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSavingSettings ? 'Saving...' : 'Save Availability Settings'}
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {workingHours.start} - {workingHours.end}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Hours</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div
                      key={day}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold ${
                        availableDays.includes(day)
                          ? 'bg-red-50 text-red-700'
                          : 'bg-gray-50 text-gray-300'
                      }`}
                    >
                      {day}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Breakdown */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6 font-display">Monthly Earnings</h3>
          <div className="space-y-4">
            {monthlyEarnings.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-sm text-gray-400 font-medium">No earnings data yet</p>
              </div>
            ) : (
              monthlyEarnings.map(([month, amount]) => (
                <div key={month} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-sm font-bold text-gray-600">{month}</span>
                  <span className="text-base font-bold text-gray-900">₹{amount}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900">My Services & Skills</h3>
            <button 
              onClick={() => setShowEditServices(true)}
              className="text-red-600 text-xs font-bold uppercase tracking-widest flex items-center gap-1"
            >
              <Edit2 size={14} /> Edit
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.skills?.map(skill => (
              <span key={skill} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-xs font-bold">
                {skill}
              </span>
            ))}
            {(!profile.skills || profile.skills.length === 0) && (
              <p className="text-sm text-gray-400">No services added yet.</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900">My Reviews</h3>
            <button onClick={() => setShowAllReviews(true)} className="text-red-600 text-xs font-bold uppercase tracking-widest">View All</button>
          </div>
          {history.filter(h => h.isRated).length === 0 ? (
            <p className="text-sm text-gray-400">No reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {history.filter(h => h.isRated).slice(0, 3).map(review => (
                <div key={review.id} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-gray-900 text-sm">{review.customerName || 'Customer'}</p>
                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                      <Star size={12} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-xs font-bold text-yellow-700">{review.rating}</span>
                    </div>
                  </div>
                  {reviewText(review) && (
                    <p className="text-sm text-gray-600 italic">"{reviewText(review)}"</p>
                  )}
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">{review.scheduledDate}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <button 
            onClick={onSwitchMode}
            className="w-full p-5 bg-red-600 text-white rounded-3xl font-bold flex items-center justify-between shadow-lg shadow-red-600/20 active:scale-95 transition-all"
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
  };

  const reviewText = (job: Booking) => job.reviewText || job.review;

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
      <Toaster position="top-center" richColors />
      {/* Worker Header - Only on Requests tab and smaller */}
      {activeTab === WorkerTab.REQUESTS && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-950 p-6 pt-12 rounded-b-[40px] shadow-xl shadow-slate-950/10"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden">
                <img src={profile.photo || 'https://picsum.photos/seed/worker/200'} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Welcome back</p>
                <p className="text-white font-bold text-sm">{profile.name}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="bg-white/5 backdrop-blur-md rounded-2xl px-4 py-2 border border-white/10 text-center">
                <p className="text-[8px] font-bold text-red-400 uppercase tracking-widest">Today</p>
                <p className="text-sm font-bold text-white">₹{todayEarnings}</p>
              </div>
              <button 
                onClick={toggleOnline}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-[10px] transition-all ${isOnline ? 'bg-red-500 text-white' : 'bg-slate-800 text-gray-400'}`}
              >
                <Power size={12} strokeWidth={3} />
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 font-display">
            {activeTab === WorkerTab.REQUESTS && 'New Requests'}
            {activeTab === WorkerTab.MAP && 'Active Jobs'}
            {activeTab === WorkerTab.WALLET && 'My Earnings'}
            {activeTab === WorkerTab.HISTORY && 'Job History'}
            {activeTab === WorkerTab.PROFILE && 'My Profile'}
          </h2>
          {activeTab === WorkerTab.REQUESTS && requests.length > 0 && (
            <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
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
            {activeTab === WorkerTab.WALLET && <WorkerWalletDashboard user={user} profile={profile} />}
            {activeTab === WorkerTab.HISTORY && renderHistory()}
            {activeTab === WorkerTab.PROFILE && renderProfile()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Worker Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-xl border-t border-gray-100 flex justify-around py-3 pb-safe z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.04)]">
        {[
          { id: WorkerTab.REQUESTS, icon: Bell, label: 'Requests', count: requests.length, notify: hasNewRequest },
          { id: WorkerTab.MAP, icon: MapPin, label: 'Map', count: activeJobs.length },
          { id: WorkerTab.WALLET, icon: Wallet, label: 'Earnings' },
          { id: WorkerTab.HISTORY, icon: History, label: 'History' },
          { id: WorkerTab.PROFILE, icon: UserIcon, label: 'Profile' },
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id)} 
            className={`flex flex-col items-center gap-1.5 py-1 flex-1 transition-all active:scale-90 relative ${activeTab === item.id ? 'text-red-600' : 'text-gray-400'}`}
          >
            <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            <span className={`text-[9px] font-bold uppercase tracking-[0.1em] ${activeTab === item.id ? 'opacity-100' : 'opacity-60'}`}>{item.label}</span>
            {item.count && item.count > 0 && (
              <span className="absolute top-0 right-1/4 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {item.count}
              </span>
            )}
            {item.notify && (
              <span className="absolute top-0 right-1/4 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-bounce" />
            )}
          </button>
        ))}
      </div>
      {/* Selected Request Modal */}
      <AnimatePresence>
        {showFaceVerification && (
          <FaceVerificationModal
            workerId={user.uid}
            referencePhotoUrl={profile.faceScanBase64 || profile.profilePhotoBase64 || profile.photo || ''}
            onSuccess={() => {
              setShowFaceVerification(false);
              setIsOnline(true);
              fetchProfile();
            }}
            onClose={() => setShowFaceVerification(false)}
          />
        )}
        {selectedRequest && (
          <motion.div 
            key="selected-request-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div 
              key="selected-request-modal-content"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-lg rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-gray-900">Job Details</h2>
                    <p className="text-gray-500 font-medium mt-1">Review carefully before accepting</p>
                  </div>
                  <button 
                    onClick={() => setSelectedRequest(null)}
                    className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Service Info */}
                  <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1">Service Required</p>
                        <h3 className="text-xl font-bold text-gray-900">{selectedRequest.cartItems?.[0]?.title}</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-red-700">₹{selectedRequest.grandTotal}</p>
                        <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest">Estimated Payout</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 pt-4 border-t border-red-100/50">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-red-700">
                        <Clock size={14} /> {selectedRequest.isInstant ? 'Instant' : 'Scheduled'}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-red-700">
                        <Activity size={14} /> {selectedRequest.scheduledTime}
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Customer & Location</h4>
                    <div className="bg-gray-50 rounded-3xl border border-gray-100 overflow-hidden">
                      <div className="p-4 flex items-center justify-between border-b border-gray-100">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-red-600">
                            <UserIcon size={24} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{selectedRequest.customerName || 'Customer'}</p>
                          </div>
                        </div>
                        <a 
                          href={`tel:${selectedRequest.customerPhone || '1234567890'}`}
                          className="p-3 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-600/20 active:scale-95 transition-all"
                        >
                          <Phone size={20} />
                        </a>
                      </div>
                      <div className="p-4 bg-white/50">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-red-600 shrink-0">
                            <MapPin size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm leading-snug">{selectedRequest.address}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Problem Description */}
                  {selectedRequest.instructions && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Problem Description</h4>
                      <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100 italic text-sm text-gray-600 leading-relaxed">
                        "{selectedRequest.instructions}"
                      </div>
                    </div>
                  )}

                  {/* Customer Photo if provided */}
                  {selectedRequest.imageUrl && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Problem Photo</h4>
                      <div className="rounded-3xl overflow-hidden border border-gray-100 h-48">
                        <img src={selectedRequest.imageUrl} alt="Problem" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 flex gap-4">
                  <button 
                    onClick={() => handleOrderAction(selectedRequest.id!, 'reject')}
                    className="flex-1 py-4 bg-red-50 text-red-600 rounded-2xl font-bold text-sm active:scale-[0.98] transition-all"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => handleOrderAction(selectedRequest.id!, 'accept')}
                    className="flex-[2] py-4 bg-red-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-red-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <Check size={20} strokeWidth={3} /> Accept Job
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Services Modal */}
      <AnimatePresence>
        {showEditServices && (
          <motion.div 
            key="edit-services-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              key="edit-services-modal-content"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[85vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold font-display">Manage Services</h2>
                  <p className="text-xs text-gray-400 font-medium mt-1">Select the services you provide</p>
                </div>
                <button onClick={() => setShowEditServices(false)} className="p-2 bg-gray-100 rounded-full text-gray-500">
                  <X size={20} />
                </button>
              </div>
               <div className="flex-1 overflow-y-auto space-y-8 pr-2 py-2 no-scrollbar">
                {APP_CATEGORIES.map(cat => (
                  <div key={cat.id} className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-sm font-bold text-gray-900 font-display flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-red-600 rounded-full" />
                        {cat.name}
                      </h3>
                    </div>
                    <div className="space-y-6">
                      {cat.subCategories.map(sub => (
                        <div key={sub.id} className="space-y-3">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{sub.title}</p>
                          <div className="grid grid-cols-1 gap-2">
                            {sub.items.map(item => {
                              const isSelected = tempSkills.includes(item.title);
                              return (
                                <label 
                                  key={item.id} 
                                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer group ${
                                    isSelected 
                                      ? 'border-red-600 bg-red-50/50 shadow-sm' 
                                      : 'border-gray-100 hover:border-gray-200 bg-white'
                                  }`}
                                >
                                  <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                      isSelected ? 'bg-red-600 text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'
                                    }`}>
                                      <Wrench size={14} />
                                    </div>
                                    <div>
                                      <p className={`text-sm font-bold transition-colors ${isSelected ? 'text-slate-900' : 'text-gray-700'}`}>
                                        {item.title}
                                      </p>
                                      <p className="text-[10px] text-gray-400 font-medium">₹{item.price} • Professional</p>
                                    </div>
                                  </div>
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                    isSelected ? 'bg-red-600 border-red-600' : 'border-gray-200'
                                  }`}>
                                    {isSelected && <Check size={12} className="text-white" strokeWidth={4} />}
                                  </div>
                                  <input 
                                    type="checkbox" 
                                    className="hidden"
                                    checked={isSelected}
                                    onChange={async (e) => {
                                      const newSkills = e.target.checked 
                                        ? [...tempSkills, item.title] 
                                        : tempSkills.filter(s => s !== item.title);
                                      setTempSkills(newSkills);
                                      try {
                                        await updateDoc(doc(db, 'users', user.uid), { skills: newSkills });
                                      } catch (error) {
                                        console.error('Error updating services:', error);
                                      }
                                    }}
                                  />
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <button 
                  onClick={() => {
                    setShowEditServices(false);
                    fetchProfile();
                  }}
                  className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-600/20 active:scale-95 transition-all"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {activeChatJob && (
          <motion.div 
            key="chat-modal"
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-[100] bg-white flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 flex items-center gap-4 bg-white shadow-sm">
              <button onClick={() => setActiveChatJob(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 overflow-hidden">
                  <img src={activeChatJob.customerPhoto || "https://picsum.photos/seed/customer/200"} alt="Customer" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{activeChatJob.customerName || 'Customer'}</h3>
                  <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest">Active Job Chat</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-gray-50/50">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <MessageSquare size={48} className="mb-4 opacity-20" />
                  <p className="text-sm font-medium">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                      msg.senderId === user.uid 
                        ? 'bg-red-600 text-white rounded-tr-none shadow-md' 
                        : 'bg-white text-gray-700 rounded-tl-none border border-gray-100 shadow-sm'
                    }`}>
                      <p className="leading-relaxed">{msg.text}</p>
                      <p className={`text-[9px] mt-1.5 font-bold uppercase tracking-widest ${
                        msg.senderId === user.uid ? 'text-red-100' : 'text-gray-400'
                      }`}>
                        {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 bg-white border-t border-gray-100 pb-10">
              <div className="flex gap-3 items-center bg-gray-50 p-2 rounded-2xl border border-gray-100">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm p-2 font-medium"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="w-10 h-10 bg-red-600 text-white rounded-xl flex items-center justify-center active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-red-600/20"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
