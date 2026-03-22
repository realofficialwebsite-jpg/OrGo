import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Loader2, User, CheckCircle } from 'lucide-react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../src/firebase';
import { Booking, InterestedWorker } from '../src/types';

interface CustomerRadarProps {
  orderId: string;
  onWorkerAssigned: (order: Booking) => void;
}

const CustomerRadar: React.FC<CustomerRadarProps> = ({ orderId, onWorkerAssigned }) => {
  const [order, setOrder] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const onWorkerAssignedRef = React.useRef(onWorkerAssigned);

  useEffect(() => {
    onWorkerAssignedRef.current = onWorkerAssigned;
  }, [onWorkerAssigned]);

  useEffect(() => {
    const orderRef = doc(db, 'order', orderId);
    const unsubscribe = onSnapshot(orderRef, (doc) => {
      if (doc.exists()) {
        const orderData = doc.data() as Booking;
        setOrder(orderData);
        setLoading(false);
        
        if (orderData.status === 'assigned') {
          onWorkerAssignedRef.current(orderData);
        }
      }
    });

    return () => unsubscribe();
  }, [orderId]);

  // handleConfirmWorker is removed because workers accept jobs themselves

  if (loading || !order) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 size={48} className="animate-spin text-primary mb-4" />
        <p className="text-sm font-bold text-gray-900">Connecting to server...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-5 space-y-8">
      <div className="relative w-64 h-64 flex items-center justify-center">
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

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Searching for nearby professionals...</h2>
        <p className="text-gray-500">Please wait while we find the best match for your request.</p>
      </div>
    </div>
  );
};

export default CustomerRadar;
