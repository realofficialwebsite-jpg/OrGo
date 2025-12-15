import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { Auth } from './components/Auth';
import { BookingWizard } from './components/BookingWizard';
import { Tracking } from './components/Tracking';
import { Account } from './components/Account';
import { Service, AppView, Booking } from './types';
import { 
  Home, 
  ClipboardList, 
  Tag, 
  MapPin, 
  User as UserIcon, 
  Wrench, 
  Droplet, 
  Hammer, 
  Zap, 
  Truck, 
  Scissors, 
  Search, 
  Menu,
  Copy,
  Star
} from 'lucide-react';

const SERVICES: Service[] = [
  { id: '1', name: 'Appliance Repair', icon: 'wrench', priceStart: 299 },
  { id: '2', name: 'Plumbing', icon: 'droplet', priceStart: 199 },
  { id: '3', name: 'Carpentry', icon: 'hammer', priceStart: 349 },
  { id: '4', name: 'Electrical', icon: 'zap', priceStart: 249 },
  { id: '5', name: 'Vehicle Repair', icon: 'truck', priceStart: 499 },
  { id: '6', name: 'Gardening', icon: 'scissors', priceStart: 399 },
  { id: '7', name: 'Cleaning', icon: 'search', priceStart: 499 },
  { id: '8', name: 'Painting', icon: 'brush', priceStart: 999 },
];

const MOCK_ORDERS: Booking[] = [
  { id: 'ORD-101', serviceName: 'Plumbing', professionalName: 'Rajesh Kumar', date: 'Today', time: '11:00 AM', status: 'Active', price: 450, address: 'Raja Park, Jaipur' },
  { id: 'ORD-098', serviceName: 'AC Repair', professionalName: 'Amit Singh', date: 'Oct 12', time: '02:00 PM', status: 'Completed', price: 1200, address: 'Malviya Nagar, Jaipur' },
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<AppView>(AppView.HOME);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (!currentUser) setView(AppView.AUTH);
      else if (view === AppView.AUTH) setView(AppView.HOME);
    });
    return () => unsubscribe();
  }, [view]);

  const handleServiceClick = (service: Service) => {
    setSelectedService(service);
    setView(AppView.BOOKING);
  };

  const handleBookingComplete = () => {
    setView(AppView.TRACKING);
    setSelectedService(null);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setView(AppView.AUTH);
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-red-600 font-bold">Loading OrGo...</div>;

  if (!user) return <Auth onLoginSuccess={() => setView(AppView.HOME)} />;

  if (view === AppView.BOOKING && selectedService) {
    return (
      <BookingWizard 
        service={selectedService} 
        onClose={() => setView(AppView.HOME)} 
        onComplete={handleBookingComplete} 
      />
    );
  }

  // --- Views ---

  const renderHome = () => (
    <div className="pb-24">
      {/* Location Bar */}
      <div className="bg-red-600 text-white p-4 pt-4 pb-6 rounded-b-3xl shadow-lg sticky top-0 z-20">
        <div className="flex items-center justify-between mb-2">
            <h1 className="font-extrabold text-2xl tracking-tighter">OrGo</h1>
            <Menu size={24} />
        </div>
        <div className="flex items-center gap-2 bg-red-700 bg-opacity-50 p-2 rounded-lg cursor-pointer">
          <MapPin size={18} className="text-red-200" />
          <div className="flex-1">
            <p className="text-xs text-red-200 font-medium">Location</p>
            <p className="font-bold text-sm flex items-center gap-1">Jaipur, Rajasthan <span className="rotate-90">›</span></p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 -mt-4 relative z-10">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg shadow-red-200">
          <p className="font-medium opacity-90 mb-1">New in Jaipur?</p>
          <h2 className="text-2xl font-bold mb-3 leading-tight">Get 50% OFF on your first booking!</h2>
          <div className="inline-block bg-white text-red-600 px-3 py-1 rounded border-2 border-dashed border-red-200 font-mono font-bold text-sm">
            Use Code: ORGO50
          </div>
        </div>

        {/* Services Grid */}
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-4">What do you need help with?</h3>
          <div className="grid grid-cols-3 gap-3">
            {SERVICES.map((s) => (
              <div 
                key={s.id} 
                onClick={() => handleServiceClick(s)}
                className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center gap-2 active:scale-95 transition"
              >
                <div className="bg-red-50 p-3 rounded-full text-red-600">
                  {s.icon === 'wrench' && <Wrench size={20} />}
                  {s.icon === 'droplet' && <Droplet size={20} />}
                  {s.icon === 'hammer' && <Hammer size={20} />}
                  {s.icon === 'zap' && <Zap size={20} />}
                  {s.icon === 'truck' && <Truck size={20} />}
                  {s.icon === 'scissors' && <Scissors size={20} />}
                  {s.icon === 'search' && <Search size={20} />}
                  {s.icon === 'brush' && <div className="w-5 h-5 bg-red-600 rounded-full" />}
                </div>
                <p className="text-xs font-semibold text-gray-700 leading-tight">{s.name}</p>
                <p className="text-[10px] text-gray-400">From ₹{s.priceStart}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="pb-24 p-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 mt-2">My Bookings</h2>
      <div className="space-y-4">
        {MOCK_ORDERS.map((order) => (
          <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-lg text-gray-800">{order.serviceName}</h3>
                <p className="text-sm text-gray-500">{order.professionalName}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-bold ${order.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {order.status}
              </span>
            </div>
            <div className="text-sm text-gray-600 space-y-1 mb-4">
               <p>{order.date} • {order.time}</p>
               <p className="truncate">{order.address}</p>
               <p className="font-bold text-gray-900">₹{order.price}</p>
            </div>
            <div className="flex gap-3 pt-3 border-t">
              {order.status === 'Active' ? (
                <>
                  <button onClick={() => setView(AppView.TRACKING)} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium">Track</button>
                  <button className="flex-1 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium">Cancel</button>
                </>
              ) : (
                <button className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                    <Star size={16} /> Rate Pro
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderOffers = () => (
    <div className="pb-24">
      <div className="bg-red-600 text-white p-6 rounded-b-3xl mb-6">
        <h2 className="text-2xl font-bold mb-2">Exclusive Jaipur Offers</h2>
        <p className="opacity-90">Save big on your home services today</p>
      </div>
      <div className="px-4 space-y-4">
        {[
          { code: 'ORGO50', title: '50% OFF First Booking', desc: 'Max discount ₹200. Valid for new users.' },
          { code: 'PLUMB100', title: 'Flat ₹100 OFF', desc: 'On all plumbing services above ₹499.' },
          { code: 'FREECALL', title: 'Free Consultation', desc: 'Get expert advice for free via chat.' },
        ].map((offer) => (
          <div key={offer.code} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -top-4 bg-yellow-400 w-16 h-16 rounded-full opacity-20"></div>
            <h3 className="font-bold text-lg text-red-600 mb-1">{offer.title}</h3>
            <p className="text-sm text-gray-600 mb-3">{offer.desc}</p>
            <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-dashed border-gray-300">
              <code className="font-bold text-gray-800">{offer.code}</code>
              <button className="text-xs font-bold text-red-600 flex items-center gap-1 uppercase">
                <Copy size={12} /> Copy
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans max-w-md mx-auto shadow-2xl relative overflow-hidden">
      {/* Content Area */}
      <div className="h-full overflow-y-auto no-scrollbar bg-gray-50 min-h-screen">
        {view === AppView.HOME && renderHome()}
        {view === AppView.ORDERS && renderOrders()}
        {view === AppView.OFFERS && renderOffers()}
        {view === AppView.TRACKING && <Tracking />}
        {view === AppView.ACCOUNT && user && (
            <Account user={user} onLogout={handleLogout} navigate={setView} />
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 flex justify-around py-3 pb-safe z-30 shadow-[0_-5px_10px_rgba(0,0,0,0.05)]">
        <button onClick={() => setView(AppView.HOME)} className={`flex flex-col items-center gap-1 ${view === AppView.HOME ? 'text-red-600' : 'text-gray-400'}`}>
          <Home size={24} strokeWidth={view === AppView.HOME ? 3 : 2} />
          <span className="text-[10px] font-medium">Home</span>
        </button>
        <button onClick={() => setView(AppView.ORDERS)} className={`flex flex-col items-center gap-1 ${view === AppView.ORDERS ? 'text-red-600' : 'text-gray-400'}`}>
          <ClipboardList size={24} strokeWidth={view === AppView.ORDERS ? 3 : 2} />
          <span className="text-[10px] font-medium">Orders</span>
        </button>
        <button onClick={() => setView(AppView.OFFERS)} className={`flex flex-col items-center gap-1 ${view === AppView.OFFERS ? 'text-red-600' : 'text-gray-400'}`}>
          <Tag size={24} strokeWidth={view === AppView.OFFERS ? 3 : 2} />
          <span className="text-[10px] font-medium">Offers</span>
        </button>
        <button onClick={() => setView(AppView.TRACKING)} className={`flex flex-col items-center gap-1 ${view === AppView.TRACKING ? 'text-red-600' : 'text-gray-400'}`}>
          <MapPin size={24} strokeWidth={view === AppView.TRACKING ? 3 : 2} />
          <span className="text-[10px] font-medium">Track</span>
        </button>
        <button onClick={() => setView(AppView.ACCOUNT)} className={`flex flex-col items-center gap-1 ${view === AppView.ACCOUNT ? 'text-red-600' : 'text-gray-400'}`}>
          <UserIcon size={24} strokeWidth={view === AppView.ACCOUNT ? 3 : 2} />
          <span className="text-[10px] font-medium">Account</span>
        </button>
      </div>
    </div>
  );
};

export default App;