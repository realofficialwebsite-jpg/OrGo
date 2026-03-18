import React, { useState } from 'react';
import { Service, Professional } from '../src/types';
import { MapPin, ChevronRight, Check, Star, Ticket, Loader2 } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../src/firebase';
import { handleFirestoreError, OperationType } from '../utils/firestore-errors';

interface BookingWizardProps {
  service: Service;
  onClose: () => void;
  onComplete: (bookingDetails: any) => void;
}

const PROFESSIONALS: Professional[] = [
  { id: '1', name: 'Rajesh Kumar', rating: 4.8, jobs: 120, distance: '2.5 km', eta: '15 mins', image: 'https://picsum.photos/100/100?random=1' },
  { id: '2', name: 'Amit Singh', rating: 4.6, jobs: 85, distance: '3.1 km', eta: '20 mins', image: 'https://picsum.photos/100/100?random=2' },
  { id: '3', name: 'Sunita Verma', rating: 4.9, jobs: 200, distance: '1.2 km', eta: '10 mins', image: 'https://picsum.photos/100/100?random=3' },
];

export const BookingWizard: React.FC<BookingWizardProps> = ({ service, onClose, onComplete }) => {
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState('');
  const [date, setDate] = useState<string>('');
  const [timeSlot, setTimeSlot] = useState<string>('');
  const [problem, setProblem] = useState('');
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string>('');

  const applyPromo = () => {
    if (promoCode.toUpperCase() === 'ORGO50') setDiscount(0.5);
    else if (promoCode.toUpperCase() === 'PLUMB100') setDiscount(0.2);
    else alert('Invalid Code');
  };

  const fees = {
    service: service.priceStart,
    travel: 50,
    gst: service.priceStart * 0.18,
  };
  
  const total = (fees.service + fees.travel + fees.gst) * (1 - discount);

  const handleConfirmBooking = async () => {
    if (!auth.currentUser) return;
    setIsSubmitting(true);
    
    try {
      const bookingData = {
        userId: auth.currentUser.uid,
        serviceName: service.name,
        serviceId: service.id,
        professionalName: selectedPro?.name || 'Assigned Professional',
        professionalId: selectedPro?.id || null,
        date,
        time: timeSlot,
        address,
        problem,
        price: Math.round(total),
        status: 'Active',
        createdAt: new Date().toISOString()
      };

      // Add to 'order' collection as requested
      const docRef = await addDoc(collection(db, 'order'), bookingData);
      setOrderId(docRef.id);
      setStep(5);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800">Where is the service needed?</h3>
      <div className="space-y-4">
        <button 
          onClick={() => setAddress('Poornima University, Plot No 2027-2031, Ramchandrapura, P.O. Vidhani Vatika, Sitapura Extension, Jaipur, Rajasthan, 303905')}
          className="w-full flex items-center gap-3 p-4 border border-red-100 bg-red-50 text-red-700 rounded-lg font-medium"
        >
          <MapPin size={20} /> Use Current Location
        </button>
        <div>
            <label className="block text-sm text-gray-600 mb-1">House/Flat No, Landmark</label>
            <textarea 
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter full address in Jaipur..."
            className="w-full p-3 border rounded-lg h-24 focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800">When should we come?</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Describe the problem</label>
        <textarea 
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          placeholder="e.g. Tap leaking continuously..."
          className="w-full p-3 border rounded-lg h-20 focus:ring-red-500 mb-4"
        />
      </div>
      
      <div className="grid grid-cols-3 gap-2 mb-4">
        {['Today', 'Tomorrow', 'Day After'].map((d) => (
          <button 
            key={d}
            onClick={() => setDate(d)}
            className={`p-2 rounded-lg text-sm font-medium border ${date === d ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700'}`}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {['Morning (8-11)', 'Afternoon (12-4)', 'Evening (4-8)', 'Night (8-10)'].map((t) => (
          <button 
            key={t}
            onClick={() => setTimeSlot(t)}
            className={`p-3 rounded-lg text-sm font-medium border ${timeSlot === t ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700'}`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-800">Select a Professional</h3>
      <div className="space-y-3">
        {PROFESSIONALS.map((pro) => (
          <div 
            key={pro.id}
            onClick={() => setSelectedPro(pro)}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition ${selectedPro?.id === pro.id ? 'border-red-600 bg-red-50' : 'border-gray-100 bg-white'}`}
          >
            <img src={pro.image} alt={pro.name} className="w-14 h-14 rounded-full object-cover" />
            <div className="flex-1">
              <h4 className="font-bold text-gray-800">{pro.name}</h4>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="flex items-center text-yellow-500"><Star size={14} fill="currentColor" /> {pro.rating}</span>
                <span>• {pro.jobs} Jobs</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {pro.distance} away • ETA {pro.eta}
              </div>
            </div>
            {selectedPro?.id === pro.id && <Check className="text-red-600" />}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800">Payment & Review</h3>
      
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <h4 className="font-semibold mb-3">Bill Details</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between"><span>Service Fee</span><span>₹{fees.service}</span></div>
          <div className="flex justify-between"><span>Travel Fee</span><span>₹{fees.travel}</span></div>
          <div className="flex justify-between"><span>GST (18%)</span><span>₹{fees.gst.toFixed(0)}</span></div>
          {discount > 0 && (
             <div className="flex justify-between text-green-600 font-medium"><span>Discount</span><span>-₹{(fees.service + fees.travel + fees.gst) * discount}</span></div>
          )}
          <div className="border-t pt-2 mt-2 flex justify-between text-base font-bold text-gray-800">
            <span>Total To Pay</span>
            <span>₹{total.toFixed(0)}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
            <Ticket className="absolute left-3 top-3 text-gray-400" size={18} />
            <input 
                type="text" 
                placeholder="Promo Code (e.g. ORGO50)" 
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg uppercase"
            />
        </div>
        <button onClick={applyPromo} className="bg-gray-800 text-white px-4 rounded-lg text-sm font-medium">Apply</button>
      </div>

      <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
        <p><strong>Service:</strong> {service.name}</p>
        <p><strong>Address:</strong> {address}</p>
        <p><strong>Time:</strong> {date}, {timeSlot}</p>
        <p><strong>Pro:</strong> {selectedPro?.name}</p>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
        <Check className="text-green-600" size={40} />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Confirmed!</h2>
      <p className="text-gray-600 mb-8">Booking ID: #{orderId.slice(0, 8).toUpperCase()}</p>
      
      <div className="w-full space-y-3">
        <button onClick={() => onComplete({id: orderId, status: 'Active'})} className="w-full py-3 bg-red-600 text-white rounded-lg font-bold">
          Track Order
        </button>
        <button onClick={onClose} className="w-full py-3 border border-gray-300 text-gray-600 rounded-lg font-medium">
          Back to Home
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="bg-red-600 p-4 text-white flex items-center gap-3 shadow-md">
        <button onClick={onClose} className="hover:bg-red-700 p-1 rounded">Back</button>
        <h2 className="text-lg font-bold flex-1">Book {service.name}</h2>
        <span className="text-sm opacity-80">Step {step}/4</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderSuccess()}
      </div>

      {step < 5 && (
        <div className="p-4 border-t bg-white safe-area-bottom">
          <button 
            disabled={
              isSubmitting ||
              (step === 1 && !address) || 
              (step === 2 && (!date || !timeSlot)) ||
              (step === 3 && !selectedPro)
            }
            onClick={() => step === 4 ? handleConfirmBooking() : setStep(s => s + 1)}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>Processing <Loader2 className="animate-spin" size={20} /></>
            ) : (
              step === 4 ? 'Confirm Booking' : 
              <>Next Step <ChevronRight size={20} /></>
            )}
          </button>
        </div>
      )}
    </div>
  );
};