import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Loader2, User, CheckCircle } from 'lucide-react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../src/firebase';
import { Booking, InterestedWorker } from '../src/types';

interface CustomerRadarProps {
  orderId: string;
  onWorkerSelected: (workerId: string) => void;
}

const CustomerRadar: React.FC<CustomerRadarProps> = ({ orderId, onWorkerSelected }) => {
  const [order, setOrder] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const orderRef = doc(db, 'order', orderId);
    const unsubscribe = onSnapshot(orderRef, (doc) => {
      if (doc.exists()) {
        setOrder(doc.data() as Booking);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [orderId]);

  const handleConfirmWorker = async (workerId: string) => {
    await updateDoc(doc(db, 'order', orderId), {
      status: 'assigned',
      assignedWorkerId: workerId
    });
    onWorkerSelected(workerId);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 size={48} className="animate-spin text-primary mb-4" />
        <p className="text-sm font-bold text-gray-900">Broadcasting to nearby professionals...</p>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Nearby Professionals</h2>
      {order?.interestedWorkers && order.interestedWorkers.length > 0 ? (
        <div className="space-y-4">
          {order.interestedWorkers.map((worker: InterestedWorker) => (
            <div key={worker.workerId} className="p-4 bg-white rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <img src={worker.photo} alt={worker.name} className="w-12 h-12 rounded-full" />
                <div>
                  <h4 className="font-bold text-gray-900">{worker.name}</h4>
                  <p className="text-xs text-gray-500">{worker.experience} years exp.</p>
                </div>
              </div>
              <button 
                onClick={() => handleConfirmWorker(worker.workerId)}
                className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl"
              >
                Confirm
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-sm text-gray-500">Waiting for professionals to bid...</p>
        </div>
      )}
    </div>
  );
};

export default CustomerRadar;
