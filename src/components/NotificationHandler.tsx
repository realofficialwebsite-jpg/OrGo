import React, { useState, useEffect } from 'react';
import { messaging, getOrGoToken } from '../firebase';
import { onMessage } from 'firebase/messaging';
import { Copy, Bell, BellOff } from 'lucide-react';

export const NotificationHandler: React.FC = () => {
  const [userToken, setUserToken] = useState<string>("Fetching token...");
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(Notification.permission);

  useEffect(() => {
    const fetchToken = async () => {
      const token = await getOrGoToken();
      if (token) {
        setUserToken(token);
        setPermissionStatus('granted');
      } else {
        setUserToken("Permission denied or no token found.");
        setPermissionStatus(Notification.permission);
      }
    };
    fetchToken();

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Message received. ', payload);
      if (payload.notification) {
        const { title, body } = payload.notification;
        // Show a custom toast or alert
        alert(`Notification: ${title}\n${body}`);
      }
    });

    return () => unsubscribe();
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(userToken);
    alert('Token copied to clipboard!');
  };

  return (
    <div className="p-4 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {permissionStatus === 'granted' ? (
            <div className="bg-green-100 p-1.5 rounded-full">
              <Bell size={18} className="text-green-600" />
            </div>
          ) : (
            <div className="bg-red-100 p-1.5 rounded-full">
              <BellOff size={18} className="text-red-600" />
            </div>
          )}
          <div>
            <h3 className="font-bold text-sm text-gray-800">Your OrGo FCM Token</h3>
            <p className="text-[10px] text-gray-500">Required for sending push notifications</p>
          </div>
        </div>
      </div>
      
      <div className="relative group">
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 font-mono text-[11px] text-gray-700 break-all leading-relaxed max-h-24 overflow-y-auto">
          {userToken}
        </div>
        <button 
          onClick={copyToClipboard}
          className="mt-2 w-full flex items-center justify-center gap-2 bg-gray-800 text-white py-2 rounded-lg text-xs font-bold hover:bg-gray-900 transition active:scale-95"
        >
          <Copy size={14} /> Copy Token
        </button>
      </div>

      {permissionStatus !== 'granted' && (
        <div className="mt-3 p-2 bg-red-50 rounded border border-red-100 flex items-start gap-2">
          <BellOff size={14} className="text-red-500 mt-0.5" />
          <p className="text-[10px] text-red-700 leading-tight">
            <b>Notifications Disabled:</b> Please click the lock icon in your browser address bar and set Notifications to "Allow" to get your token.
          </p>
        </div>
      )}
    </div>
  );
};
