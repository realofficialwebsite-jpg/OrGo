import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, auth } from '../src/firebase';
import { Booking } from '../src/types';
import { calculateETA } from '../src/utils/location';
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
  const [workerLocation, setWorkerLocation] = useState(order.workerLocation);
  const [eta, setEta] = useState<number | null>(null);

  useEffect(() => {
    if (userRole === 'worker') {
      const watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = { lat: latitude, lng: longitude };
          setWorkerLocation(newLocation);
          await updateDoc(doc(db, 'order', order.id), { workerLocation: newLocation });
        },
        (error) => console.error(error),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      const unsubscribe = onSnapshot(doc(db, 'order', order.id), (doc) => {
        const data = doc.data() as Booking;
        if (data.workerLocation) setWorkerLocation(data.workerLocation);
      });
      return () => unsubscribe();
    }
  }, [order.id, userRole]);

  useEffect(() => {
    if (order.customerLocation && workerLocation) {
      setEta(calculateETA(workerLocation.lat, workerLocation.lng, order.customerLocation.lat, order.customerLocation.lng));
    }
  }, [order.customerLocation, workerLocation]);

  if (!order.customerLocation || !workerLocation) return null;

  return (
    <div className="space-y-4">
      <div className="h-[400px] w-full rounded-3xl overflow-hidden shadow-lg border border-gray-100">
        <MapContainer center={[order.customerLocation.lat, order.customerLocation.lng]} zoom={13} className="h-full w-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[order.customerLocation.lat, order.customerLocation.lng]} icon={redIcon} />
          <Marker position={[workerLocation.lat, workerLocation.lng]} icon={blueIcon} />
          <FitBounds customerLocation={order.customerLocation} workerLocation={workerLocation} />
        </MapContainer>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {userRole === 'customer' ? `Professional arriving in ~${eta} mins` : `Customer is ~${eta} mins away`}
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
          <a href="tel:+1234567890" className="flex-1 flex items-center justify-center gap-2 py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm shadow-lg active:scale-[0.98] transition-all">
            <Phone size={18} /> Call
          </a>
          <a href="sms:+1234567890" className="flex-1 flex items-center justify-center gap-2 py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-bold text-sm shadow-sm active:scale-[0.98] transition-all">
            <MessageSquare size={18} /> Message
          </a>
        </div>
      </div>
    </div>
  );
};
