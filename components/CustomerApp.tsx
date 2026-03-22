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
  CheckCircle2,
  RefreshCw,
  Trash2,
  ShoppingCart,
  X
} from 'lucide-react';
import { User } from 'firebase/auth';
import { AppView, Category, SubCategory, UserProfile, Booking } from '../src/types';
import { APP_CATEGORIES } from '../src/constants';
import { useCart } from '../src/CartContext';
import { Tracking } from './Tracking';
import { Account } from './Account';
import { Cart } from './Cart';
import { Checkout } from './Checkout';
import { EditProfileModal } from './EditProfileModal';

interface CustomerAppProps {
  user: User;
  profile: UserProfile | null;
  onLogout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  orders: Booking[];
  loadingOrders: boolean;
  fetchOrders: () => Promise<void>;
  handleCancelOrder: (order: Booking) => Promise<void>;
  cancelling: boolean;
  setActiveMode: (mode: 'customer' | 'worker') => void;
}

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
  const [activeCategory, setActiveCategory] = useState('All');
  const [orderToCancel, setOrderToCancel] = useState<Booking | null>(null);
  const [activeOrder, setActiveOrder] = useState<Booking | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const { cart, addToCart, removeFromCart, getItemQuantity, cartTotal } = useCart();

  useEffect(() => {
    setActiveOrder(prev => {
      if (!prev) return null;
      const updated = orders.find(o => o.id === prev.id);
      return updated || prev;
    });
  }, [orders]);

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
    if (category.subCategories.length === 1) {
      setSelectedSubCategory(category.subCategories[0]);
      setView(AppView.SERVICE_DETAILS);
    } else {
      setView(AppView.SUB_CATEGORY);
    }
  };

  const handleSubCategoryClick = (subCategory: SubCategory) => {
    setSelectedSubCategory(subCategory);
    setView(AppView.SERVICE_DETAILS);
  };

  // --- Renderers ---

  const renderHome = () => {
    const categories = ['All', 'Home', 'Appliances', 'Vehicle', 'Outdoor'];
    const filteredServices = activeCategory === 'All' 
      ? APP_CATEGORIES 
      : APP_CATEGORIES.filter(s => s.category === activeCategory);

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="pb-32 bg-white"
      >
        {/* Location Header */}
        <div className="px-5 pt-6 pb-4 bg-white sticky top-0 z-30 border-b border-gray-50">
          <div className="flex items-center justify-between mb-5">
            <div className="flex flex-col cursor-pointer group">
              <div className="flex items-center gap-1.5">
                <MapPin size={16} className="text-red-600" strokeWidth={2.5} />
                <span className="text-sm font-bold text-gray-900 group-hover:text-red-600 transition-colors">Home</span>
                <ChevronRight size={14} className="text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 font-medium truncate max-w-[220px] mt-0.5">B-12, Vaishali Nagar, Jaipur, Rajasthan 302021</p>
            </div>
            <div className="flex items-center gap-4 relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <Bell size={20} className="text-gray-700" strokeWidth={2.5} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-12 right-0 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                      <h3 className="font-bold text-gray-900">Notifications</h3>
                      <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">2 New</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      <div className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                        <p className="text-sm font-bold text-gray-900 mb-1">Booking Confirmed!</p>
                        <p className="text-xs text-gray-500">Your AC Repair is scheduled for tomorrow at 10 AM.</p>
                        <p className="text-[10px] text-gray-400 mt-2 font-medium">2 hours ago</p>
                      </div>
                      <div className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                        <p className="text-sm font-bold text-gray-900 mb-1">Special Offer</p>
                        <p className="text-xs text-gray-500">Get 20% off on your next plumbing service. Use code PLUMB20.</p>
                        <p className="text-[10px] text-gray-400 mt-2 font-medium">1 day ago</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                onClick={() => setShowEditProfile(true)}
                className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100 hover:bg-gray-100 transition-colors"
              >
                {user?.photoURL ? <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" /> : <UserIcon size={20} className="text-gray-500" strokeWidth={2.5} />}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-600 transition-colors">
              <Search size={18} strokeWidth={2.5} />
            </div>
            <input 
              type="text" 
              placeholder="Search for 'AC Repair'..."
              className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-600/10 focus:bg-white focus:border-red-600 transition-all"
            />
          </div>
        </div>

        <div className="space-y-8 pt-6">
          {/* Hero Banner */}
          <div className="px-5">
            <motion.div 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="relative h-48 rounded-[32px] overflow-hidden group shadow-lg"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-700 to-red-900"></div>
              <div className="relative h-full flex flex-col justify-center px-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-widest mb-4 w-fit border border-white/10">
                  <Sparkles size={12} /> Special Offer
                </div>
                <h2 className="text-3xl font-bold text-white leading-tight mb-2">Up to 50% OFF<br/>on First Booking</h2>
                <p className="text-white/70 text-sm font-medium">Professional services at your doorstep</p>
              </div>
            </motion.div>
          </div>

          {/* Categories */}
          <div>
            <div className="px-5 flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Service Categories</h3>
              <button className="text-red-600 text-sm font-bold hover:underline">See all</button>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar px-5 pb-4">
              {categories.map((cat) => (
                <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap border ${
                    activeCategory === cat 
                      ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20' 
                      : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Services Grid */}
          <div className="px-5">
            <div className="grid grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredServices.map((service) => (
                  <motion.div 
                    key={service.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCategoryClick(service)}
                    className="group relative bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm cursor-pointer"
                  >
                    <div className="aspect-[4/5] relative">
                      <img 
                        src={service.image} 
                        alt={service.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                      
                      {service.tag && (
                        <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[9px] font-bold text-red-600 uppercase tracking-wider shadow-sm">
                          {service.tag}
                        </div>
                      )}
                      
                      <div className="absolute bottom-4 left-4 right-4">
                        <h4 className="text-white font-bold text-lg mb-0.5">{service.name}</h4>
                        <div className="flex items-center justify-between">
                          <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider">Starts at ₹{service.priceStart}</p>
                          <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20">
                            <ChevronRight size={16} strokeWidth={3} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="bg-gray-50 py-10 px-5 grid grid-cols-3 gap-4 border-y border-gray-100">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-red-600 shadow-sm border border-gray-100">
                <ShieldCheck size={24} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest leading-tight">OrGo Safe<br/>Guarantee</span>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-red-600 shadow-sm border border-gray-100">
                <Star size={24} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest leading-tight">4.8 Average<br/>Rating</span>
            </div>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-red-600 shadow-sm border border-gray-100">
                <Clock size={24} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest leading-tight">On-Time<br/>Service</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderSubCategory = () => {
    if (!selectedCategory) return null;
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
              <div className="w-full aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 flex items-center justify-center">
                {sub.image ? (
                  <img src={sub.image} alt={sub.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-red-600">
                    <Home size={24} />
                  </div>
                )}
              </div>
              <span className="text-[11px] font-bold text-gray-900 text-center leading-tight">{sub.title}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  const renderServiceDetails = () => {
    if (!selectedSubCategory) return null;
    return (
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        className="min-h-screen bg-gray-50 pb-40"
      >
        <div className="bg-white px-5 pt-6 pb-4 sticky top-0 z-30 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                if (selectedCategory && selectedCategory.subCategories.length === 1) {
                  setView(AppView.HOME);
                } else {
                  setView(AppView.SUB_CATEGORY);
                }
              }} 
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-900" />
            </button>
            <h2 className="text-xl font-bold text-gray-900">{selectedSubCategory.title}</h2>
          </div>
        </div>
        <div className="p-5 space-y-4">
          {selectedSubCategory.items.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex gap-4">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1 leading-tight">{item.title}</h3>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-bold text-gray-700">
                    <Star size={10} className="fill-gray-700" /> {item.rating}
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium">{item.reviews} reviews</span>
                </div>
                <p className="text-sm font-bold text-gray-900 mb-4">₹{item.price}</p>
                <ul className="space-y-2">
                  {item.descriptionPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[11px] text-gray-500 font-medium">
                      <div className="w-1 h-1 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="w-28 flex flex-col items-center gap-3">
                <div className="w-28 h-28 rounded-2xl overflow-hidden border border-gray-100">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                </div>
                {getItemQuantity(item.id) > 0 ? (
                  <div className="flex items-center justify-between w-full bg-red-50 rounded-xl p-1 border border-red-100">
                    <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-red-600 shadow-sm"><Minus size={16} /></button>
                    <span className="text-sm font-bold text-red-600">{getItemQuantity(item.id)}</span>
                    <button onClick={() => addToCart(item)} className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-red-600 shadow-sm"><Plus size={16} /></button>
                  </div>
                ) : (
                  <button onClick={() => addToCart(item)} className="w-full py-2.5 bg-white border border-gray-200 rounded-xl text-red-600 text-xs font-bold shadow-sm">ADD</button>
                )}
              </div>
            </div>
          ))}
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
                <span className="text-lg font-bold text-gray-900">₹{order.grandTotal}</span>
                <button 
                  onClick={() => {
                    setActiveOrder(order);
                    setView(AppView.TRACKING);
                  }} 
                  className="text-red-600 text-sm font-bold flex items-center gap-1"
                >
                  View Details <ChevronRight size={14} />
                </button>
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
      />
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans max-w-md mx-auto relative shadow-2xl">
      <div className="bg-white min-h-screen">
        <AnimatePresence mode="wait">
          {view === AppView.HOME && renderHome()}
          {view === AppView.SUB_CATEGORY && renderSubCategory()}
          {view === AppView.SERVICE_DETAILS && renderServiceDetails()}
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
            />
          )}
        </AnimatePresence>
      </div>

      {/* Sticky Cart Bar */}
      <AnimatePresence>
        {cart.length > 0 && (view === AppView.SERVICE_DETAILS || view === AppView.SUB_CATEGORY) && (
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
            <item.icon size={22} strokeWidth={view === item.id ? 2.5 : 2} />
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
    </div>
  );
};
