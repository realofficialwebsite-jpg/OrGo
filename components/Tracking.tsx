import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Phone, MessageSquare, MapPin, CheckCircle, ChevronLeft, Star, Clock, Navigation, XCircle } from 'lucide-react';
import { Booking } from '../src/types';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
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
  const [reviewText, setReviewText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [workerData, setWorkerData] = useState<any>(null);
  const [customerData, setCustomerData] = useState<any>(null);

  React.useEffect(() => {
    if (!order) return;
    if (order.assignedWorkerId) {
      getDoc(doc(db, 'users', order.assignedWorkerId)).then(snap => {
        if (snap.exists()) setWorkerData(snap.data());
      });
    }
    if (order.userId) {
      getDoc(doc(db, 'users', order.userId)).then(snap => {
        if (snap.exists()) setCustomerData(snap.data());
      });
    }
  }, [order?.assignedWorkerId, order?.userId]);

  if (!order) return (
    <div className="flex flex-col items-center justify-center h-screen p-6 text-center">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <MapPin size={32} className="text-gray-300" />
      </div>
      <h2 className="text-xl font-bold text-gray-900">No active booking</h2>
      <p className="text-gray-500 mt-2">Book a service to see it here!</p>
      {onBack && (
        <button onClick={onBack} className="mt-6 text-primary font-bold">Back to Home</button>
      )}
    </div>
  );

  const handleRatingSubmit = async () => {
    if (rating === 0 || !order?.id || !order.assignedWorkerId) return;
    setSubmitting(true);
    try {
      const orderRef = doc(db, 'order', order.id);
      await updateDoc(orderRef, { 
        rating, 
        reviewText,
        isRated: true 
      });

      const workerRef = doc(db, 'users', order.assignedWorkerId);
      const workerSnap = await getDoc(workerRef);
      
      if (workerSnap.exists()) {
        const workerData = workerSnap.data();
        const oldAvg = workerData.rating || 0;
        const oldTotal = workerData.totalReviews || 0;
        const newAvg = ((oldAvg * oldTotal) + rating) / (oldTotal + 1);
        
        await updateDoc(workerRef, {
          rating: newAvg,
          totalReviews: oldTotal + 1
        });
      }

      setFeedbackSubmitted(true);
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!order?.id) return;
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    
    setCancelling(true);
    try {
      await updateDoc(doc(db, 'order', order.id), { status: 'cancelled' });
      if (onBack) onBack();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking.');
    } finally {
      setCancelling(false);
    }
  };

  const targetPhone = isWorker ? order.customerPhone : order.workerPhone;
  const msg = isWorker ? "Hello, I'm on my way for your service." : "Hello, I'm waiting for my service.";

  const handleWhatsApp = () => {
    if (!targetPhone) return alert('Phone number not available');
    const cleanPhone = targetPhone.replace(/\D/g, '');
    window.open('https://wa.me/91' + cleanPhone + '?text=' + encodeURIComponent(msg), '_blank');
  };

  const isOngoing = order.status === 'assigned' || order.status === 'on_the_way';

  return (
    <div className="flex flex-col h-screen bg-white max-w-2xl mx-auto relative overflow-hidden font-sans">
      {/* Header */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
        <button 
          onClick={onBack}
          className="p-3 bg-white shadow-lg rounded-2xl text-gray-700 active:scale-95 transition-all border border-gray-100"
        >
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>
      </div>

      {/* Map Section */}
      {isOngoing ? (
        <div className="h-[400px] w-full">
          <LiveTracking order={order} userRole={isWorker ? 'worker' : 'customer'} />
        </div>
      ) : (
        <div className="h-[40vh] bg-slate-50 relative w-full flex items-center justify-center">
          <div className="text-center p-10">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={32} className="text-gray-300" />
            </div>
            <h3 className="font-bold text-gray-900">
              {order.status === 'completed' ? 'Service Completed' : 
               order.status === 'cancelled' ? 'Service Cancelled' : 'Order Status: ' + order.status}
            </h3>
          </div>
        </div>
      )}

      {/* Bottom Sheet */}
      <div className="flex-1 -mt-12 bg-white rounded-t-[40px] shadow-[0_-15px_50px_rgba(0,0,0,0.06)] p-8 relative z-10 overflow-y-auto no-scrollbar border-t border-gray-50">
        <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-8"></div>

        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img 
                src={isWorker ? (customerData?.photo || "https://picsum.photos/seed/customer/200") : (workerData?.photo || "https://picsum.photos/seed/pro/200")} 
                alt="Profile" 
                className="w-16 h-16 rounded-2xl object-cover shadow-sm border border-gray-100" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-4 border-white"></div>
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-gray-900">
                {isWorker ? (customerData?.name || 'Customer') : (workerData?.name || 'Professional')}
              </h2>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mt-1.5">
                {isWorker ? (
                  <span className="truncate max-w-[180px]">{order.address}</span>
                ) : (
                  <>
                    <span className="flex items-center gap-1 text-amber-500">
                      <Star size={14} fill="currentColor" /> {workerData?.rating?.toFixed(1) || '4.8'}
                    </span>
                    <span className="opacity-30">•</span>
                    <span>{order?.cartItems?.[0]?.title || 'Service Expert'}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {isOngoing && (
          <div className="flex gap-4 mb-10">
            <a href={`tel:+91${targetPhone}`} className="flex-1 flex items-center justify-center gap-3 py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm shadow-lg active:scale-[0.98] transition-all">
              <Phone size={18} strokeWidth={2.5} /> Call
            </a>
            <button 
              onClick={handleWhatsApp}
              className="flex-1 flex items-center justify-center gap-3 py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold text-sm shadow-sm active:scale-[0.98] transition-all hover:bg-gray-50"
            >
              <MessageSquare size={18} strokeWidth={2.5} /> WhatsApp
            </button>
          </div>
        )}

        <div className="flex gap-4 mb-10">
          {isWorker && isOngoing && (
            <button 
              onClick={onCompleteJob}
              className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle size={20} /> Complete Job
            </button>
          )}
          {isOngoing && (
            <button 
              onClick={handleCancelBooking}
              disabled={cancelling}
              className={`flex-1 py-4 ${isWorker ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-red-600 text-white'} rounded-2xl font-bold text-sm shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2`}
            >
              <XCircle size={20} /> {cancelling ? 'Cancelling...' : 'Cancel Booking'}
            </button>
          )}
        </div>

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
            {rating > 0 && (
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Leave a review (optional)"
                className="w-full p-4 mb-6 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none h-24"
              />
            )}
            <button 
              onClick={handleRatingSubmit}
              disabled={rating === 0 || submitting}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
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
                <p className="text-xs text-gray-400 font-bold mt-0.5">Order #{order?.id?.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>
            
            <div className="relative">
              <div className={`absolute -left-[41px] ${order.status !== 'searching' && order.status !== 'cancelled' ? 'bg-green-500' : 'bg-gray-200'} w-5 h-5 rounded-full border-4 border-white shadow-sm`}></div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Professional Assigned</p>
                <p className="text-xs text-gray-400 font-bold mt-0.5">{order.workerName || 'Waiting for selection...'}</p>
              </div>
            </div>
            
            <div className="relative">
              <div className={`absolute -left-[41px] ${order.status === 'on_the_way' || order.status === 'completed' ? 'bg-green-500' : (order.status === 'assigned' ? 'bg-primary animate-pulse' : 'bg-gray-200')} w-5 h-5 rounded-full border-4 border-white shadow-lg`}></div>
              <div>
                <p className={`font-bold ${order.status === 'on_the_way' ? 'text-primary' : 'text-gray-900'} text-sm`}>On the Way</p>
                <p className="text-xs text-gray-400 font-bold mt-0.5">{order.status === 'on_the_way' ? 'Arriving soon' : 'Pending'}</p>
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
