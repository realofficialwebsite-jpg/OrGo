import React from 'react';
import { motion } from 'motion/react';
import { Phone, MessageSquare, MapPin, CheckCircle, ChevronLeft, Star, Clock } from 'lucide-react';

export const Tracking: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-white max-w-md mx-auto relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-6 left-6 z-20">
        <button className="p-3 bg-white shadow-xl rounded-2xl text-slate-600 active:scale-95 transition-all">
          <ChevronLeft size={24} />
        </button>
      </div>

      {/* Map Section */}
      <div className="h-[50vh] bg-slate-100 relative w-full overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/OpenStreetMap_Transportation_Map.png')] bg-cover opacity-60 grayscale-[0.5] contrast-[1.1]"></div>
        
        {/* Animated Route Line (Visual only) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <motion.path
            d="M 150 150 L 250 300"
            stroke="#dc2626"
            strokeWidth="4"
            strokeDasharray="8 8"
            fill="transparent"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </svg>

        {/* User Pin */}
        <div className="absolute top-[300px] left-[250px] transform -translate-x-1/2 -translate-y-1/2">
           <div className="relative">
             <div className="w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-2xl"></div>
             <div className="absolute -top-10 -left-6 bg-white px-3 py-1 rounded-xl shadow-xl text-[10px] font-bold whitespace-nowrap border border-slate-50">You are here</div>
             <div className="absolute inset-0 bg-blue-400/30 rounded-full animate-ping"></div>
           </div>
        </div>

        {/* Pro Pin */}
        <motion.div 
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute top-[150px] left-[150px]"
        >
           <div className="relative">
             <MapPin className="text-primary" size={48} fill="currentColor" />
             <div className="absolute -top-12 -left-10 bg-primary text-white px-3 py-1 rounded-xl shadow-xl text-[10px] font-bold whitespace-nowrap">Professional</div>
           </div>
        </motion.div>
      </div>

      {/* Bottom Sheet */}
      <div className="flex-1 -mt-12 bg-white rounded-t-[3rem] shadow-[0_-20px_40px_rgba(0,0,0,0.05)] p-8 relative z-10 overflow-y-auto no-scrollbar">
        <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8"></div>

        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img src="https://picsum.photos/200/200?random=1" alt="Pro" className="w-16 h-16 rounded-2xl object-cover" />
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-slate-800">Rajesh Kumar</h2>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mt-1">
                <span className="flex items-center gap-1 text-amber-500"><Star size={14} fill="currentColor" /> 4.8</span>
                <span>•</span>
                <span>Plumbing Expert</span>
              </div>
            </div>
          </div>
          <div className="bg-primary/5 p-4 rounded-2xl text-center min-w-[80px]">
            <p className="text-2xl font-display font-bold text-primary leading-none">15</p>
            <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mt-1">Mins</p>
          </div>
        </div>

        <div className="flex gap-4 mb-10">
          <button className="flex-1 flex items-center justify-center gap-3 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-lg shadow-slate-200 active:scale-95 transition-all">
            <Phone size={18} /> Call
          </button>
          <button className="flex-1 flex items-center justify-center gap-3 py-4 bg-white border border-slate-100 text-slate-600 rounded-2xl font-bold text-sm shadow-sm active:scale-95 transition-all">
            <MessageSquare size={18} /> Message
          </button>
        </div>

        <div className="space-y-8">
          <h3 className="font-display font-bold text-lg text-slate-800 flex items-center gap-2">
            <Clock size={20} className="text-primary" /> Service Timeline
          </h3>
          
          <div className="relative pl-8 border-l-2 border-slate-50 space-y-10">
            <div className="relative">
              <div className="absolute -left-[41px] bg-emerald-500 w-5 h-5 rounded-full border-4 border-white shadow-md"></div>
              <div>
                <p className="font-bold text-slate-800 text-sm">Booking Confirmed</p>
                <p className="text-xs text-slate-400 font-medium">10:30 AM • Order #ORGO-8291</p>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -left-[41px] bg-emerald-500 w-5 h-5 rounded-full border-4 border-white shadow-md"></div>
              <div>
                <p className="font-bold text-slate-800 text-sm">Professional Assigned</p>
                <p className="text-xs text-slate-400 font-medium">10:35 AM • Rajesh Kumar</p>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -left-[41px] bg-primary w-5 h-5 rounded-full border-4 border-white shadow-lg shadow-red-100"></div>
              <div className="absolute -left-[41px] bg-primary w-5 h-5 rounded-full border-4 border-white animate-ping opacity-30"></div>
              <div>
                <p className="font-bold text-primary text-sm">On the Way</p>
                <p className="text-xs text-primary/60 font-bold">Arriving in 15 mins</p>
              </div>
            </div>
            
            <div className="relative opacity-30">
              <div className="absolute -left-[41px] bg-slate-200 w-5 h-5 rounded-full border-4 border-white"></div>
              <div>
                <p className="font-bold text-slate-400 text-sm">Service Started</p>
                <p className="text-xs text-slate-300 font-medium">Expected at 11:00 AM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
