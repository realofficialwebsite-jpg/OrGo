import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  ClipboardList, 
  MapPin, 
  User as UserIcon, 
  Wallet,
  ChevronRight,
  Bell,
  Search,
  Sparkles,
  ShieldCheck,
  Star,
  Clock,
  Copy,
  ArrowLeft,
  Minus,
  Plus,
  Zap,
  Wrench,
  Brush,
  Hammer,
  Droplets,
  Wind,
  CheckCircle2,
  RefreshCw,
  Trash2,
  ShoppingCart,
  MessageSquare,
  Navigation,
  X,
  Send,
  Bot,
  Heart,
  Mic,
  Lock
} from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../src/firebase';
import { User } from 'firebase/auth';
import { AppView, Category, SubCategory, UserProfile, Booking, ServiceItem } from '../src/types';
import { APP_CATEGORIES } from '../src/constants';
import { useCart } from '../src/CartContext';
import { Tracking } from './Tracking';
import { Account } from './Account';
import { Cart } from './Cart';
import { Checkout } from './Checkout';
import { EditProfileModal } from './EditProfileModal';
// import { AnimatedPromoHeader } from './AnimatedPromoHeader';

const Image = ({ source, style, resizeMode }: { source: { uri: string }, style?: any, resizeMode?: 'cover' | 'contain' }) => {
  const fallback = 'https://images.unsplash.com/photo-1601760562234-9814eea6663a?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
  return (
    <img 
      src={source.uri || fallback} 
      style={{ 
        ...style, 
        objectFit: resizeMode === 'cover' ? 'cover' : 'contain' 
      }} 
      onError={(e) => {
        (e.target as HTMLImageElement).src = fallback;
      }}
      referrerPolicy="no-referrer"
      alt=""
    />
  );
};

const ServiceCard = ({ item, addToCart, removeFromCart, getItemQuantity, isFavorite, toggleFavorite }: { 
  item: ServiceItem, 
  addToCart: (item: ServiceItem) => void, 
  removeFromCart: (id: string) => void, 
  getItemQuantity: (id: string) => number,
  isFavorite: boolean,
  toggleFavorite: (id: string) => void
}) => {
  return (
    <div className="flex items-start justify-between p-5 bg-white rounded-[32px] border border-gray-50 shadow-sm hover:shadow-md transition-all group">
      <div className="flex-1 pr-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-0.5 bg-green-50 px-2 py-0.5 rounded-full">
            <Star size={10} className="text-green-600 fill-green-600" />
            <span className="text-[10px] font-black text-green-700">{item.rating}</span>
          </div>
          <span className="text-[10px] text-gray-400 font-medium">{item.reviews} reviews</span>
        </div>
        <h4 className="text-sm font-bold text-gray-900 mb-1 group-hover:text-red-600 transition-colors">{item.title}</h4>
        <p className="text-base font-black text-gray-900 mb-3">₹{item.price}</p>
        <ul className="space-y-1.5">
          {item.descriptionPoints.slice(0, 3).map((point, idx) => (
            <li key={idx} className="flex items-start gap-2 text-[12px] text-gray-500 font-medium leading-relaxed">
              <div className="w-1 h-1 rounded-full bg-gray-300 mt-2 shrink-0" />
              {point}
            </li>
          ))}
        </ul>
      </div>
      <div className="w-32 flex flex-col items-center gap-3">
        <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <button 
            onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
            className="absolute top-2 right-2 p-1.5 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors z-10"
          >
            <Heart size={16} className={isFavorite ? 'fill-red-500 text-red-500' : ''} />
          </button>
        </div>
        
        <div className="w-full px-2" onClick={(e) => e.stopPropagation()}>
          {getItemQuantity(item.id) > 0 ? (
            <div className="flex items-center justify-between w-full bg-red-50 rounded-xl p-1 border border-red-100">
              <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-red-600 shadow-sm"><Minus size={16} /></button>
              <span className="text-sm font-bold text-red-600">{getItemQuantity(item.id)}</span>
              <button onClick={() => addToCart(item)} className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-red-600 shadow-sm"><Plus size={16} /></button>
            </div>
          ) : (
            <button 
              onClick={() => addToCart(item)} 
              className="w-full py-2.5 bg-white border-2 border-gray-100 rounded-xl text-red-600 text-sm font-black shadow-sm hover:border-red-100 transition-all"
            >
              ADD
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface CustomerAppProps {
  user: User;
  profile: UserProfile | null;
  onLogout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  orders: Booking[];
  loadingOrders: boolean;
  fetchOrders: () => Promise<void>;
  handleCancelOrder: (order: Booking, reason?: string) => Promise<void>;
  cancelling: boolean;
  setActiveMode: (mode: 'customer' | 'worker') => void;
}

const CancellationModal: React.FC<{
  order: Booking;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
}> = ({ order, onClose, onConfirm, loading }) => {
  const [reason, setReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const reasons = [
    'Wait time is too long',
    'Professional is not responding',
    'Found a better price elsewhere',
    'Changed my mind',
    'Booked by mistake',
    'Other'
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-8 overflow-hidden"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Cancel Booking</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <p className="text-gray-500 text-sm mb-6 font-medium">Please tell us why you want to cancel. This helps us improve our service.</p>

        <div className="space-y-3 mb-8">
          {reasons.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`w-full text-left p-4 rounded-2xl border-2 transition-all font-bold text-sm ${
                reason === r 
                  ? 'border-red-600 bg-red-50 text-red-600' 
                  : 'border-gray-100 hover:border-gray-200 text-gray-700'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {reason === 'Other' && (
          <textarea
            value={otherReason}
            onChange={(e) => setOtherReason(e.target.value)}
            placeholder="Please specify your reason..."
            className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-red-600 focus:outline-none text-sm font-medium mb-8 min-h-[100px]"
          />
        )}

        <div className="flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-colors"
          >
            Go Back
          </button>
          <button 
            disabled={!reason || (reason === 'Other' && !otherReason) || loading}
            onClick={() => onConfirm(reason === 'Other' ? otherReason : reason)}
            className="flex-[2] py-4 bg-red-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-red-600/20 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw size={18} className="animate-spin" /> : 'Confirm Cancellation'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const RepairIllustration = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 10L10 28v24a4 4 0 004 4h36a4 4 0 004-4V28L32 10z" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M24 56V40a4 4 0 014-4h8a4 4 0 014 4v16" fill="#FECACA" stroke="#EF4444" strokeWidth="2" strokeLinejoin="round"/>
      <motion.g
        animate={{ scale: [1, 1.1, 1], y: [0, -2, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      >
        <rect x="36" y="24" width="16" height="12" rx="2" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="2"/>
        <path d="M40 24v-4a2 2 0 012-2h4a2 2 0 012 2v4" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round"/>
        <motion.path 
          d="M36 30h16" 
          stroke="#93C5FD" 
          strokeWidth="2"
          animate={{ y: [0, -2, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        />
      </motion.g>
      <motion.path 
        d="M16 20l2-2M12 24l-2-2" 
        stroke="#F59E0B" 
        strokeWidth="2" 
        strokeLinecap="round"
        animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      />
    </svg>
  </div>
);

const VehicleIllustration = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
      <motion.g
        animate={{ x: [-1, 1, -1], y: [0, -1, 0] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
      >
        <path d="M14 36h36v10a4 4 0 01-4 4H18a4 4 0 01-4-4V36z" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M18 36l6-14h16l6 14" fill="#DBEAFE" stroke="#1D4ED8" strokeWidth="2" strokeLinejoin="round"/>
        <circle cx="22" cy="46" r="6" fill="#1E293B" stroke="#475569" strokeWidth="2"/>
        <circle cx="42" cy="46" r="6" fill="#1E293B" stroke="#475569" strokeWidth="2"/>
        <path d="M26 36h12" stroke="#1D4ED8" strokeWidth="2" strokeLinecap="round"/>
      </motion.g>
      <motion.g
        animate={{ opacity: [0.2, 1, 0.2] }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      >
        <path d="M8 32l-4-4M56 32l4-4M32 14v-6" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round"/>
      </motion.g>
    </svg>
  </div>
);

const ElectricalIllustration = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="18" y="14" width="28" height="36" rx="6" fill="#F1F5F9" stroke="#64748B" strokeWidth="2"/>
      <circle cx="26" cy="26" r="3" fill="#64748B"/>
      <circle cx="38" cy="26" r="3" fill="#64748B"/>
      <rect x="28" y="36" width="8" height="6" rx="2" fill="#64748B"/>
      <motion.g
        animate={{ 
          scale: [1, 1.15, 1], 
          filter: ["drop-shadow(0 0 2px rgba(245,158,11,0.4))", "drop-shadow(0 0 10px rgba(245,158,11,0.8))", "drop-shadow(0 0 2px rgba(245,158,11,0.4))"] 
        }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      >
        <path d="M38 6L22 30h12l-4 28 20-30H36l6-22z" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" strokeLinejoin="round"/>
      </motion.g>
    </svg>
  </div>
);

const InstallationIllustration = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
      <motion.g
        animate={{ y: [2, -3, 2] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      >
        <rect x="14" y="16" width="36" height="18" rx="3" fill="#E2E8F0" stroke="#475569" strokeWidth="2"/>
        <path d="M18 22h28M18 28h28" stroke="#475569" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="44" cy="25" r="2" fill="#10B981"/>
      </motion.g>
      <motion.g
        animate={{ y: [2, -3, 2] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      >
        <path d="M32 40v14M22 46l10-6 10 6" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M28 54h8" stroke="#10B981" strokeWidth="3" strokeLinecap="round"/>
      </motion.g>
    </svg>
  </div>
);

const QuickAccessCard = ({ 
  title, 
  icon: Icon, 
  isSelected, 
  onClick 
}: { 
  title: string, 
  icon: React.FC, 
  isSelected: boolean, 
  onClick: () => void 
}) => {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className={`relative flex flex-col items-center justify-center p-1 rounded-[22px] transition-all duration-500 w-full h-full ${
        isSelected 
          ? 'bg-[#2a2c45] border border-red-500/50 shadow-[0_0_15px_-3px_rgba(239,68,68,0.2)] z-10' 
          : 'bg-[#1a1b2e] border border-white/5 hover:bg-[#22243a] hover:border-white/10'
      }`}
    >
      {isSelected && (
        <motion.div 
          layoutId="activeGlow"
          className="absolute inset-0 rounded-[22px] ring-1 ring-red-500/50 ring-inset bg-red-500/5"
          initial={false}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      <div className="h-8 w-8 mb-1 flex items-center justify-center relative z-10">
        <Icon />
      </div>
      <span className={`text-[8px] font-bold text-center leading-tight relative z-10 px-0.5 ${
        isSelected ? 'text-red-400' : 'text-gray-400'
      }`}>
        {title}
      </span>
    </motion.button>
  );
};

export const CustomerApp: React.FC<CustomerAppProps> = ({
  user,
  profile,
  onLogout,
  fetchProfile,
  orders,
  loadingOrders,
  fetchOrders,
  handleCancelOrder,
  cancelling,
  setActiveMode
}) => {
  const [view, setView] = useState<AppView>(AppView.HOME);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | null>(null);
  const [selectedItem, setSelectedItem] = useState<ServiceItem | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [orderToCancel, setOrderToCancel] = useState<Booking | null>(null);
  const [activeOrder, setActiveOrder] = useState<Booking | null>(null);
  const [activeChatJob, setActiveChatJob] = useState<Booking | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(favId => favId !== id) : [...prev, id]
    );
  };

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
        senderName: profile?.name || 'Customer',
        text: newMessage,
        createdAt: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  const [showNotifications, setShowNotifications] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [activeChatOrder, setActiveChatOrder] = useState<Booking | null>(null);
  const [isSelectingAddress, setIsSelectingAddress] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string>('Detecting location...');
  const { cart, addToCart, removeFromCart, getItemQuantity, cartTotal } = useCart();

  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const placeholders = ['Search for Plumbing', 'Search for AC Repair', 'Search for Home Cleaning', 'Search for Electrician'];

  const [currentBanner, setCurrentBanner] = useState(0);
  const promoBanners = [
    {
      id: 1,
      title: 'Summer is Coming',
      subtitle: 'Get your AC serviced now',
      buttonText: 'Book AC Service',
      color: 'from-blue-600 to-blue-800',
      icon: <Wind size={80} className="text-white/10 absolute -right-4 -bottom-4 rotate-12" />,
      categoryName: 'AC Repair',
      image: 'https://images.unsplash.com/photo-1759772238012-9d5ad59ae637?q=80&w=823&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
      id: 2,
      title: 'Monsoon Special',
      subtitle: 'Waterproofing & Leakage Fix',
      buttonText: 'Book Plumbing',
      color: 'from-cyan-600 to-cyan-800',
      icon: <Droplets size={80} className="text-white/10 absolute -right-4 -bottom-4 rotate-12" />,
      categoryName: 'Plumbing',
      image: 'https://images.unsplash.com/photo-1542013936693-884638332954?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
      id: 3,
      title: 'Deep Cleaning',
      subtitle: 'Make your home shine',
      buttonText: 'Book Cleaning Now',
      color: 'from-purple-600 to-purple-800',
      icon: <Sparkles size={80} className="text-white/10 absolute -right-4 -bottom-4 rotate-12" />,
      categoryName: 'Cleaning',
      image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    }
  ];

  useEffect(() => {
    const pInterval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 2000);

    const bInterval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % promoBanners.length);
    }, 5000);

    return () => {
      clearInterval(pInterval);
      clearInterval(bInterval);
    };
  }, []);

  useEffect(() => {
    if (cart.length > 0) {
      setJustAdded(true);
      const timer = setTimeout(() => setJustAdded(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [cart.length]);

  useEffect(() => {
    // Try to get current location on mount
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser. Please enable it in settings to find services near you.');
      setCurrentLocation('Poornima University, Jaipur');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
          const data = await response.json();
          setCurrentLocation(data.display_name || 'Current Location');
          if (!selectedAddress) {
            setSelectedAddress({ type: 'Current Location', address: data.display_name });
          }
        } catch (error) {
          console.error("Error fetching address:", error);
          setCurrentLocation('Poornima University, Jaipur');
        }
      },
      (error) => {
        let errorMsg = 'An unknown error occurred.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'User denied the request for Geolocation.';
            alert('Location access denied. Please enable location permissions in your browser settings to see nearby services.');
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMsg = 'The request to get user location timed out.';
            break;
        }
        console.error("Geolocation error:", errorMsg, error);
        // Fallback to default location
        setCurrentLocation('Poornima University, Jaipur');
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    setActiveOrder(prev => {
      if (!prev) return null;
      const updated = orders.find(o => o.id === prev.id);
      return updated || prev;
    });
  }, [orders]);

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
    if (category.name === 'Appliances') {
      setView(AppView.SUB_CATEGORY);
    } else {
      setSelectedSubCategory(null); // Clear subcategory to show all items
      setView(AppView.SERVICE_DETAILS);
    }
  };

  const handleSubCategoryClick = (subCategory: SubCategory) => {
    setSelectedSubCategory(subCategory);
    if (selectedCategory?.name === 'Appliances') {
      setView(AppView.DEVICE_SELECTION);
    } else {
      setView(AppView.SERVICE_DETAILS);
    }
  };

  const handleItemClick = (item: ServiceItem) => {
    setSelectedItem(item);
    setView(AppView.ITEM_DETAILS);
  };

  // --- Renderers ---

  const [activeTopTab, setActiveTopTab] = useState('repair');

  const renderCategoryCard = (cat: Category, index: number) => (
    <motion.div
      key={cat.id}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 100 }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => handleCategoryClick(cat)}
      className="relative aspect-[4/5] rounded-[32px] overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
    >
      <img 
        src={cat.imageUrl || `https://source.unsplash.com/featured/800x600?${cat.name.replace(/\s+/g, '')},repair,professional`} 
        alt={cat.name} 
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
        style={{ width: '100%', height: '100%' }}
        referrerPolicy="no-referrer" 
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
      
      {/* Wishlist Button */}
      <button className="absolute top-4 right-4 w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors z-10">
        <Heart size={16} strokeWidth={2.5} />
      </button>

      {/* Tag */}
      {cat.tag && (
        <div className="absolute top-4 left-4 bg-white px-3 py-1 rounded-full text-[10px] font-black text-red-600 uppercase tracking-wider shadow-sm">
          {cat.tag}
        </div>
      )}

      {/* Content */}
      <div className="absolute bottom-4 left-4 right-4">
        <h4 className="text-white font-bold text-lg leading-tight mb-1">{cat.name}</h4>
        <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider">
          Starts at ₹{cat.priceStart}
        </p>
      </div>

      {/* Action Button */}
      <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
        <ChevronRight size={16} strokeWidth={3} />
      </div>
    </motion.div>
  );

  const renderTabContent = () => {
    const enhancedCategories = APP_CATEGORIES.map(cat => ({ ...cat }));
    const filterOptions = ['All', ...Array.from(new Set(APP_CATEGORIES.map(c => c.category || 'Other')))];
    const filteredCategories = selectedFilter === 'All' 
      ? enhancedCategories 
      : enhancedCategories.filter(c => (c.category || 'Other') === selectedFilter);

    if (activeTopTab === 'repair') {
      return (
        <div className="space-y-8 pt-6">
          {/* Carousel Promo Banner */}
          <div className="px-5">
            <div className="relative h-60 rounded-[32px] overflow-hidden shadow-2xl shadow-black/5 cursor-pointer"
                 onClick={() => {
                   const cat = APP_CATEGORIES.find(c => c.name === promoBanners[currentBanner].categoryName);
                   if (cat) handleCategoryClick(cat);
                 }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentBanner}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0 bg-gray-900"
                >
                  <motion.img 
                    src={promoBanners[currentBanner].image} 
                    alt="Promo" 
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 5 }}
                    className="w-full h-full object-cover opacity-50" 
                    referrerPolicy="no-referrer" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-8 flex flex-col justify-end">
                    <div className="relative z-10">
                      <h2 className="text-2xl font-bold text-white leading-tight mb-2 tracking-tight">
                        {promoBanners[currentBanner].title}
                      </h2>
                      <p className="text-white/70 text-sm font-medium mb-6">
                        {promoBanners[currentBanner].subtitle}
                      </p>
                      <button 
                        className="px-8 py-3 bg-white text-gray-900 rounded-2xl font-bold text-xs tracking-widest shadow-xl hover:bg-gray-100 transition-colors"
                      >
                        {promoBanners[currentBanner].buttonText}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
              
              {/* Dots */}
              {promoBanners.length > 1 && (
                <div className="absolute top-8 right-8 flex gap-1.5 z-20">
                  {promoBanners.map((_, idx) => (
                    <div 
                      key={idx}
                      className={`h-1 rounded-full transition-all duration-500 ${idx === currentBanner ? 'w-6 bg-white' : 'w-1.5 bg-white/30'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Browse by Type & Grid */}
          <div className="px-5">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Browse by Type</h3>
            
            {/* Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar -mx-5 px-5 mb-2">
              {filterOptions.map(option => (
                <button
                  key={option}
                  onClick={() => setSelectedFilter(option)}
                  className={`px-5 py-2.5 rounded-full whitespace-nowrap font-bold text-sm transition-all ${
                    selectedFilter === option
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            {/* 2-Column Service Grid */}
            <div className="grid grid-cols-2 gap-4">
              {filteredCategories.map((cat, index) => renderCategoryCard(cat, index))}
            </div>
          </div>

          {/* Offers & Discounts Sliding Banner */}
          <div className="mt-12 px-5">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">Exclusive Offers</h3>
                <p className="text-sm text-gray-500 font-medium">Handpicked deals for you</p>
              </div>
              <button className="text-red-600 text-xs font-bold tracking-widest hover:underline">VIEW ALL</button>
            </div>
            
            <div className="flex gap-5 overflow-x-auto pb-8 hide-scrollbar -mx-5 px-5 snap-x snap-mandatory">
              {/* Offer 1 */}
              <motion.div 
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  const cat = APP_CATEGORIES.find(c => c.id === '3');
                  if (cat) handleCategoryClick(cat);
                }}
                className="min-w-[280px] sm:min-w-[320px] bg-slate-50 rounded-[32px] overflow-hidden border border-slate-100 flex flex-col snap-center cursor-pointer hover:shadow-xl hover:shadow-slate-200/50 transition-all"
              >
                <div className="h-40 relative">
                  <img src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Room Cleaning" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute top-4 left-4 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg uppercase tracking-widest">
                    Save 5%
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="text-lg font-bold text-gray-900 leading-tight mb-2">
                    Room cleaning starting at ₹399
                  </h4>
                  <p className="text-sm text-gray-500 font-medium mb-4">Professional deep cleaning service</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-600 tracking-widest">LIMITED TIME</span>
                    <ChevronRight size={20} className="text-gray-400" />
                  </div>
                </div>
              </motion.div>

              {/* Offer 2 */}
              <motion.div 
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  const cat = APP_CATEGORIES.find(c => c.id === '7');
                  if (cat) handleCategoryClick(cat);
                }}
                className="min-w-[280px] sm:min-w-[320px] bg-slate-50 rounded-[32px] overflow-hidden border border-slate-100 flex flex-col snap-center cursor-pointer hover:shadow-xl hover:shadow-slate-200/50 transition-all"
              >
                <div className="h-40 relative">
                  <img src="https://images.unsplash.com/photo-1625047509168-a7026f36de04?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Vehicle Repair" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute top-4 left-4 bg-blue-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg uppercase tracking-widest">
                    Best Value
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="text-lg font-bold text-gray-900 leading-tight mb-2">
                    Vehicle repair & servicing
                  </h4>
                  <p className="text-sm text-gray-500 font-medium mb-4">Pay after 100% satisfaction</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-600 tracking-widest">TOP RATED</span>
                    <ChevronRight size={20} className="text-gray-400" />
                  </div>
                </div>
              </motion.div>

              {/* Offer 3 */}
              <motion.div 
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  const cat = APP_CATEGORIES.find(c => c.id === '9');
                  if (cat) handleCategoryClick(cat);
                }}
                className="min-w-[280px] sm:min-w-[320px] bg-slate-50 rounded-[32px] overflow-hidden border border-slate-100 flex flex-col snap-center cursor-pointer hover:shadow-xl hover:shadow-slate-200/50 transition-all"
              >
                <div className="h-40 relative">
                  <img src="https://images.unsplash.com/photo-1625047509168-a7026f36de04?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Packers and Movers" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute top-4 left-4 bg-purple-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg uppercase tracking-widest">
                    New Launch
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="text-lg font-bold text-gray-900 leading-tight mb-2">
                    Packers and movers
                  </h4>
                  <p className="text-sm text-gray-500 font-medium mb-4">Safe and secure relocation</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-600 tracking-widest">EXPLORE</span>
                    <ChevronRight size={20} className="text-gray-400" />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      );
    } else if (activeTopTab === 'vehicle') {
      const vehicleCategories = APP_CATEGORIES.filter(c => c.category === 'Vehicle');
      return (
        <div className="pt-6 px-5">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Vehicle Emergency Services</h3>
          <div className="grid grid-cols-2 gap-4">
            {vehicleCategories.map((cat, index) => renderCategoryCard(cat, index))}
          </div>
        </div>
      );
    } else if (activeTopTab === 'electrical') {
      const electricalCategories = APP_CATEGORIES.filter(c => c.name === 'Electrician' || c.name === 'Home Security');
      return (
        <div className="pt-6 px-5">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Electrical Services</h3>
          <div className="grid grid-cols-2 gap-4">
            {electricalCategories.map((cat, index) => renderCategoryCard(cat, index))}
          </div>
        </div>
      );
    } else if (activeTopTab === 'install') {
      const installSubCategories: { cat: Category, sub: SubCategory }[] = [];
      APP_CATEGORIES.forEach(c => {
        c.subCategories.forEach(s => {
          if (s.title.toLowerCase().includes('install')) {
            installSubCategories.push({ cat: c, sub: s });
          }
        });
      });

      return (
        <div className="pt-6 px-5 pb-10">
          <h3 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">Installation Services</h3>
          <div className="grid grid-cols-2 gap-4">
            {installSubCategories.map((item, index) => (
              <motion.div
                key={`${item.cat.id}-${item.sub.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  setSelectedCategory(item.cat);
                  setSelectedSubCategory(item.sub);
                  setView(AppView.SERVICE_DETAILS);
                }}
                className="bg-white rounded-[24px] p-3 shadow-sm border border-gray-100 flex flex-col gap-3 cursor-pointer hover:shadow-md transition-all active:scale-95"
              >
                <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100">
                  <img 
                    src={item.sub.imageUrl || item.cat.imageUrl} 
                    alt={item.sub.title} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-gray-900 leading-tight line-clamp-2 min-h-[32px]">
                    {item.sub.title}
                  </h4>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] font-bold text-red-600">₹{item.cat.priceStart}</span>
                    <div className="flex items-center gap-0.5">
                      <Star size={10} className="fill-yellow-400 text-yellow-400" />
                      <span className="text-[10px] font-bold text-gray-600">4.8</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      );
    }
  };

  const renderHome = () => {
    const displayAddress = selectedAddress 
      ? (selectedAddress.type === 'Current Location' ? 'Current Location' : selectedAddress.type)
      : 'Select Location';
    
    const displaySubAddress = selectedAddress
      ? (selectedAddress.type === 'Current Location' ? currentLocation : `${selectedAddress.flatNo}, ${selectedAddress.street}, ${selectedAddress.city}`)
      : 'Tap to set your booking address';

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="pb-32 bg-gray-50"
      >
        {/* Dark Top Section */}
        <div className="bg-[#0f111a] pt-3 pb-5 rounded-b-[32px] shadow-xl relative z-20">
          {/* Location Header */}
          <div className="px-5 pb-2 flex items-center justify-between">
            <div 
              onClick={() => setIsSelectingAddress(true)}
              className="flex flex-col cursor-pointer group"
            >
              <div className="flex items-center gap-1.5">
                <MapPin size={15} className="text-white" strokeWidth={2.5} />
                <span className="text-sm font-bold text-white group-hover:text-gray-200 transition-colors">
                  {displayAddress}
                </span>
                <ChevronRight size={13} className="text-gray-400" />
              </div>
              <p className="text-[11px] text-gray-400 font-medium truncate max-w-[220px] mt-0.5">
                {displaySubAddress}
              </p>
            </div>
            <div className="flex items-center gap-4 relative">
              <button 
                onClick={() => setShowEditProfile(true)}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white"
              >
                {user?.photoURL ? <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" /> : <UserIcon size={18} className="text-gray-500" strokeWidth={2.5} />}
              </button>
            </div>
          </div>

          {/* Search Area */}
          <div className="px-5 mt-0.5">
            <div className="relative h-[40px]">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Search size={16} strokeWidth={2.5} />
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={placeholders[placeholderIndex]}
                className="w-full h-full pl-10 pr-10 bg-[#1a1b2e] border border-white/10 rounded-2xl text-[13px] font-medium focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all text-white placeholder:text-gray-500"
              />
              {searchQuery ? (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              ) : null}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500 border-l border-white/10 pl-2.5 cursor-pointer">
                <Mic size={16} strokeWidth={2.5} />
              </div>
            </div>
          </div>

          {/* Quick Access Banner */}
          <div className="bg-[#1a1b2e] p-1.5 rounded-[24px] shadow-inner mx-4 mt-3 border border-white/10 h-[84px]">
            <div className="flex items-stretch justify-between gap-2 h-full">
              <QuickAccessCard title="Repair & Care" icon={RepairIllustration} isSelected={activeTopTab === 'repair'} onClick={() => setActiveTopTab('repair')} />
              <QuickAccessCard title="Vehicle Emergency" icon={VehicleIllustration} isSelected={activeTopTab === 'vehicle'} onClick={() => setActiveTopTab('vehicle')} />
              <QuickAccessCard title="Electrical" icon={ElectricalIllustration} isSelected={activeTopTab === 'electrical'} onClick={() => setActiveTopTab('electrical')} />
              <QuickAccessCard title="Install / Reinstall" icon={InstallationIllustration} isSelected={activeTopTab === 'install'} onClick={() => setActiveTopTab('install')} />
            </div>
          </div>
        </div>

        {searchQuery.length > 1 ? (
          renderSearchResults()
        ) : (
          renderTabContent()
        )}
      </motion.div>
    );
  };

  const renderSubCategory = () => {
    if (!selectedCategory) return null;
    
    if (selectedCategory.name === 'Appliances') {
      return (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-white pb-32"
        >
          {/* Header */}
          <div className="px-5 pt-6 pb-4 bg-white sticky top-0 z-30 border-b border-gray-50 flex items-center gap-4">
            <button onClick={() => setView(AppView.HOME)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft size={24} className="text-gray-900" />
            </button>
            <h2 className="text-xl font-bold text-gray-900">{selectedCategory.name}</h2>
          </div>

          {/* Search Bar */}
          <div className="px-5 py-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 h-[52px]">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search size={18} strokeWidth={2.5} />
                </div>
                <input 
                  type="text" 
                  placeholder="Search for appliances..."
                  className="w-full h-full pl-11 pr-4 bg-gray-100 border-none rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          <div className="px-5 space-y-6 mt-4">
            {selectedCategory.subCategories.map((sub) => {
              const isLarge = sub.title.includes('Large');
              const bgImage = sub.imageUrl || 'https://images.unsplash.com/photo-1601760562234-9814eea6663a?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
              const description = isLarge
                ? 'Washing Machine, Fridge, TV & more'
                : 'Microwave, RO, Laptops & more';

              return (
                <motion.div
                  key={sub.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSubCategoryClick(sub)}
                  className="relative h-[30vh] rounded-[32px] overflow-hidden shadow-lg cursor-pointer group"
                >
                    <img 
                      src={bgImage || `https://source.unsplash.com/featured/800x600?${sub.title.replace(/\s+/g, '')},repair,professional`} 
                      alt={sub.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      style={{ width: '100%', height: '100%' }}
                      referrerPolicy="no-referrer"
                    />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                  
                  <div className="absolute inset-0 p-8 flex items-center justify-between">
                    <div className="max-w-[70%]">
                      <h3 className="text-white font-black text-2xl mb-2">{sub.title}</h3>
                      <p className="text-gray-200 text-sm font-medium">{description}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20">
                      <ChevronRight size={24} strokeWidth={3} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        className="min-h-screen bg-white pb-32"
      >
        <div className="px-5 pt-6 pb-4 bg-white sticky top-0 z-30 border-b border-gray-50 flex items-center gap-4">
          <button onClick={() => setView(AppView.HOME)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-gray-900" />
          </button>
          <h2 className="text-xl font-bold text-gray-900">{selectedCategory.name}</h2>
        </div>
        <div className="p-5 grid grid-cols-3 gap-4">
          {selectedCategory.subCategories.map((sub) => (
            <motion.div
              key={sub.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSubCategoryClick(sub)}
              className="flex flex-col items-center gap-3"
            >
              <div className="w-full aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 flex items-center justify-center relative">
                    <img 
                      src={sub.imageUrl || `https://source.unsplash.com/featured/800x600?${sub.title.replace(/\s+/g, '')},repair,professional`} 
                      alt={sub.title} 
                      className="w-full h-full object-cover" 
                      style={{ width: '100%', height: '100%' }}
                      referrerPolicy="no-referrer"
                    />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              </div>
              <span className="text-[11px] font-bold text-gray-900 text-center leading-tight">{sub.title}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  const renderServiceDetails = () => {
    if (!selectedCategory) return null;
    
    // If selectedSubCategory is null, we show all items from the category
    let itemsToShow = selectedSubCategory 
      ? selectedSubCategory.items 
      : selectedCategory.subCategories.flatMap(sc => sc.items);

    if (selectedCategory.name === 'Appliances' && selectedDevice) {
      itemsToShow = itemsToShow.filter(item => item.title.startsWith(selectedDevice + ":"));
    }

    const pageTitle = selectedDevice || (selectedSubCategory ? selectedSubCategory.title : selectedCategory.name);

    return (
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        className="min-h-screen bg-white pb-40"
      >
        {/* Header */}
        <div className="bg-white px-5 pt-6 pb-4 sticky top-0 z-30 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                if (selectedCategory.name === 'Appliances') {
                  if (selectedDevice) {
                    setSelectedDevice(null);
                    setView(AppView.DEVICE_SELECTION);
                  } else {
                    setView(AppView.SUB_CATEGORY);
                  }
                } else {
                  setView(AppView.HOME);
                }
              }} 
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-900" />
            </button>
            <h2 className="text-xl font-bold text-gray-900">{pageTitle}</h2>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-5 py-4 bg-white">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 h-[52px]">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Search size={18} strokeWidth={2.5} />
              </div>
              <input 
                type="text" 
                placeholder={`Search in ${pageTitle}...`}
                className="w-full h-full pl-11 pr-4 bg-gray-100 border-none rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {itemsToShow.map((item) => (
            <div key={item.id} onClick={() => handleItemClick(item)}>
              <ServiceCard 
                item={item} 
                addToCart={addToCart} 
                removeFromCart={removeFromCart} 
                getItemQuantity={getItemQuantity} 
                isFavorite={favorites.includes(item.id)}
                toggleFavorite={toggleFavorite}
              />
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  const renderItemDetails = () => {
    if (!selectedItem) return null;
    return (
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="min-h-screen bg-white pb-40"
      >
        <div className="relative h-72">
          <img 
            src={selectedItem.imageUrl || `https://source.unsplash.com/featured/800x600?${selectedItem.title.replace(/\s+/g, '')},repair,professional`} 
            alt={selectedItem.title} 
            className="w-full h-full object-cover" 
            style={{ width: '100%', height: '100%' }}
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <button 
            onClick={() => setView(AppView.SERVICE_DETAILS)}
            className="absolute top-6 left-6 p-2 bg-white/20 backdrop-blur-md rounded-full text-white border border-white/20"
          >
            <ArrowLeft size={24} />
          </button>
        </div>

        <div className="px-6 -mt-8 relative z-10">
          <div className="bg-white rounded-[40px] p-8 shadow-xl border border-gray-50">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedItem.title}</h2>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 px-2 py-1 bg-yellow-50 rounded-lg text-xs font-bold text-yellow-700">
                    <Star size={14} className="fill-yellow-700" /> {selectedItem.rating}
                  </div>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">{selectedItem.reviews} Reviews</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">₹{selectedItem.price}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Inclusive of all taxes</p>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">Service Description</h3>
                <ul className="space-y-4">
                  {selectedItem.descriptionPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-600 leading-relaxed">
                      <div className="w-2 h-2 rounded-full bg-red-600 mt-1.5 shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-red-600 shadow-sm">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">OrGo Safe Guarantee</h4>
                    <p className="text-[10px] text-gray-500 font-medium">Verified professionals & insurance covered</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-50">
          {getItemQuantity(selectedItem.id) > 0 ? (
            <div className="flex items-center gap-4">
              <div className="flex-1 flex items-center justify-between bg-gray-100 rounded-2xl p-2">
                <button onClick={() => removeFromCart(selectedItem.id)} className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-red-600 shadow-sm"><Minus size={20} /></button>
                <span className="text-lg font-bold text-gray-900">{getItemQuantity(selectedItem.id)}</span>
                <button onClick={() => addToCart(selectedItem)} className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-red-600 shadow-sm"><Plus size={20} /></button>
              </div>
              <button 
                onClick={() => setView(AppView.CART)}
                className="flex-[1.5] py-4 bg-red-600 text-white rounded-2xl font-bold shadow-lg shadow-red-600/20 active:scale-[0.98] transition-all"
              >
                Go to Cart
              </button>
            </div>
          ) : (
            <button 
              onClick={() => addToCart(selectedItem)}
              className="w-full py-5 bg-red-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-red-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              <ShoppingCart size={24} /> Book Now
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  const renderSearchResults = () => {
    const results = APP_CATEGORIES.flatMap(category => 
      category.subCategories.flatMap(sub => 
        sub.items.filter(item => 
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sub.title.toLowerCase().includes(searchQuery.toLowerCase())
        ).map(item => ({
          ...item,
          categoryName: category.name,
          categoryObj: category,
          subCategoryObj: sub
        }))
      )
    );

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-4 space-y-4"
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-bold text-gray-900">Search Results</h3>
          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{results.length} found</span>
        </div>
        
        {results.length > 0 ? (
          <div className="space-y-3">
            {results.map((result, idx) => (
              <motion.div
                key={`${result.id}-${idx}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 relative">
                  <img 
                    src={result.imageUrl || `https://source.unsplash.com/featured/800x600?${result.title.replace(/\s+/g, '')},repair,professional`} 
                    alt={result.title} 
                    className="w-full h-full object-cover" 
                    style={{ width: '100%', height: '100%' }}
                    referrerPolicy="no-referrer" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 truncate">{result.title}</h4>
                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mt-0.5">in {result.categoryName}</p>
                  <p className="text-xs text-gray-500 font-medium mt-1">₹{result.price}</p>
                </div>
                <button 
                  onClick={() => {
                    setSelectedCategory(result.categoryObj);
                    setSelectedSubCategory(result.subCategoryObj);
                    setSearchQuery('');
                    setView(AppView.SERVICE_DETAILS);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-600/20 hover:bg-red-700 transition-colors"
                >
                  View
                </button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Search size={32} className="text-gray-300" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-1">No results found</h4>
            <p className="text-sm text-gray-500 font-medium">Try searching for something else</p>
          </div>
        )}
      </motion.div>
    );
  };

  const renderDeviceSelection = () => {
    if (!selectedSubCategory) return null;

    const devices = selectedSubCategory.title === 'Large Appliances' 
      ? [
          { name: 'Washing Machine', imageUrl: 'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?q=80&w=870&auto=format&fit=crop' },
          { name: 'Refrigerator', imageUrl: 'https://images.unsplash.com/photo-1721613877687-c9099b698faa?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
          { name: 'Television', imageUrl: 'https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?q=80&w=736&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' }
        ]
      : [
          { name: 'Microwave', imageUrl: 'https://images.unsplash.com/photo-1723259461381-59ab9fa18f5d?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
          { name: 'Chimney', imageUrl: 'https://images.unsplash.com/photo-1642979430180-e676c2235ce2?q=80&w=1032&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
          { name: 'Stove', imageUrl: 'https://images.unsplash.com/photo-1609211373254-b52e03ba0c85?q=80&w=776&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
          { name: 'Laptop', imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=871&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
          { name: 'Water Purifier/RO', imageUrl: 'https://images.unsplash.com/photo-1662460149789-5aebed905701?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
          { name: 'Geyser', imageUrl: 'https://images.unsplash.com/photo-1714894691666-e8bb020c781c?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' }
        ];

    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="min-h-screen bg-white pb-32"
      >
        {/* Header */}
        <div className="px-5 pt-6 pb-4 bg-white sticky top-0 z-30 border-b border-gray-50 flex items-center gap-4">
          <button 
            onClick={() => setView(AppView.SUB_CATEGORY)}
            className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h2 className="text-xl font-bold text-gray-900">{selectedSubCategory.title}</h2>
        </div>

        <div className="px-5 pt-6">
          <p className="text-sm text-gray-500 font-medium mb-6">Select your device to see available services</p>
          
          <div className="grid grid-cols-2 gap-4">
            {devices.map((device, idx) => (
              <motion.div
                key={device.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedDevice(device.name);
                  setView(AppView.SERVICE_DETAILS);
                }}
                className="relative aspect-square rounded-[32px] overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <img 
                  src={device.imageUrl || `https://source.unsplash.com/featured/800x600?${device.name.replace(/\s+/g, '')},repair,professional`} 
                  alt={device.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  style={{ width: '100%', height: '100%' }}
                  referrerPolicy="no-referrer" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h4 className="text-white font-bold text-sm leading-tight">{device.name}</h4>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderOrders = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-32 bg-gray-50 min-h-screen"
    >
      <div className="bg-white px-5 pt-6 pb-5 sticky top-0 z-20 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">My Bookings</h2>
          <button onClick={fetchOrders} disabled={loadingOrders} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl text-red-600">
            <RefreshCw size={18} className={loadingOrders ? "animate-spin" : ""} />
          </button>
        </div>
      </div>
      <div className="p-5 space-y-5">
        {orders.length === 0 && !loadingOrders ? (
          <div className="text-center py-24">
            <ClipboardList size={40} className="text-gray-200 mx-auto mb-6" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No bookings yet</h3>
            <button onClick={() => setView(AppView.HOME)} className="px-8 py-3 bg-red-600 text-white font-bold rounded-2xl">Book a service</button>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {order.cartItems?.[0]?.title || 'Home Service'}
                  </h3>
                  <p className="text-xs text-gray-400 font-bold">{order.scheduledDate} • {order.scheduledTime}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${(order.status === 'searching' || order.status === 'assigned') ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-500'}`}>
                  {order.status}
                </span>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-900">₹{order.grandTotal}</span>
                  {(order.status === 'searching' || order.status === 'assigned') && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setOrderToCancel(order);
                      }}
                      className="text-[10px] font-bold text-red-500 px-2 py-1 bg-red-50 rounded-lg uppercase tracking-wider"
                    >
                      Cancel
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  {(order.status === 'assigned' || order.status === 'on_the_way') && (
                    <>
                      <button 
                        onClick={() => {
                          setActiveOrder(order);
                          setView(AppView.TRACKING);
                        }} 
                        className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl shadow-md shadow-red-600/20 active:scale-95 transition-all flex items-center gap-1.5"
                      >
                        <MapPin size={14} /> Track
                      </button>
                    </>
                  )}
                  {order.status !== 'assigned' && order.status !== 'on_the_way' && (
                    <button 
                      onClick={() => {
                        setActiveOrder(order);
                        setView(AppView.TRACKING);
                      }} 
                      className="text-red-600 text-sm font-bold flex items-center gap-1"
                    >
                      View Details <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );

  const renderWallet = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-32 bg-gray-50 min-h-screen"
    >
      <div className="bg-red-600 p-10 text-white rounded-b-[40px] mb-8 shadow-lg">
        <p className="text-xs font-bold uppercase opacity-70 mb-2">OrGo Wallet Balance</p>
        <h2 className="text-4xl font-bold">₹1,240</h2>
      </div>
      <div className="px-5 space-y-6">
        <h3 className="text-xl font-bold text-gray-900">Available Offers</h3>
        <div className="p-5 rounded-3xl border bg-red-50 border-red-100">
          <h4 className="font-bold text-gray-900 text-lg">50% OFF on first booking</h4>
          <p className="text-xs text-gray-500 font-medium mb-5">Valid on all professional services</p>
          <code className="font-bold text-red-600 text-sm tracking-wider">ORGO50</code>
        </div>
      </div>
    </motion.div>
  );

  const renderTracking = () => {
    const trackableOrder = activeOrder || orders.find(o => o.status === 'assigned' || o.status === 'on_the_way' || (o.status === 'completed' && !o.isRated));
    if (!trackableOrder) {
      return (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pb-32 bg-gray-50 min-h-screen flex flex-col items-center justify-center px-6 text-center"
        >
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <MapPin size={40} className="text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Nothing to track right now</h2>
          <p className="text-gray-500 mb-8">Book a service to see your professional's live location here!</p>
          <button 
            onClick={() => setView(AppView.HOME)}
            className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-700 transition-colors"
          >
            Book a Service
          </button>
        </motion.div>
      );
    }
    return (
      <Tracking 
        key="tracking" 
        order={trackableOrder}
        userRole="customer"
        onBack={() => setView(AppView.ORDERS)} 
        onChat={() => setActiveChatJob(trackableOrder)}
      />
    );
  };

  const renderAddressSelection = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end justify-center"
    >
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="bg-white w-full max-w-md rounded-t-[32px] p-8 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Select Location</h3>
          <button onClick={() => setIsSelectingAddress(false)} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <button 
            onClick={() => {
              setSelectedAddress({ type: 'Current Location', address: currentLocation });
              setIsSelectingAddress(false);
            }}
            className="w-full p-4 flex items-center gap-4 bg-red-50 rounded-2xl border border-red-100 text-left"
          >
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-red-600 shadow-sm">
              <RefreshCw size={20} />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Current Location</p>
              <p className="text-xs text-gray-500 truncate max-w-[200px]">{currentLocation}</p>
            </div>
          </button>

          <div className="pt-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Saved Addresses</h4>
            {profile?.addresses && profile.addresses.length > 0 ? (
              <div className="space-y-3">
                {profile.addresses.map((addr: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedAddress(addr);
                      setIsSelectingAddress(false);
                    }}
                    className={`w-full p-4 flex items-center gap-4 rounded-2xl border transition-all text-left ${
                      selectedAddress?.id === addr.id ? 'border-red-600 bg-red-50/30' : 'border-gray-100 bg-white'
                    }`}
                  >
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 shadow-sm">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{addr.type}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">
                        {addr.flatNo}, {addr.street}, {addr.city}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-xs text-gray-400 font-bold">No saved addresses found</p>
                <button 
                  onClick={() => {
                    setIsSelectingAddress(false);
                    setView(AppView.ACCOUNT);
                  }}
                  className="text-red-600 text-xs font-bold mt-2 underline"
                >
                  Add address in profile
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-100 font-sans max-w-md mx-auto relative shadow-2xl">
      <div className="bg-white min-h-screen">
        <AnimatePresence mode="wait">
          {view === AppView.HOME && renderHome()}
          {view === AppView.SUB_CATEGORY && renderSubCategory()}
          {view === AppView.DEVICE_SELECTION && renderDeviceSelection()}
          {view === AppView.SERVICE_DETAILS && renderServiceDetails()}
          {view === AppView.ITEM_DETAILS && renderItemDetails()}
          {view === AppView.ORDERS && renderOrders()}
          {view === AppView.CART && <Cart onClose={() => setView(AppView.SUB_CATEGORY)} setView={setView} />}
          {view === AppView.CHECKOUT && <Checkout onClose={() => setView(AppView.CART)} setView={setView} setActiveOrder={setActiveOrder} />}
          {view === AppView.TRACKING && renderTracking()}
          {view === AppView.ACCOUNT && user && (
            <Account 
              key="account" 
              user={user} 
              onLogout={onLogout} 
              navigate={setView} 
              onUpdateProfile={fetchProfile}
              setActiveMode={setActiveMode}
              profile={profile}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isSelectingAddress && renderAddressSelection()}
          {orderToCancel && (
            <CancellationModal
              order={orderToCancel}
              onClose={() => setOrderToCancel(null)}
              onConfirm={async (reason) => {
                await handleCancelOrder(orderToCancel, reason);
                setOrderToCancel(null);
              }}
              loading={cancelling}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Sticky Cart Bar */}
      <AnimatePresence>
        {cart.length > 0 && (view === AppView.SERVICE_DETAILS || view === AppView.SUB_CATEGORY || view === AppView.DEVICE_SELECTION) && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-20 left-0 right-0 max-w-md mx-auto px-5 z-50"
          >
            <div className="bg-red-600 rounded-2xl p-4 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={24} className="text-white" />
                <div>
                  <p className="text-white font-bold text-sm">₹{cartTotal}</p>
                  <p className="text-white/70 text-[10px] font-bold uppercase">{cart.length} items added</p>
                </div>
              </div>
              <button onClick={() => setView(AppView.CART)} className="px-6 py-2.5 bg-white text-red-600 font-bold rounded-xl text-sm">View Cart</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-xl border-t border-gray-100 flex justify-around py-3 pb-safe z-40">
        {[
          { id: AppView.HOME, icon: Home, label: 'Home' },
          { id: AppView.ORDERS, icon: ClipboardList, label: 'Bookings' },
          { id: AppView.CART, icon: ShoppingCart, label: 'Cart' },
          { id: AppView.TRACKING, icon: MapPin, label: 'Track' },
          { id: AppView.ACCOUNT, icon: UserIcon, label: 'Profile' },
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => {
              if (item.id === AppView.TRACKING) {
                setActiveOrder(null);
              }
              setView(item.id);
            }} 
            className={`flex flex-col items-center gap-1.5 py-1 flex-1 transition-all ${view === item.id ? 'text-red-600' : 'text-gray-400'}`}
          >
            <motion.div 
              animate={item.id === AppView.CART && justAdded ? { scale: [1, 1.4, 1], rotate: [0, 10, -10, 0] } : {}}
              className="relative"
            >
              <item.icon size={22} strokeWidth={view === item.id ? 2.5 : 2} />
              {item.id === AppView.CART && cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 text-white text-[8px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {cart.length}
                </span>
              )}
            </motion.div>
            <span className="text-[9px] font-bold uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </div>

      {showEditProfile && (
        <EditProfileModal 
          user={user} 
          profile={profile} 
          onClose={() => setShowEditProfile(false)} 
          onUpdate={fetchProfile} 
        />
      )}

      {/* Order Chat Modal */}
      <AnimatePresence>
        {activeChatOrder && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
              <div className="flex items-center gap-4">
                <button onClick={() => setActiveChatOrder(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-3">
                  <img 
                    src={activeChatOrder.workerPhoto || 'https://picsum.photos/seed/worker/200'} 
                    className="w-10 h-10 rounded-full object-cover border border-gray-100"
                    alt="Pro"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="font-bold text-gray-900 leading-tight">{activeChatOrder.workerName || 'Professional'}</h3>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Online • Active Job</p>
                  </div>
                </div>
              </div>
              <a href={`tel:+91${activeChatOrder.workerPhone}`} className="p-3 bg-gray-50 text-gray-900 rounded-2xl hover:bg-gray-100 transition-colors">
                <RefreshCw size={18} className="rotate-45" /> {/* Using RefreshCw as a phone icon placeholder if needed, but I have Phone in Tracking.tsx. Let's use a phone icon if available or just a placeholder */}
              </a>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto bg-gray-50 space-y-4 no-scrollbar">
              <div className="flex justify-center mb-6">
                <span className="px-4 py-1.5 bg-gray-200/50 text-gray-500 text-[10px] font-bold rounded-full uppercase tracking-wider">Today</span>
              </div>
              
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-3xl rounded-tl-none shadow-sm max-w-[85%] border border-gray-100">
                  <p className="text-sm text-gray-800 leading-relaxed">Hello! I'm {activeChatOrder.workerName}, your assigned professional. I'm on my way to your location for the {activeChatOrder.cartItems?.[0]?.title} service.</p>
                  <p className="text-[10px] text-gray-400 mt-2 font-bold">10:30 AM</p>
                </div>
              </div>
              
              <div className="flex justify-end">
                <div className="bg-red-600 p-4 rounded-3xl rounded-tr-none shadow-lg shadow-red-600/20 max-w-[85%] text-white">
                  <p className="text-sm leading-relaxed">Great, thank you! I'll be waiting at the address provided.</p>
                  <p className="text-[10px] text-white/60 mt-2 font-bold uppercase tracking-widest">10:32 AM • Read</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-white sticky bottom-0">
              <div className="flex gap-3 items-center">
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    placeholder="Type a message..."
                    className="w-full p-4 pr-12 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all font-medium"
                  />
                </div>
                <button className="w-14 h-14 bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20 active:scale-95 transition-all">
                  <Navigation size={20} className="rotate-90" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {activeChatJob && (
          <motion.div 
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
                  <img src={activeChatJob.workerPhoto || "https://picsum.photos/seed/pro/200"} alt="Professional" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{activeChatJob.workerName || 'Professional'}</h3>
                  <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest">Service Chat</p>
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
