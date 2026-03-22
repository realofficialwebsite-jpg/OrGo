import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, User, CheckCircle, ArrowLeft, Star, MapPin } from 'lucide-react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../src/firebase';
import { Booking, InterestedWorker } from '../src/types';

interface CustomerRadarProps {
  orderId: string;
  onWorkerAssigned: (order: Booking) => void;
  onBackToHome?: () => void;
}

const CustomerRadar: React.FC<CustomerRadarProps> = ({ orderId, onWorkerAssigned, onBackToHome }) => {
  const [order, setOrder] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const onWorkerAssignedRef = React.useRef(onWorkerAssigned);

  useEffect(() => {
    onWorkerAssignedRef.current = onWorkerAssigned;
  }, [onWorkerAssigned]);

  useEffect(() => {
    if (!orderId) return;
    const orderRef = doc(db, 'order', orderId);
    const unsubscribe = onSnapshot(orderRef, (doc) => {
      if (doc.exists()) {
        const orderData = doc.data() as Booking;
        setOrder(orderData);
        setLoading(false);
        
        if (orderData.status === 'assigned' && !confirmed) {
          setConfirmed(true);
        }
      }
    });

    return () => unsubscribe();
  }, [orderId, confirmed]);

  const handleSelectWorker = async (worker: InterestedWorker) => {
    if (!orderId || assigning) return;
    setAssigning(true);
    try {
      const orderRef = doc(db, 'order', orderId);
      await updateDoc(orderRef, {
        status: 'assigned',
        assignedWorkerId: worker.workerId,
        workerName: worker.name,
        workerPhoto: worker.photo,
        workerPhone: worker.phone || ''
      });
      setConfirmed(true);
    } catch (error) {
      console.error('Error assigning worker:', error);
      alert('Failed to assign professional. Please try again.');
      setAssigning(false);
    }
  };

  if (loading || !order) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 size={48} className="animate-spin text-primary mb-4" />
        <p className="text-sm font-bold text-gray-900">Connecting to server...</p>
      </div>
    );
  }

  if (confirmed) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-full p-6 text-center"
      >
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle size={48} className="text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
        <p className="text-gray-500 mb-8">Your professional has been assigned and is getting ready.</p>
        <button 
          onClick={() => onWorkerAssignedRef.current(order)}
          className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
        >
          <MapPin size={20} />
          View Order / Track
        </button>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
      {onBackToHome && (
        <div className="absolute top-4 left-4 z-10">
          <button 
            onClick={onBackToHome}
            className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-sm text-sm font-bold text-gray-700 hover:bg-white transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Home
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="flex flex-col items-center justify-center p-8 pt-20">
          <div className="relative w-48 h-48 flex items-center justify-center mb-8">
            {/* Pulsating Radar Rings */}
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border-2 border-primary/30"
                initial={{ width: 0, height: 0, opacity: 1 }}
                animate={{ 
                  width: '100%', 
                  height: '100%', 
                  opacity: 0 
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.6,
                  ease: "easeOut"
                }}
              />
            ))}
            
            {/* Center Icon */}
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/40 z-10">
              <Loader2 size={32} className="text-white animate-spin" />
            </div>
          </div>

          <div className="text-center space-y-2 mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {order.interestedWorkers?.length > 0 ? 'Professionals Found!' : 'Searching...'}
            </h2>
            <p className="text-gray-500">
              {order.interestedWorkers?.length > 0 
                ? 'Select a professional from the list below.' 
                : 'Please wait while we find the best match for your request.'}
            </p>
          </div>
        </div>

        <AnimatePresence>
          {order.interestedWorkers?.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 space-y-4"
            >
              <h3 className="font-bold text-gray-900 px-2">Interested Professionals</h3>
              {order.interestedWorkers.map((worker) => (
                <motion.div 
                  key={worker.workerId}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4"
                >
                  <div className="flex items-center gap-4">
                    <img src={worker.photo || 'https://via.placeholder.com/150'} alt={worker.name} className="w-16 h-16 rounded-full object-cover border-2 border-gray-50" />
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-lg">{worker.name}</h4>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1"><Star size={14} className="text-yellow-400 fill-yellow-400" /> {worker.rating ? worker.rating.toFixed(1) : 'New'} {worker.totalReviews ? `(${worker.totalReviews})` : ''}</span>
                        <span className="text-gray-300">•</span>
                        <span>{worker.experience} exp</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleSelectWorker(worker)}
                    disabled={assigning}
                    className="w-full bg-primary/10 text-primary py-3 rounded-xl font-bold hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
                  >
                    {assigning ? 'Assigning...' : 'Go with this Professional'}
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CustomerRadar;
