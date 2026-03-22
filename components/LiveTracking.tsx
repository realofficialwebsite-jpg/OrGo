import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../src/firebase';
import { Booking } from '../src/types';
import { calculateDistance, calculateETA } from '../src/utils/location';
import { Phone, MessageSquare, Navigation, Star } from 'lucide-react';

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
  const [workerData, setWorkerData] = useState<any>(null);
  const [customerData, setCustomerData] = useState<any>(null);

  useEffect(() => {
    if (!order || !order.id) return;
    
    // Fetch Worker Data
    if (order.assignedWorkerId) {
      getDoc(doc(db, 'users', order.assignedWorkerId)).then(snap => {
        if (snap.exists()) setWorkerData(snap.data());
      });
    }

    // Fetch Customer Data
    if (order.userId) {
      getDoc(doc(db, 'users', order.userId)).then(snap => {
        if (snap.exists()) setCustomerData(snap.data());
      });
    }

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
  }, [order?.id, userRole, order.assignedWorkerId, order.userId]);

  useEffect(() => {
    if (order?.customerLocation && workerLocation) {
      const d = calculateDistance(workerLocation.lat, workerLocation.lng, order.customerLocation.lat, order.customerLocation.lng);
      setDistance(d);
      setEta(Math.round((d / 25) * 60));
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
          <Marker position={[order.customerLocation.lat, order.customerLocation.lng]} icon={redIcon}>
            <Popup>
              <div className="p-1">
                <p className="font-bold text-xs">{customerData?.name || 'Customer'}</p>
              </div>
            </Popup>
          </Marker>
          {workerLocation && (
            <>
              <Marker position={[workerLocation.lat, workerLocation.lng]} icon={blueIcon}>
                <Popup>
                  <div className="p-1 flex items-center gap-2">
                    <img 
                      src={workerData?.photo || 'https://picsum.photos/seed/worker/200'} 
                      className="w-6 h-6 rounded-full object-cover" 
                      referrerPolicy="no-referrer" 
                    />
                    <p className="font-bold text-xs">{workerData?.name || 'Worker'}</p>
                  </div>
                </Popup>
              </Marker>
              <FitBounds customerLocation={order.customerLocation} workerLocation={workerLocation} />
            </>
          )}
        </MapContainer>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            {distance !== null && distance < 0.1 
              ? 'Professional has Arrived!' 
              : `Professional arriving in ${eta || '--'} mins`}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {distance !== null && `${distance.toFixed(2)} km away`}
          </p>
        </div>

        {/* Identity Card */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-6">
          <img 
            src={userRole === 'customer' ? (workerData?.photo || 'https://picsum.photos/seed/worker/200') : (customerData?.photo || 'https://picsum.photos/seed/customer/200')} 
            alt="Profile" 
            className="w-12 h-12 rounded-xl object-cover shadow-sm"
            referrerPolicy="no-referrer"
          />
          <div className="flex-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {userRole === 'customer' ? 'Your Professional' : 'Customer'}
            </p>
            <div className="flex items-center gap-2">
              <p className="font-bold text-gray-900">
                {userRole === 'customer' ? (workerData?.name || 'Professional') : (customerData?.name || 'Customer')}
              </p>
              {userRole === 'customer' && workerData?.rating && (
                <span className="flex items-center gap-1 text-xs font-bold text-amber-500">
                  <Star size={12} fill="currentColor" /> {workerData.rating.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          {userRole === 'worker' && (
            <button 
              onClick={() => {
                if (order.customerLocation) {
                  window.open('https://www.google.com/maps/dir/?api=1&destination=' + order.customerLocation.lat + ',' + order.customerLocation.lng + '&travelmode=driving', '_blank');
                }
              }}
              className="w-full flex items-center justify-center gap-3 py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-lg active:scale-[0.98] transition-all"
            >
              <Navigation size={18} /> Start Google Maps Navigation
            </button>
          )}
          <div className="flex gap-3">
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
