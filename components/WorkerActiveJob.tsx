import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, MapPin, ChevronLeft, X, Plus, Trash2, Navigation, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Booking } from '../src/types';
import { doc, onSnapshot, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../src/firebase';
import { LiveTracking } from './LiveTracking';
import { toast } from 'sonner';

interface WorkerActiveJobProps {
  orderId: string;
  onBack: () => void;
  onCompleteJob: () => void;
}

interface BillingItem {
  name: string;
  price: number;
}

export const WorkerActiveJob: React.FC<WorkerActiveJobProps> = ({ orderId, onBack, onCompleteJob }) => {
  const [order, setOrder] = useState<Booking | null>(null);
  const [customerData, setCustomerData] = useState<any>(null);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [completionMode, setCompletionMode] = useState<'standard' | 'inspection'>('standard');
  
  const [billingItems, setBillingItems] = useState<BillingItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  
  const [otp, setOtp] = useState(['', '', '', '']);
  const [otpError, setOtpError] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const otpInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  useEffect(() => {
    if (!orderId) return;
    const unsub = onSnapshot(doc(db, 'order', orderId), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Booking;
        setOrder({ ...data, id: snap.id });
        
        if (data.userId) {
          onSnapshot(doc(db, 'users', data.userId), (custSnap) => {
            if (custSnap.exists()) setCustomerData(custSnap.data());
          });
        }

        if (data.billingItems) {
          setBillingItems(data.billingItems);
        } else if (data.cartItems) {
          setBillingItems(data.cartItems.map(item => ({ name: item.title, price: item.price * item.quantity })));
        }
      }
    });
    return () => unsub();
  }, [orderId]);

  if (!order) return null;

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1];
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      otpInputRefs[index + 1].current?.focus();
    }

    const fullOtp = newOtp.join('');
    if (fullOtp.length === 4) {
      const enteredStr = newOtp.join('').trim();
      const expectedStr = String(order.otp || order.startOtp || '').trim();
      
      console.log('Entered:', enteredStr, 'Expected:', expectedStr);

      if (enteredStr === expectedStr && expectedStr !== '') {
        setOtpVerified(true);
        setOtpError(false);
        toast.success('OTP Verified!');
      } else {
        setOtpError(true);
        setOtpVerified(false);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs[index - 1].current?.focus();
    }
  };

  const handleCancel = async () => {
    try {
      await updateDoc(doc(db, 'order', order.id), {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        cancelledBy: 'worker'
      });
      toast.success('Job cancelled');
      onBack();
    } catch (error) {
      toast.error('Failed to cancel');
    }
  };

  const addBillingItem = () => {
    if (!newItemName || !newItemPrice) return toast.error('Enter name and price');
    const price = parseFloat(newItemPrice);
    if (isNaN(price)) return toast.error('Invalid price');
    
    const updatedItems = [...billingItems, { name: newItemName, price }];
    setBillingItems(updatedItems);
    setNewItemName('');
    setNewItemPrice('');
  };

  const removeBillingItem = (index: number) => {
    const updatedItems = billingItems.filter((_, i) => i !== index);
    setBillingItems(updatedItems);
  };

  const calculateTotal = () => billingItems.reduce((acc, item) => acc + item.price, 0);

  const handleSubmitBill = async () => {
    try {
      const total = calculateTotal();
      await updateDoc(doc(db, 'order', order.id), {
        billingItems,
        grandTotal: total
      });
      setShowBillingModal(false);
      toast.success('Bill updated');
    } catch (error) {
      toast.error('Failed to update bill');
    }
  };

  const handleFinalCompletion = async () => {
    if (!otpVerified) return;
    
    try {
      let duesToAdd = 0;
      let finalBillAmount = 0;

      if (completionMode === 'inspection') {
        finalBillAmount = 54; // 49 Visiting + 5 Platform
        duesToAdd = 5; // Platform fee only
        
        await updateDoc(doc(db, 'order', order.id), {
          status: 'completed',
          completedAt: serverTimestamp(),
          grandTotal: finalBillAmount,
          jobType: 'inspection',
          completionMode
        });
      } else {
        // Service Completed
        const basePrice = order.basePrice || 0;
        const platformFee = 5;
        const addonsTotal = billingItems.reduce((sum, item) => sum + item.price, 0) - (order.cartItems?.reduce((acc, item) => acc + item.price * item.quantity, 0) || 0);
        
        finalBillAmount = Number(basePrice) + platformFee + Number(addonsTotal > 0 ? addonsTotal : 0);
        duesToAdd = Math.round((basePrice * 0.10) + platformFee);

        await updateDoc(doc(db, 'order', order.id), {
          status: 'completed',
          completedAt: serverTimestamp(),
          grandTotal: finalBillAmount,
          completionMode
        });
      }

      if (order.assignedWorkerId) {
        await updateDoc(doc(db, 'users', order.assignedWorkerId), {
          platformDues: increment(duesToAdd)
        });
      }

      toast.success('Job Completed Successfully!');
      onCompleteJob();
    } catch (error) {
      console.error('Error completing job:', error);
      toast.error('Failed to complete job');
    }
  };

  return (
    <div className="h-screen w-full flex flex-col relative overflow-hidden bg-gray-100 font-sans">
      {/* 1. THE MAP (z-0) */}
      <div className="absolute inset-0 z-0">
        <LiveTracking order={order} userRole="worker" />
      </div>

      {/* Back Button */}
      <div className="absolute top-4 left-4 z-20">
        <button onClick={onBack} className="p-2 bg-white shadow-lg rounded-full text-slate-950">
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* 2. FLOATING NAV BUTTON (Moved way up) */}
      <div className="absolute bottom-[260px] right-4 z-20">
        <a 
          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.address || 'User Address')}`} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="bg-blue-600 text-white w-12 h-12 rounded-full flex flex-col items-center justify-center shadow-lg text-[10px] font-bold"
        >
          <Navigation size={16} />
          Nav
        </a>
      </div>

      {/* 3. THE COMPACT BOTTOM PANEL (State 1) */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-4 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] flex flex-col gap-3">
        
        {/* Profile Snippet */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-slate-100">
            <img 
              src={order.userPhotoUrl || 'https://ui-avatars.com/api/?name=' + (order.customerName || 'User') + '&background=e2e8f0&color=0f172a'} 
              alt="User" 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer" 
            />
          </div>
          <div className="flex-1 overflow-hidden">
            <h3 className="font-bold text-slate-950 text-sm leading-tight">{order.customerName || 'User Name'}</h3>
            <p className="text-[10px] text-gray-500 truncate">{order.address || 'User Address'}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-black text-slate-950">₹{calculateTotal()}</p>
            <button 
              onClick={() => setShowBillingModal(true)}
              className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded mt-0.5"
            >
              Edit Bill
            </button>
          </div>
        </div>

        {/* 3-Button Grid */}
        <div className="grid grid-cols-3 gap-2">
          <a href={`tel:+91${order.customerPhone}`} className="bg-slate-950 text-white rounded-xl py-2 text-xs font-bold flex items-center justify-center gap-1">
            <Phone size={12} /> Call
          </a>
          <a href={`https://wa.me/91${order.customerPhone}`} target="_blank" rel="noopener noreferrer" className="bg-green-600 text-white rounded-xl py-2 text-xs font-bold flex items-center justify-center">
            WhatsApp
          </a>
          <button onClick={() => setShowCancelModal(true)} className="bg-red-50 text-red-600 rounded-xl py-2 text-xs font-bold">
            Cancel
          </button>
        </div>

        {/* Two Stacked Buttons */}
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => {
              setCompletionMode('standard');
              setShowCompletionModal(true);
            }}
            className="w-full bg-slate-950 text-white py-4 rounded-xl font-black text-sm shadow-xl shadow-slate-950/20 uppercase tracking-widest"
          >
            Service Completed
          </button>
          <button 
            onClick={() => {
              setCompletionMode('inspection');
              setShowCompletionModal(true);
            }}
            className="w-full bg-white text-red-600 border-2 border-red-600 py-3 rounded-xl font-bold text-xs uppercase tracking-widest"
          >
            Customer Refused / Inspection Only
          </button>
        </div>
      </div>

      {/* 4. BILLING MODAL */}
      <AnimatePresence>
        {showBillingModal && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed inset-0 z-[60] bg-white flex flex-col p-6"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-950">Edit Bill</h3>
              <button onClick={() => setShowBillingModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-500">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-3 mb-8">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Add Parts/Addons</p>
              <input 
                type="text" 
                placeholder="Item Name" 
                value={newItemName} 
                onChange={(e) => setNewItemName(e.target.value)} 
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-950 focus:border-slate-950 outline-none" 
              />
              <div className="flex gap-2">
                <input 
                  type="number" 
                  placeholder="Price (₹)" 
                  value={newItemPrice} 
                  onChange={(e) => setNewItemPrice(e.target.value)} 
                  className="flex-1 p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-950 focus:border-slate-950 outline-none" 
                />
                <button onClick={addBillingItem} className="bg-slate-950 text-white px-8 rounded-xl text-sm font-bold">Add</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {billingItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-sm font-bold text-slate-700">{item.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-black text-slate-950">₹{item.price}</span>
                    <button onClick={() => removeBillingItem(idx)} className="text-red-500"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-6 mt-4">
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-bold text-slate-500">Total Bill</span>
                <span className="text-3xl font-black text-slate-950">₹{calculateTotal()}</span>
              </div>
              <button 
                onClick={handleSubmitBill} 
                className="w-full bg-slate-950 text-white py-5 rounded-2xl font-black text-base"
              >
                Update Bill
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. COMPLETION MODAL (State 2) */}
      <AnimatePresence>
        {showCompletionModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-white flex flex-col"
          >
            <div className="p-6 flex justify-between items-center border-b border-gray-100">
              <h3 className="text-lg font-black text-slate-950">Job Completion</h3>
              <button onClick={() => setShowCompletionModal(false)} className="p-2 bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={40} className="text-emerald-600" />
              </div>
              
              <h2 className="text-4xl font-black text-slate-950 mb-2">Collect Cash</h2>
              <p className="text-slate-500 font-medium mb-8 uppercase tracking-widest text-xs">Payment Breakdown</p>

              <div className="w-full bg-gray-50 rounded-3xl p-6 space-y-4 mb-8">
                {completionMode === 'standard' ? (
                  <>
                    <div className="flex justify-between text-sm font-bold text-slate-600">
                      <span>Base Fee</span>
                      <span>₹{order.basePrice || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-slate-600">
                      <span>Platform Fee</span>
                      <span>₹{order.platformFee || 5}</span>
                    </div>
                    {billingItems.length > (order.cartItems?.length || 0) && (
                      <div className="flex justify-between text-sm font-bold text-slate-600">
                        <span>Addons/Parts</span>
                        <span>₹{calculateTotal() - (order.basePrice || 0)}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-sm font-bold text-slate-600">
                      <span>Visiting Charge</span>
                      <span>₹49</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-slate-600">
                      <span>Platform Fee</span>
                      <span>₹5</span>
                    </div>
                  </>
                )}
                <div className="h-px bg-gray-200 my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-black text-slate-950">Grand Total</span>
                  <span className="text-4xl font-black text-red-600">
                    ₹{completionMode === 'standard' ? calculateTotal() + 5 : 54}
                  </span>
                </div>
              </div>

              <div className="w-full space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enter Customer OTP</p>
                <div className="flex justify-center gap-3">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={otpInputRefs[idx]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className={`w-14 h-14 text-center text-2xl font-black border-2 rounded-2xl outline-none transition-all ${
                        otpVerified ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 
                        otpError ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-200 focus:border-slate-950'
                      }`}
                    />
                  ))}
                </div>
                {otpError && <p className="text-red-600 text-xs font-bold">Invalid OTP. Please check with customer.</p>}
                {otpVerified && <p className="text-emerald-600 text-xs font-bold">OTP Verified! You can now end the job.</p>}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100">
              <button 
                onClick={handleFinalCompletion}
                disabled={!otpVerified}
                className={`w-full py-5 rounded-2xl font-black text-base uppercase tracking-widest transition-all ${
                  otpVerified ? 'bg-slate-950 text-white shadow-2xl shadow-slate-950/30' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                End Job & Confirm Payment
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Confirmation */}
      <AnimatePresence>
        {showCancelModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-6 text-center w-full max-w-xs shadow-2xl"
            >
              <AlertCircle size={40} className="text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-950 mb-2">Cancel Job?</h3>
              <p className="text-sm text-slate-500 mb-6">Are you sure you want to cancel this job?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowCancelModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl text-sm font-bold text-slate-600">No, Back</button>
                <button onClick={handleCancel} className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-bold">Yes, Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
