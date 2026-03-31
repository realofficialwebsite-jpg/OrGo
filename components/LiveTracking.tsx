import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, auth } from '../src/firebase';
import { Booking } from '../src/types';
import { calculateDistance, calculateETA } from '../src/utils/location';
import { Phone, MessageSquare, Navigation, MapPin, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Fix Leaflet marker icon issue
const redIcon = new L.DivIcon({
  className: 'bg-red-500 rounded-full w-6 h-6 border-2 border-white shadow-lg',
  iconSize: [24, 24],
});

const blueIcon = new L.DivIcon({
  className: 'bg-blue-500 rounded-full w-6 h-6 border-2 border-white shadow-lg',
  iconSize: [24, 24],
});

const FitBounds = ({ customerLocation, workerLocation }: { customerLocation: { lat: number; lng: number }, workerLocation?: { lat: number; lng: number } }) => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    if (workerLocation) {
      const bounds = L.latLngBounds([
        [customerLocation.lat, customerLocation.lng],
        [workerLocation.lat, workerLocation.lng]
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView([customerLocation.lat, customerLocation.lng], 13);
    }
  }, [map, customerLocation, workerLocation]);
  return null;
};

interface LiveTrackingProps {
  order: Booking;
  userRole: 'customer' | 'worker';
}

export const LiveTracking: React.FC<LiveTrackingProps> = ({ order, userRole }) => {
  const [workerLocation, setWorkerLocation] = useState(order?.workerLocation);
  const [eta, setEta] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [showDefaultWarning, setShowDefaultWarning] = useState(true);

  const startTracking = () => {
    if (userRole !== 'worker') return;
    
    setGeoError(null);
    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          setGeoError(null);
          const newLocation = { 
            lat: Number(position.coords.latitude), 
            lng: Number(position.coords.longitude) 
          };
          
          setWorkerLocation(newLocation);
          await updateDoc(doc(db, 'order', order.id), { 
            workerLocation: newLocation 
          });
        } catch (error) {
          console.error("Error updating worker location:", error);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        let msg = error.message;
        if (error.code === 1) msg = "Permission denied. Please enable location in browser settings.";
        setGeoError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    return watchId;
  };

  useEffect(() => {
    if (!order || !order.id) return;
    
    if (userRole === 'worker') {
      const watchId = startTracking();
      return () => {
        if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
      };
    } else {
      const unsubscribe = onSnapshot(doc(db, 'order', order.id), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Booking;
          if (data.workerLocation) {
            setWorkerLocation({
              lat: Number(data.workerLocation.lat),
              lng: Number(data.workerLocation.lng)
            });
          }
        }
      });
      return () => unsubscribe();
    }
  }, [order?.id, userRole]);

  useEffect(() => {
    if (order?.customerLocation && workerLocation) {
      const d = calculateDistance(workerLocation.lat, workerLocation.lng, order.customerLocation.lat, order.customerLocation.lng);
      setDistance(d);
      const mins = Math.round((d / 25) * 60);
      setEta(mins);
    }
  }, [order?.customerLocation, workerLocation]);

  if (!order) return <div className='p-10 text-center'>Loading Order Details...</div>;
  if (!order.customerLocation) return <div className='p-10 text-center'>Waiting for location data...</div>;

  const targetPhone = userRole === 'customer' ? order.workerPhone : order.customerPhone;
  const msg = userRole === 'customer' ? "Hello, I'm waiting for my service." : "Hello, I'm on my way for your service.";

  const isDefaultLocation = (order.customerLocation.lat === 0 && order.customerLocation.lng === 0) || 
                          (order.customerLocation.lat === 26.9124 && order.customerLocation.lng === 75.7873);

  const handleWhatsApp = () => {
    if (!targetPhone) return alert('Phone number not available');
    const cleanPhone = targetPhone.replace(/\D/g, '');
    window.open('https://wa.me/91' + cleanPhone + '?text=' + encodeURIComponent(msg), '_blank');
  };

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {geoError && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center justify-between gap-3 text-red-600 text-xs font-bold overflow-hidden"
          >
            <div className="flex items-center gap-3">
              <Navigation size={16} className="animate-pulse shrink-0" />
              <span>{geoError}</span>
            </div>
            <button 
              onClick={() => startTracking()}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg active:scale-95 transition-all shrink-0"
            >
              Retry
            </button>
          </motion.div>
        )}
        {isDefaultLocation && showDefaultWarning && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center justify-between gap-3 text-amber-600 text-xs font-bold overflow-hidden"
          >
            <div className="flex items-center gap-3">
              <MapPin size={16} className="shrink-0" />
              <span>Location not set. Showing default area.</span>
            </div>
            <button 
              onClick={() => setShowDefaultWarning(false)}
              className="p-1 hover:bg-amber-100 rounded-full transition-colors"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="h-[400px] w-full rounded-3xl overflow-hidden shadow-lg border border-gray-100 relative z-0">
        <MapContainer 
          key={order.id}
          center={[order.customerLocation.lat, order.customerLocation.lng]} 
          zoom={13} 
          className="h-full w-full"
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[order.customerLocation.lat, order.customerLocation.lng]} icon={redIcon} />
          <FitBounds customerLocation={order.customerLocation} workerLocation={workerLocation} />
          {workerLocation && (
            <Marker position={[workerLocation.lat, workerLocation.lng]} icon={blueIcon} />
          )}
        </MapContainer>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 mb-4">
          <img 
            src={order.workerPhoto || 'https://picsum.photos/seed/worker/200'} 
            alt={order.workerName} 
            className="w-12 h-12 rounded-full object-cover border border-gray-100"
            referrerPolicy="no-referrer"
          />
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Your Professional</p>
            <p className="font-bold text-gray-900">{order.workerName || 'Expert Partner'}</p>
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {distance !== null && distance < 0.1 
            ? 'Professional has Arrived!' 
            : 'Arriving in ' + eta + ' mins'}
        </h3>
        
        <div className="flex flex-col gap-4 mt-6">
          {userRole === 'worker' && order.customerLocation && (
            <button 
              onClick={() => window.open('https://www.google.com/maps/dir/?api=1&destination=' + order.customerLocation!.lat + ',' + order.customerLocation!.lng + '&travelmode=driving', '_blank')}
              className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-lg active:scale-[0.98] transition-all"
            >
              <Navigation size={18} /> Start Google Maps Navigation
            </button>
          )}
          <div className="flex gap-4">
            <a href={`tel:+91${targetPhone}`} className="flex-1 flex items-center justify-center gap-2 py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm shadow-lg active:scale-[0.98] transition-all">
              <Phone size={18} /> Call
            </a>
            <button 
              onClick={handleWhatsApp}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold text-sm shadow-sm active:scale-[0.98] transition-all"
            >
              <MessageSquare size={18} /> WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
