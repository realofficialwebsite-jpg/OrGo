import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Phone, MessageSquare, MapPin, CheckCircle, ChevronLeft, Star, Clock, Navigation } from 'lucide-react';
import { Booking } from '../src/types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../src/firebase';
import { LiveTracking } from './LiveTracking';

interface TrackingProps {
  order: Booking;
  userRole: 'customer' | 'professional';
  onBack?: () => void;
  onCompleteJob?: () => void;
}

export const Tracking: React.FC<TrackingProps> = ({ order, userRole, onBack, onCompleteJob }) => {
  const isWorker = userRole === 'professional';
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const handleRatingSubmit = async () => {
    if (rating === 0) return;
    try {
      await updateDoc(doc(db, 'order', order.id), { rating });
      setFeedbackSubmitted(true);
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

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
      {order.status === 'assigned' ? (
        <div className="h-[400px] w-full">
          <LiveTracking order={order} userRole={isWorker ? 'worker' : 'customer'} />
        </div>
      ) : (
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
               <div className="absolute -top-10 -left-8 bg-white px-3 py-1.5 rounded-xl shadow-xl text-[10px] font-bold whitespace-nowrap border border-gray-50 text-gray-900">
                 {isWorker ? 'Customer' : 'You are here'}
               </div>
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
               <div className="absolute -top-12 -left-10 bg-primary text-white px-3 py-1.5 rounded-xl shadow-xl text-[10px] font-bold whitespace-nowrap">
                 {isWorker ? 'You are here' : 'Professional'}
               </div>
             </div>
          </motion.div>
        </div>
      )}

      {/* Bottom Sheet */}
      <div className="flex-1 -mt-12 bg-white rounded-t-[40px] shadow-[0_-15px_50px_rgba(0,0,0,0.06)] p-8 relative z-10 overflow-y-auto no-scrollbar border-t border-gray-50">
        <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-8"></div>

        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img 
                src={isWorker ? "https://picsum.photos/seed/customer/200" : (order.workerPhoto || "https://picsum.photos/seed/pro/200")} 
                alt="Profile" 
                className="w-16 h-16 rounded-2xl object-cover shadow-sm border border-gray-100" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-4 border-white"></div>
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-gray-900">
                {isWorker ? 'Customer' : (order.workerName || 'Professional')}
              </h2>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mt-1.5">
                {isWorker ? (
                  <span>{order.address}</span>
                ) : (
                  <>
                    <span className="flex items-center gap-1 text-amber-500"><Star size={14} fill="currentColor" /> 4.8</span>
                    <span className="opacity-30">•</span>
                    <span>{order.cartItems[0]?.title || 'Service Expert'}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          {!isWorker && (
            <div className="bg-primary/5 p-4 rounded-2xl text-center min-w-[85px] border border-primary/10">
              <p className="text-2xl font-display font-bold text-primary leading-none">15</p>
              <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mt-1.5">Mins</p>
            </div>
          )}
        </div>

        <div className="flex gap-4 mb-10">
          <a href="tel:+1234567890" className="flex-1 flex items-center justify-center gap-3 py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm shadow-lg shadow-gray-900/10 active:scale-[0.98] transition-all">
            <Phone size={18} strokeWidth={2.5} /> Call
          </a>
          <a href="sms:+1234567890" className="flex-1 flex items-center justify-center gap-3 py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold text-sm shadow-sm active:scale-[0.98] transition-all hover:bg-gray-50">
            <MessageSquare size={18} strokeWidth={2.5} /> Message
          </a>
        </div>

        {isWorker && order.status === 'assigned' && (
          <div className="mb-10">
            <button 
              onClick={onCompleteJob}
              className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle size={20} /> Mark Job as Completed
            </button>
          </div>
        )}

        {order.status === 'completed' && !isWorker && !feedbackSubmitted && !order.rating && (
          <div className="mb-10 bg-gray-50 p-6 rounded-3xl border border-gray-100 text-center">
            <h3 className="font-display font-bold text-lg text-gray-900 mb-2">Rate your experience</h3>
            <p className="text-xs text-gray-500 mb-6">How was the service provided by {order.workerName || 'the professional'}?</p>
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map(star => (
                <button 
                  key={star} 
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className={`transition-colors ${(hoveredRating || rating) >= star ? 'text-amber-400' : 'text-gray-300'}`}
                >
                  <Star size={32} fill="currentColor" />
                </button>
              ))}
            </div>
            <button 
              onClick={handleRatingSubmit}
              disabled={rating === 0}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm shadow-lg shadow-gray-900/10 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              Submit Feedback
            </button>
          </div>
        )}
        
        {(feedbackSubmitted || order.rating) && !isWorker && (
          <div className="mb-10 bg-emerald-50 p-6 rounded-3xl border border-emerald-100 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={24} />
            </div>
            <h3 className="font-display font-bold text-lg text-gray-900 mb-1">Thank you!</h3>
            <p className="text-xs text-gray-500">Your feedback has been submitted.</p>
          </div>
        )}

        <div className="space-y-8">
          <h3 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
            <Clock size={20} className="text-primary" strokeWidth={2.5} /> Service Timeline
          </h3>
          
          <div className="relative pl-8 border-l-2 border-gray-50 space-y-10">
            <div className="relative">
              <div className="absolute -left-[41px] bg-green-500 w-5 h-5 rounded-full border-4 border-white shadow-sm"></div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Booking Confirmed</p>
                <p className="text-xs text-gray-400 font-bold mt-0.5">Order #{order.id.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute -left-[41px] bg-green-500 w-5 h-5 rounded-full border-4 border-white shadow-sm"></div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Professional Assigned</p>
                <p className="text-xs text-gray-400 font-bold mt-0.5">{order.workerName || 'Worker'}</p>
              </div>
            </div>
            
            <div className={`relative ${order.status === 'completed' ? '' : ''}`}>
              <div className={`absolute -left-[41px] ${order.status === 'completed' ? 'bg-green-500' : 'bg-primary'} w-5 h-5 rounded-full border-4 border-white shadow-lg ${order.status === 'completed' ? '' : 'shadow-primary/20'}`}></div>
              {order.status !== 'completed' && <div className="absolute -left-[41px] bg-primary w-5 h-5 rounded-full border-4 border-white animate-ping opacity-30"></div>}
              <div>
                <p className={`font-bold ${order.status === 'completed' ? 'text-gray-900' : 'text-primary'} text-sm`}>On the Way</p>
                <p className={`text-xs ${order.status === 'completed' ? 'text-gray-400' : 'text-primary/60'} font-bold mt-0.5`}>Arriving in 15 mins</p>
              </div>
            </div>
            
            <div className={`relative ${order.status === 'completed' ? '' : 'opacity-30'}`}>
              <div className={`absolute -left-[41px] ${order.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'} w-5 h-5 rounded-full border-4 border-white`}></div>
              <div>
                <p className={`font-bold ${order.status === 'completed' ? 'text-gray-900' : 'text-gray-400'} text-sm`}>Service Completed</p>
                <p className={`text-xs ${order.status === 'completed' ? 'text-gray-400' : 'text-gray-300'} font-bold mt-0.5`}>
                  {order.status === 'completed' ? 'Job done successfully' : 'Pending'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
