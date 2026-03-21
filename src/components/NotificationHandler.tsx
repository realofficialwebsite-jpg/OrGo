import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, messaging, getOrGoToken } from "../firebase"; 
import { getAuth } from "firebase/auth";
import React, { useState, useEffect } from 'react';
import { onMessage } from 'firebase/messaging';

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
      }, { merge: true })
      .then(() => console.log("Token saved!"))
      .catch((err) => console.error("Save error:", err));
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
        console.log(`Notification: ${title}\n${body}`);
      }
    });

    return () => unsubscribe();
  }, []);

  return null;
};
