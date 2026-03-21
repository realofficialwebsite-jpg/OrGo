import React from 'react';
import { motion } from 'motion/react';
import { Phone, MessageSquare, MapPin, CheckCircle, ChevronLeft, Star, Clock, Navigation } from 'lucide-react';

interface TrackingProps {
  onBack?: () => void;
}

export const Tracking: React.FC<TrackingProps> = ({ onBack }) => {
  return (
    <div className="flex flex-col h-screen bg-white max-w-2xl mx-auto relative overflow-hidden font-sans">
      {/* Header */}
      <div className="absolute top-6 left-6 z-20">
        <button 
          onClick={onBack}
          className="p-3 bg-white shadow-lg rounded-2xl text-gray-700 active:scale-95 transition-all border border-gray-100"
        >
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>
      </div>

      {/* Map Section */}
      <div id="map-container" className="h-[50vh] bg-slate-50 relative w-full overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://api.maptiler.com/maps/basic-v2/static/-122.4194,37.7749,12/800x600.png?key=get_your_own_key')] bg-cover opacity-40 grayscale contrast-[1.1]"></div>
        
        {/* Animated Route Line (Visual only) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <motion.path
            d="M 100 100 L 200 250"
            stroke="#6366f1"
            strokeWidth="3"
            strokeDasharray="6 6"
            fill="transparent"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </svg>

        {/* User Pin */}
        <div className="absolute top-[250px] left-[200px] transform -translate-x-1/2 -translate-y-1/2">
           <div className="relative">
             <div className="w-5 h-5 bg-primary rounded-full border-4 border-white shadow-xl"></div>
             <div className="absolute -top-10 -left-8 bg-white px-3 py-1.5 rounded-xl shadow-xl text-[10px] font-bold whitespace-nowrap border border-gray-50 text-gray-900">You are here</div>
             <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
           </div>
        </div>

        {/* Pro Pin */}
        <motion.div 
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="absolute top-[100px] left-[100px]"
        >
           <div className="relative">
             <div className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-gray-100">
                <Navigation className="text-primary fill-primary/5 rotate-45" size={24} strokeWidth={2.5} />
             </div>
             <div className="absolute -top-12 -left-10 bg-primary text-white px-3 py-1.5 rounded-xl shadow-xl text-[10px] font-bold whitespace-nowrap">Professional</div>
           </div>
        </motion.div>
      </div>

      {/* Bottom Sheet */}
      <div className="flex-1 -mt-12 bg-white rounded-t-[40px] shadow-[0_-15px_50px_rgba(0,0,0,0.06)] p-8 relative z-10 overflow-y-auto no-scrollbar border-t border-gray-50">
        <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-8"></div>

        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img src="https://picsum.photos/seed/pro/200/200" alt="Pro" className="w-16 h-16 rounded-2xl object-cover shadow-sm border border-gray-100" />
              <div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-4 border-white"></div>
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-gray-900">Rajesh Kumar</h2>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mt-1.5">
                <span className="flex items-center gap-1 text-amber-500"><Star size={14} fill="currentColor" /> 4.8</span>
                <span className="opacity-30">•</span>
                <span>Plumbing Expert</span>
              </div>
            </div>
          </div>
          <div className="bg-primary/5 p-4 rounded-2xl text-center min-w-[85px] border border-primary/10">
            <p className="text-2xl font-display font-bold text-primary leading-none">15</p>
            <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mt-1.5">Mins</p>
          </div>
        </div>

        <div className="flex gap-4 mb-10">
          <button className="flex-1 flex items-center justify-center gap-3 py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm shadow-lg shadow-gray-900/10 active:scale-[0.98] transition-all">
            <Phone size={18} strokeWidth={2.5} /> Call
          </button>
          <button className="flex-1 flex items-center justify-center gap-3 py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold text-sm shadow-sm active:scale-[0.98] transition-all hover:bg-gray-50">
            <MessageSquare size={18} strokeWidth={2.5} /> Message
          </button>
        </div>

        <div className="space-y-8">
          <h3 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
            <Clock size={20} className="text-primary" strokeWidth={2.5} /> Service Timeline
          </h3>
          
          <div className="relative pl-8 border-l-2 border-gray-50 space-y-10">
            <div className="relative">
              <div className="absolute -left-[41px] bg-green-500 w-5 h-5 rounded-full border-4 border-white shadow-sm"></div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Booking Confirmed</p>
                <p className="text-xs text-gray-400 font-bold mt-0.5">10:30 AM • Order #ORGO-8291</p>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -left-[41px] bg-green-500 w-5 h-5 rounded-full border-4 border-white shadow-sm"></div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Professional Assigned</p>
                <p className="text-xs text-gray-400 font-bold mt-0.5">10:35 AM • Rajesh Kumar</p>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -left-[41px] bg-primary w-5 h-5 rounded-full border-4 border-white shadow-lg shadow-primary/20"></div>
              <div className="absolute -left-[41px] bg-primary w-5 h-5 rounded-full border-4 border-white animate-ping opacity-30"></div>
              <div>
                <p className="font-bold text-primary text-sm">On the Way</p>
                <p className="text-xs text-primary/60 font-bold mt-0.5">Arriving in 15 mins</p>
              </div>
            </div>
            
            <div className="relative opacity-30">
              <div className="absolute -left-[41px] bg-gray-200 w-5 h-5 rounded-full border-4 border-white"></div>
              <div>
                <p className="font-bold text-gray-400 text-sm">Service Started</p>
                <p className="text-xs text-gray-300 font-bold mt-0.5">Expected at 11:00 AM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
