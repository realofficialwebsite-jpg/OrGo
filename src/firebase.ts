import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, getToken } from "firebase/messaging";
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const messaging = getMessaging(app);

export const getOrGoToken = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const vapidKey = import.meta.env.VITE_VAPID_KEY;
      if (!vapidKey) {
        console.warn('VITE_VAPID_KEY is not set.');
        return null;
      }
      return await getToken(messaging, { vapidKey });
    }
    return null;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};
