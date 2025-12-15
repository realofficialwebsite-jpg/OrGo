import React from 'react';
import { Phone, MessageSquare, MapPin, CheckCircle } from 'lucide-react';

export const Tracking: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-gray-50 pb-20">
      {/* Fake Map */}
      <div className="h-64 bg-gray-200 relative w-full overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/OpenStreetMap_Transportation_Map.png')] bg-cover opacity-50 grayscale"></div>
        {/* User Pin */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
           <div className="relative">
             <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
             <div className="absolute -top-8 -left-6 bg-white px-2 py-1 rounded shadow text-xs font-bold whitespace-nowrap">You</div>
           </div>
        </div>
        {/* Pro Pin */}
        <div className="absolute top-1/3 left-1/3">
           <MapPin className="text-red-600 transform -translate-y-full" size={32} fill="currentColor" />
        </div>
      </div>

      <div className="flex-1 -mt-6 bg-white rounded-t-3xl shadow-lg p-6 relative z-10">
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>

        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">15 mins</h2>
            <p className="text-gray-500 text-sm">Estimated arrival</p>
          </div>
          <div className="text-right">
             <p className="font-bold text-gray-800">Rajesh Kumar</p>
             <p className="text-gray-500 text-xs">Plumber • 4.8 ★</p>
          </div>
        </div>

        <div className="flex gap-4 mb-8">
          <button className="flex-1 flex items-center justify-center gap-2 py-2 border border-green-500 text-green-600 rounded-lg font-medium hover:bg-green-50">
            <Phone size={18} /> Call
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-2 border border-blue-500 text-blue-600 rounded-lg font-medium hover:bg-blue-50">
            <MessageSquare size={18} /> Message
          </button>
        </div>

        <h3 className="font-bold text-gray-800 mb-4">Timeline</h3>
        <div className="relative pl-4 border-l-2 border-gray-200 space-y-8">
          <div className="relative">
            <div className="absolute -left-[21px] bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
            <p className="font-medium text-gray-800 text-sm">Booking Confirmed</p>
            <p className="text-xs text-gray-500">10:30 AM</p>
          </div>
          <div className="relative">
            <div className="absolute -left-[21px] bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
            <p className="font-medium text-gray-800 text-sm">Professional Assigned</p>
            <p className="text-xs text-gray-500">10:35 AM</p>
          </div>
          <div className="relative">
            <div className="absolute -left-[21px] bg-red-600 w-4 h-4 rounded-full border-2 border-white animate-ping"></div>
            <div className="absolute -left-[21px] bg-red-600 w-4 h-4 rounded-full border-2 border-white"></div>
            <p className="font-medium text-red-600 text-sm">On the Way</p>
            <p className="text-xs text-gray-500">10:45 AM</p>
          </div>
          <div className="relative opacity-50">
            <div className="absolute -left-[21px] bg-gray-300 w-4 h-4 rounded-full border-2 border-white"></div>
            <p className="font-medium text-gray-800 text-sm">Service Started</p>
          </div>
        </div>
      </div>
    </div>
  );
};