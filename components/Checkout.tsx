import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ArrowLeft, 
  ArrowRight, 
  MapPin, 
  Calendar, 
  Clock, 
  FileText, 
  Camera, 
  CreditCard, 
  CheckCircle2,
  Loader2,
  Plus,
  Wallet
} from 'lucide-react';
import { useCart } from '../src/CartContext';
import { AppView, Booking, Address } from '../src/types';
import { auth, db, storage } from '../src/firebase';
import { handleFirestoreError, OperationType } from '../utils/firestore-errors';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import CustomerRadar from './CustomerRadar';

interface CheckoutProps {
  onClose: () => void;
  setView: (view: AppView) => void;
}

const TIME_SLOTS = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM',
  '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM'
];

export const Checkout: React.FC<CheckoutProps> = ({ onClose, setView }) => {
  const { cart, cartTotal, clearCart } = useCart();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  // Step 1: Address
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState<Partial<Address>>({
    type: 'Home'
  });
  const [locating, setLocating] = useState(false);

  // Step 2: Schedule
  const [isInstant, setIsInstant] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  // Step 3: Details & Media
  const [instructions, setInstructions] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Step 4: Payment
  const [paymentMethod, setPaymentMethod] = useState('COD');

  const platformFee = 49;
  const taxes = Math.round(cartTotal * 0.18);
  const grandTotal = cartTotal + platformFee + taxes;

  useEffect(() => {
    const fetchUserAddresses = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.addresses && Array.isArray(data.addresses)) {
            setSavedAddresses(data.addresses);
            if (data.addresses.length > 0) {
              setSelectedAddressId(data.addresses[0].id);
            }
          }
        }
      }
    };
    fetchUserAddresses();
  }, [auth.currentUser]);

  const handleFetchLocation = () => {
    if (!navigator.geolocation) return alert('Geolocation not supported');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
        const data = await res.json();
        const addr = data.address;
        
        setAddressForm(prev => ({
          ...prev,
          street: addr.road || addr.suburb || addr.neighbourhood || '',
          city: addr.city || addr.town || addr.village || '',
          state: addr.state || '',
          pincode: addr.postcode || '',
          landmark: addr.suburb || ''
        }));
      } catch (err) {
        console.error('Error fetching location:', err);
        alert('Could not fetch address details. Please enter manually.');
      } finally {
        setLocating(false);
      }
    }, (err) => {
      console.error(err);
      alert('Location access denied');
      setLocating(false);
    });
  };

  const validateAddress = () => {
    const { name, phone, flatNo, street, pincode, city, state } = addressForm;
    if (!name || !phone || !flatNo || !street || !pincode || !city || !state) {
      alert('Please fill all required fields');
      return false;
    }
    if (phone.length !== 10) {
      alert('Phone number must be 10 digits');
      return false;
    }
    if (pincode.length !== 6) {
      alert('Pincode must be 6 digits');
      return false;
    }
    return true;
  };

  const handleSaveAddress = async () => {
    console.log('Attempting to save address:', addressForm);
    
    if (!auth.currentUser) {
      console.error('No authenticated user found');
      alert('You must be logged in to save an address');
      return;
    }

    if (!validateAddress()) {
      console.warn('Address validation failed');
      return;
    }

    setLoading(true);
    try {
      const newAddress: Address = {
        id: Date.now().toString(),
        name: addressForm.name || '',
        phone: addressForm.phone || '',
        flatNo: addressForm.flatNo || '',
        street: addressForm.street || '',
        landmark: addressForm.landmark || '',
        pincode: addressForm.pincode || '',
        city: addressForm.city || '',
        state: addressForm.state || '',
        type: addressForm.type || 'Home'
      };

      console.log('Prepared address object:', newAddress);

      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, {
        addresses: arrayUnion(newAddress)
      }, { merge: true });

      console.log('Address saved successfully to Firestore');

      setSavedAddresses(prev => [...prev, newAddress]);
      setSelectedAddressId(newAddress.id);
      setAddressForm({ type: 'Home' });
      setShowAddressForm(false);
      setStep(2); // Automatically trigger next step
      console.log('Moved to step 2');
    } catch (err) {
      console.error('Firebase Error:', err);
      alert(`Failed to save address: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedAddressString = () => {
    const addr = savedAddresses.find(a => a.id === selectedAddressId);
    if (!addr) return '';
    return `${addr.flatNo}, ${addr.street}, ${addr.city}, ${addr.state} - ${addr.pincode}`;
  };

  const handleConfirmBooking = async () => {
    console.log('Attempting to confirm booking...');
    if (!auth.currentUser || !selectedAddressId) {
      console.error('Missing user or address:', { user: auth.currentUser, addressId: selectedAddressId });
      alert('You must be logged in and select an address');
      return;
    }
    setLoading(true);

    try {
      let imageUrl = '';
      if (imageFile) {
        console.log('Uploading image...');
        const storageRef = ref(storage, `booking_images/${auth.currentUser.uid}/${Date.now()}_${imageFile.name}`);
        const uploadResult = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(uploadResult.ref);
        console.log('Image uploaded:', imageUrl);
      }

      const orderPayload = {
        userId: auth.currentUser.uid,
        cartItems: cart,
        grandTotal,
        address: getSelectedAddressString(),
        addressId: selectedAddressId,
        scheduledDate: isInstant ? 'Instant' : selectedDate,
        scheduledTime: isInstant ? 'Now' : selectedTime,
        isInstant,
        instructions,
        imageUrl,
        status: 'searching',
        interestedWorkers: [],
        createdAt: serverTimestamp()
      };

      console.log('Saving order to Firestore:', orderPayload);
      const docRef = await addDoc(collection(db, 'order'), orderPayload);
      console.log('Order saved successfully');
      
      setCreatedOrderId(docRef.id);
      setStep(5);
    } catch (error) {
      console.error('Firebase Error confirming booking:', error);
      alert(`Failed to place order: ${error instanceof Error ? error.message : 'Unknown error'}`);
      handleFirestoreError(error, OperationType.WRITE, 'order');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !selectedAddressId) return alert('Please select an address');
    if (step === 2 && !isInstant && (!selectedDate || !selectedTime)) return alert('Please select a date and time');
    setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateDates = () => {
    const dates = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push({
        full: d.toISOString().split('T')[0],
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: d.getDate(),
        month: d.toLocaleDateString('en-US', { month: 'short' })
      });
    }
    return dates;
  };

  if (success) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center p-10 text-center"
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200 }}
          className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-8 shadow-lg shadow-emerald-200"
        >
          <CheckCircle2 size={48} className="text-white" />
        </motion.div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4 font-display">Booking Confirmed!</h2>
        <p className="text-gray-500 mb-8 max-w-xs">Your professional will arrive at the scheduled time. You can track your booking in the orders section.</p>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 3 }}
            className="h-full bg-emerald-500"
          />
        </div>
        <p className="text-[10px] text-gray-400 mt-4 uppercase tracking-widest font-bold">Redirecting to your bookings...</p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed inset-0 bg-gray-50 z-50 flex flex-col"
    >
      {/* Header */}
      <div className="bg-white px-5 pt-6 pb-4 flex items-center justify-between border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={step === 1 ? onClose : prevStep} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-gray-900" />
          </button>
          <h2 className="text-xl font-bold text-gray-900 font-display">Checkout</h2>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4].map(s => (
            <div 
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step ? 'w-8 bg-primary' : s < step ? 'w-4 bg-emerald-500' : 'w-4 bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-5">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Select Address</h3>
                    <p className="text-xs text-gray-500">Where should we arrive?</p>
                  </div>
                </div>
                {!showAddressForm && (
                  <button 
                    onClick={() => setShowAddressForm(true)}
                    className="flex items-center gap-1 text-primary text-xs font-bold bg-primary/5 px-3 py-2 rounded-lg"
                  >
                    <Plus size={14} /> Add New
                  </button>
                )}
              </div>

              {showAddressForm ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-gray-900">Add New Address</h4>
                    <button 
                      onClick={handleFetchLocation}
                      disabled={locating}
                      className="text-[10px] font-bold text-primary flex items-center gap-1 bg-primary/5 px-2 py-1 rounded"
                    >
                      {locating ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />}
                      Use Current Location
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                      <input 
                        type="text" 
                        value={addressForm.name || ''}
                        onChange={e => setAddressForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                      <input 
                        type="tel" 
                        maxLength={10}
                        value={addressForm.phone || ''}
                        onChange={e => setAddressForm(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all"
                        placeholder="10-digit number"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Pincode</label>
                      <input 
                        type="text" 
                        maxLength={6}
                        value={addressForm.pincode || ''}
                        onChange={e => setAddressForm(prev => ({ ...prev, pincode: e.target.value.replace(/\D/g, '') }))}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all"
                        placeholder="6-digit"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">State</label>
                      <input 
                        type="text" 
                        value={addressForm.state || ''}
                        onChange={e => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">City</label>
                      <input 
                        type="text" 
                        value={addressForm.city || ''}
                        onChange={e => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">House / Flat No.</label>
                      <input 
                        type="text" 
                        value={addressForm.flatNo || ''}
                        onChange={e => setAddressForm(prev => ({ ...prev, flatNo: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Road / Area</label>
                      <input 
                        type="text" 
                        value={addressForm.street || ''}
                        onChange={e => setAddressForm(prev => ({ ...prev, street: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Landmark (Optional)</label>
                      <input 
                        type="text" 
                        value={addressForm.landmark || ''}
                        onChange={e => setAddressForm(prev => ({ ...prev, landmark: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Address Type</label>
                      <div className="flex gap-2 mt-1">
                        {['Home', 'Work', 'Other'].map(type => (
                          <button 
                            key={type}
                            onClick={() => setAddressForm(prev => ({ ...prev, type: type as any }))}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                              addressForm.type === type 
                                ? 'bg-primary border-primary text-white' 
                                : 'bg-white border-gray-100 text-gray-500'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button 
                      onClick={() => setShowAddressForm(false)}
                      className="flex-1 py-3 bg-gray-50 text-gray-500 font-bold rounded-xl text-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveAddress}
                      disabled={loading}
                      className="flex-[2] py-3 bg-primary text-white font-bold rounded-xl text-sm shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 size={18} className="animate-spin" /> : 'Save & Continue'}
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {savedAddresses.length > 0 ? (
                    savedAddresses.map(addr => (
                      <div 
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`p-5 bg-white rounded-3xl border-2 transition-all cursor-pointer relative ${
                          selectedAddressId === addr.id ? 'border-primary shadow-md' : 'border-gray-100'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase tracking-wider">{addr.type}</span>
                            <h4 className="font-bold text-gray-900 text-sm">{addr.name}</h4>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedAddressId === addr.id ? 'border-primary bg-primary' : 'border-gray-200'
                          }`}>
                            {selectedAddressId === addr.id && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          {addr.flatNo}, {addr.street}, {addr.landmark && `${addr.landmark}, `}{addr.city}, {addr.state} - {addr.pincode}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 mt-2">{addr.phone}</p>
                        
                        {selectedAddressId === addr.id && (
                          <motion.button 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              nextStep();
                            }}
                            className="w-full mt-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-sm"
                          >
                            Select & Continue
                          </motion.button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-gray-200">
                      <MapPin size={32} className="text-gray-300 mx-auto mb-3" />
                      <p className="text-sm font-bold text-gray-400">No saved addresses found</p>
                      <button 
                        onClick={() => setShowAddressForm(true)}
                        className="mt-4 text-primary text-xs font-bold"
                      >
                        + Add your first address
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Select Schedule</h3>
                  <p className="text-xs text-gray-500">Pick a convenient time</p>
                </div>
              </div>

              <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                <button 
                  onClick={() => { setIsInstant(true); nextStep(); }}
                  className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all ${isInstant ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}
                >
                  Get it Now (Instant)
                </button>
                <button 
                  onClick={() => setIsInstant(false)}
                  className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all ${!isInstant ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}
                >
                  Schedule for Later
                </button>
              </div>

              {!isInstant && (
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Select Date</p>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                      {generateDates().map((d) => (
                        <button 
                          key={d.full}
                          onClick={() => setSelectedDate(d.full)}
                          className={`flex flex-col items-center justify-center min-w-[80px] h-24 rounded-2xl border transition-all ${
                            selectedDate === d.full 
                              ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                              : 'bg-white border-gray-100 text-gray-600'
                          }`}
                        >
                          <span className="text-[10px] font-bold uppercase mb-1">{d.day}</span>
                          <span className="text-xl font-bold">{d.date}</span>
                          <span className="text-[10px] font-medium">{d.month}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Select Time Slot</p>
                    <div className="grid grid-cols-3 gap-3">
                    {TIME_SLOTS.map((t) => (
                      <button 
                        key={t}
                        onClick={() => setSelectedTime(t)}
                        className={`py-3 rounded-xl text-xs font-bold border transition-all ${
                          selectedTime === t 
                            ? 'bg-primary border-primary text-white shadow-md' 
                            : 'bg-white border-gray-100 text-gray-600 hover:border-primary/30'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              )}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Details & Media</h3>
                  <p className="text-xs text-gray-500">Help us understand better</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Specific Instructions</p>
                  <textarea 
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="E.g. Please bring a ladder, call before arriving..."
                    className="w-full h-32 bg-white border border-gray-100 rounded-3xl p-5 text-sm font-medium focus:outline-none focus:border-primary transition-all shadow-sm"
                  />
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Upload Image (Optional)</p>
                  <div className="flex gap-4">
                    <label className="w-24 h-24 bg-white border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-primary/30 hover:text-primary transition-all">
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      <Camera size={24} />
                      <span className="text-[10px] font-bold mt-1">Add Photo</span>
                    </label>
                    {imagePreview && (
                      <div className="w-24 h-24 rounded-2xl overflow-hidden relative group">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={20} className="text-white" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Payment Method</h3>
                  <p className="text-xs text-gray-500">How would you like to pay?</p>
                </div>
              </div>

              <div className="space-y-4">
                <div 
                  className={`p-5 bg-white rounded-3xl border-2 transition-all flex items-center justify-between ${
                    paymentMethod === 'COD' ? 'border-primary shadow-md' : 'border-gray-100'
                  }`}
                  onClick={() => setPaymentMethod('COD')}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                      <Wallet size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Cash on Delivery</p>
                      <p className="text-[10px] text-gray-500 font-medium">Pay after service completion</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === 'COD' ? 'border-primary bg-primary' : 'border-gray-200'
                  }`}>
                    {paymentMethod === 'COD' && <CheckCircle2 size={14} className="text-white" />}
                  </div>
                </div>

                <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-between opacity-50 grayscale">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Online Payment</p>
                      <p className="text-[10px] text-gray-500 font-medium">Coming soon</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Address</span>
                    <span className="text-gray-900 font-bold truncate max-w-[150px]">{getSelectedAddressString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Schedule</span>
                    <span className="text-gray-900 font-bold">{selectedDate} at {selectedTime}</span>
                  </div>
                  <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
                    <span className="text-base font-bold text-gray-900">Total Amount</span>
                    <span className="text-xl font-bold text-primary">₹{grandTotal}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 5 && createdOrderId && (
            <motion.div 
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <CustomerRadar 
                orderId={createdOrderId} 
                onWorkerSelected={() => {
                  setSuccess(true);
                  setTimeout(() => {
                    clearCart();
                    setView(AppView.ORDERS);
                  }, 3000);
                }} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sticky Bottom Button */}
      {!showAddressForm && step < 5 && (
        <div className="p-5 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <button 
            onClick={step === 4 ? handleConfirmBooking : nextStep}
            disabled={loading}
            className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Confirming...</span>
              </>
            ) : (
              <>
                <span>{step === 4 ? `Confirm Booking (₹${grandTotal})` : 'Next Step'}</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </div>
      )}
    </motion.div>
  );
};
