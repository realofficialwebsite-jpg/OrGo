import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, auth } from '../src/firebase';
import { Booking } from '../src/types';
import { calculateDistance, calculateETA } from '../src/utils/location';
import { Phone, MessageSquare, Navigation } from 'lucide-react';

// Fix Leaflet marker icon issue
const redIcon = new L.DivIcon({
  className: 'bg-red-500 rounded-full w-6 h-6 border-2 border-white shadow-lg',
  iconSize: [24, 24],
});

const blueIcon = new L.DivIcon({
  className: 'bg-blue-500 rounded-full w-6 h-6 border-2 border-white shadow-lg',
  iconSize: [24, 24],
});

const FitBounds = ({ customerLocation, workerLocation }: { customerLocation: { lat: number; lng: number }, workerLocation: { lat: number; lng: number } }) => {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds([
      [customerLocation.lat, customerLocation.lng],
      [workerLocation.lat, workerLocation.lng]
    ]);
    map.fitBounds(bounds, { padding: [50, 50] });
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

  useEffect(() => {
    if (!order || !order.id) return;
    
    if (userRole === 'worker') {
      const watchId = navigator.geolocation.watchPosition(
        async (position) => {
          try {
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
        (error) => console.error("Geolocation error:", error),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
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
      setEta(calculateETA(workerLocation.lat, workerLocation.lng, order.customerLocation.lat, order.customerLocation.lng));
    }
  }, [order?.customerLocation, workerLocation]);

  if (!order) return <div className='p-10 text-center'>Loading Order Details...</div>;
  if (!order.customerLocation) return <div className='p-10 text-center'>Waiting for location data...</div>;

  const targetPhone = userRole === 'customer' ? order.workerPhone : order.customerPhone;
  const msg = userRole === 'customer' ? "Hello, I'm waiting for my service." : "Hello, I'm on my way for your service.";

  const handleWhatsApp = () => {
    if (!targetPhone) return alert('Phone number not available');
    const cleanPhone = targetPhone.replace(/\D/g, '');
    window.open('https://wa.me/91' + cleanPhone + '?text=' + encodeURIComponent(msg), '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="h-[400px] w-full rounded-3xl overflow-hidden shadow-lg border border-gray-100">
        <MapContainer center={[order.customerLocation.lat, order.customerLocation.lng]} zoom={13} className="h-full w-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[order.customerLocation.lat, order.customerLocation.lng]} icon={redIcon} />
          {workerLocation && (
            <>
              <Marker position={[workerLocation.lat, workerLocation.lng]} icon={blueIcon} />
              <FitBounds customerLocation={order.customerLocation} workerLocation={workerLocation} />
            </>
          )}
        </MapContainer>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {distance !== null && distance < 0.1 
            ? 'Professional has arrived!' 
            : (userRole === 'customer' ? `Professional arriving in ~${eta} mins` : `Customer is ~${eta} mins away`)}
        </h3>
        
        <div className="flex gap-4 mt-6">
          {userRole === 'worker' && (
            <button 
              onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${order.customerLocation?.lat},${order.customerLocation?.lng}`, '_blank')}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg active:scale-[0.98] transition-all"
            >
              <Navigation size={18} /> Navigate
            </button>
          )}
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
  );
};
