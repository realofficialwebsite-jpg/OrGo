import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, MapPin, Star, ChevronLeft, X, ReceiptText, Clock, CreditCard } from 'lucide-react';
import { Booking } from '../src/types';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../src/firebase';
import { LiveTracking } from './LiveTracking';
import { toast } from 'sonner';

interface UserBookingDetailsProps {
  orderId: string;
  onBack: () => void;
}

export const UserBookingDetails: React.FC<UserBookingDetailsProps> = ({ orderId, onBack }) => {
  const [order, setOrder] = useState<Booking | null>(null);
  const [workerData, setWorkerData] = useState<any>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    const unsub = onSnapshot(doc(db, 'order', orderId), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Booking;
        setOrder({ ...data, id: snap.id });
        
        if (data.assignedWorkerId) {
          onSnapshot(doc(db, 'users', data.assignedWorkerId), (workerSnap) => {
            if (workerSnap.exists()) setWorkerData(workerSnap.data());
          });
        }
      }
    });
    return () => unsub();
  }, [orderId]);

  if (!order) return null;

  const handleCancel = async () => {
    try {
      await updateDoc(doc(db, 'order', order.id), {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        cancelledBy: 'customer'
      });
      toast.success('Booking cancelled');
      setShowCancelModal(false);
      onBack();
    } catch (error) {
      toast.error('Failed to cancel');
    }
  };

  const isBilling = order.status === 'billing' || order.status === 'payment_pending';
  const showOtp = (order.status === 'assigned' || order.status === 'on_the_way') && !isBilling;

  return (
    <div className="h-screen w-full flex flex-col relative overflow-hidden font-sans">
      {/* 1. THE MAP (Takes up all background space) */}
      <div className="absolute inset-0 z-0">
        <LiveTracking order={order} userRole="customer" />
      </div>

      {/* Back Button */}
      <div className="absolute top-4 left-4 z-20">
        <button onClick={onBack} className="p-2 bg-white shadow-lg rounded-full text-slate-950">
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* 2. THE COMPACT BOTTOM PANEL */}
      <div className="absolute bottom-[70px] left-0 right-0 bg-white rounded-t-3xl p-5 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] z-40 flex flex-col gap-4">
        
        {/* ROW 1: Profile Container */}
        <div className="flex items-center gap-3">
          <img 
            src={order.workerPhoto || 'https://ui-avatars.com/api/?name=' + (order.workerName || 'Professional') + '&background=e2e8f0&color=0f172a'} 
            alt="Pro" 
            className="w-12 h-12 rounded-full object-cover border border-slate-100" 
            referrerPolicy="no-referrer" 
          />
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-950 leading-tight">{order.workerName || 'Professional'}</h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star size={14} className="text-amber-500 fill-amber-500" />
                <span className="text-sm font-bold text-slate-950">{workerData?.rating?.toFixed(1) || '4.8'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: The 3-Button Grid */}
        <div className="grid grid-cols-3 gap-2">
          <a href={`tel:+91${order.workerPhone}`} className="bg-slate-950 text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2">
            <Phone size={16} /> Call
          </a>
          <a href={`https://wa.me/91${order.workerPhone}`} target="_blank" rel="noopener noreferrer" className="bg-green-600 text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center">
            WhatsApp
          </a>
          <button onClick={() => setShowCancelModal(true)} className="bg-red-50 text-red-600 rounded-xl py-3 text-sm font-bold flex items-center justify-center">
            Cancel
          </button>
        </div>

        {/* ROW 3: The OTP & Bill Row */}
        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Start Code</span>
            <span className="text-xl font-black tracking-[0.3em] text-slate-950">{order.otp || order.startOtp || '----'}</span>
          </div>
          <button 
            onClick={() => setIsBillModalOpen(true)}
            className="bg-blue-50 text-blue-600 font-bold px-4 py-2 rounded-lg text-sm"
          >
            View Bill
          </button>
        </div>

        {isBilling && (
          <button className="w-full bg-slate-950 text-white py-4 rounded-xl font-bold text-sm shadow-lg shadow-slate-950/20 mt-1">
            Pay Securely
          </button>
        )}
      </div>

      {/* 3. BILL MODAL */}
      <AnimatePresence>
        {isBillModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-950/50 backdrop-blur-sm">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <button 
                onClick={() => setIsBillModalOpen(false)}
                className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500"
              >
                <X size={20} />
              </button>

              <h3 className="text-xl font-black text-slate-950 mb-6">Bill Summary</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600">Base Service</span>
                  <span className="text-sm font-bold text-slate-950">₹{order.basePrice || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600">Platform Fee</span>
                  <span className="text-sm font-bold text-slate-950">₹5</span>
                </div>

                {/* Filtered Addons */}
                {order.billingItems?.filter(item => item.name !== (order.cartItems?.[0]?.title)).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600">{item.name}</span>
                    <span className="text-sm font-bold text-slate-950">₹{item.price}</span>
                  </div>
                ))}

                <div className="h-px bg-gray-100 my-2" />
                
                <div className="flex justify-between items-center">
                  <span className="text-lg font-black text-slate-950">Grand Total</span>
                  <span className="text-2xl font-black text-red-600">₹{order.grandTotal || (Number(order.basePrice || 0) + 5)}</span>
                </div>
              </div>

              <button 
                onClick={() => setIsBillModalOpen(false)}
                className="w-full bg-slate-950 text-white py-4 rounded-xl font-bold text-sm"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-6 text-center w-full max-w-xs shadow-2xl"
            >
              <h3 className="text-lg font-bold text-slate-950 mb-2">Cancel Booking?</h3>
              <p className="text-sm text-slate-500 mb-6">Are you sure you want to cancel this service?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowCancelModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl text-sm font-bold text-slate-600">No, Keep</button>
                <button onClick={handleCancel} className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-bold">Yes, Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

};

