import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase"; // This connects to the 'db' we exported in Step 1
import { getAuth } from "firebase/auth";

import React, { useState, useEffect } from 'react';
import { messaging, getOrGoToken } from '../firebase';
import { onMessage } from 'firebase/messaging';
import { Copy, Bell, BellOff } from 'lucide-react';

export const NotificationHandler: React.FC = () => {
  const [userToken, setUserToken] = useState<string>("Fetching token...");
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(Notification.permission);

  useEffect(() => {
    const fetchToken = async () => {
      const result = await getOrGoToken();
      if (result === "MISSING_VAPID_KEY") {
        setUserToken("VAPID Key not set in environment variables.");
        setPermissionStatus('granted');
      } else if (result === "TOKEN_NOT_FOUND") {
        setUserToken("Token not found. Check service worker registration.");
        setPermissionStatus('granted');
      } else if (result === "PERMISSION_DENIED") {
        setUserToken("Permission denied.");
        setPermissionStatus('denied');
      } else if (result?.startsWith("ERROR:")) {
        setUserToken(result);
        setPermissionStatus('granted');
      } else if (result) {
        setUserToken(result);
        setPermissionStatus('granted');
        const auth = getAuth();
    if (auth.currentUser) {
      setDoc(doc(db, "users", auth.currentUser.uid), {
        fcmToken: result,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
      } else {
        setUserToken("Unknown error fetching token.");
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

      {userToken.includes("VAPID Key not set") && (
        <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-100 flex flex-col gap-1">
          <p className="text-[10px] text-blue-700 font-bold">How to fix:</p>
          <p className="text-[10px] text-blue-600 leading-tight">
            1. Go to Firebase Console &gt; Project Settings &gt; Cloud Messaging.<br/>
            2. Find "Web Push certificates" and copy the "Key pair" string.<br/>
            3. In AI Studio, go to Settings &gt; Environment Variables.<br/>
            4. Add <b>VITE_VAPID_KEY</b> with your key pair value.
          </p>
        </div>
      )}

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
