import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, auth } from '../src/firebase';
import { Booking } from '../src/types';
import { calculateDistance, calculateETA } from '../src/utils/location';
import { Phone, MessageSquare, Navigation, MapPin, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// IMPORT THE OFFICIAL CAPACITOR PLUGIN
import { Geolocation } from '@capacitor/geolocation';

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
  
  // Use a ref to store the native tracking ID so we can clear it properly
  const watchIdRef = useRef<string | null>(null);

  const startTracking = async () => {
    if (userRole !== 'worker') return;
    
    setGeoError(null);

    try {
      // 1. Force Android to ask for GPS permissions
      const permStatus = await Geolocation.requestPermissions();
      if (permStatus.location !== 'granted') {
        setGeoError("Location permission denied. Please allow in Android App Settings.");
        return;
      }

      // Clear any existing trackers before starting a new one
      if (watchIdRef.current) {
        await Geolocation.clearWatch({ id: watchIdRef.current });
      }

      // 2. Start native Android GPS tracking
      const id = await Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
        async (position, err) => {
          if (err) {
            console.error("Geolocation error:", err);
            setGeoError(err.message || "Lost GPS signal.");
            return;
          }
          
          if (position) {
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
          }
        }
      );
      
      watchIdRef.current = id;
    } catch (err: any) {
      console.error("Tracking setup failed:", err);
      setGeoError("Failed to access native GPS.");
    }
  };

  useEffect(() => {
    if (!order || !order.id) return;
    
    let unsubscribe: (() => void) | undefined;

    if (userRole === 'worker') {
      startTracking();
    } else {
      unsubscribe = onSnapshot(doc(db, 'order', order.id), (docSnap) => {
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
    }

    // Cleanup function when screen closes
    return () => {
      if (watchIdRef.current) {
        Geolocation.clearWatch({ id: watchIdRef.current });
      }
      if (unsubscribe) {
        unsubscribe();
      }
    };
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
    <div className="h-full w-full relative">
      <AnimatePresence>
        {geoError && (
          <motion.div 
            key="geo-error"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="absolute top-4 left-4 right-4 z-[1000] bg-red-50 border border-red-100 p-3 rounded-2xl flex items-center justify-between gap-3 text-red-600 text-[10px] font-bold shadow-lg"
          >
            <div className="flex items-center gap-2">
              <Navigation size={14} className="animate-pulse shrink-0" />
              <span>{geoError}</span>
            </div>
            <button 
              onClick={() => startTracking()}
              className="px-2 py-1 bg-red-600 text-white rounded-lg active:scale-95 transition-all shrink-0"
            >
              Retry
            </button>
          </motion.div>
        )}
        {isDefaultLocation && showDefaultWarning && (
          <motion.div 
            key="default-location-warning"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="absolute top-4 left-4 right-4 z-[1000] bg-amber-50 border border-amber-100 p-3 rounded-2xl flex items-center justify-between gap-3 text-amber-600 text-[10px] font-bold shadow-lg"
          >
            <div className="flex items-center gap-2">
              <MapPin size={14} className="shrink-0" />
              <span>Location not set. Showing default area.</span>
            </div>
            <button 
              onClick={() => setShowDefaultWarning(false)}
              className="p-1 hover:bg-amber-100 rounded-full transition-colors"
            >
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-full w-full absolute inset-0 z-0">
        <MapContainer 
          key={order.id}
          center={[order.customerLocation.lat, order.customerLocation.lng]} 
          zoom={13} 
          className="h-full w-full"
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[order.customerLocation.lat, order.customerLocation.lng]} icon={redIcon} />
          <FitBounds customerLocation={order.customerLocation} workerLocation={workerLocation} />
          {workerLocation && (
            <Marker position={[workerLocation.lat, workerLocation.lng]} icon={blueIcon} />
          )}
        </MapContainer>
      </div>
    </div>
  );
};
