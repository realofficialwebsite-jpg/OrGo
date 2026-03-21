import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken } from "firebase/messaging";
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const messaging = getMessaging(app);

export const getOrGoToken = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const vapidKey = import.meta.env.VITE_VAPID_KEY;
      if (!vapidKey) {
        console.warn('VITE_VAPID_KEY is not set in environment variables.');
        return "MISSING_VAPID_KEY";
      }
      const token = await getToken(messaging, { vapidKey });
      if (token) return token;
      return "TOKEN_NOT_FOUND";
    }
    return "PERMISSION_DENIED";
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return `ERROR: ${error instanceof Error ? error.message : String(error)}`;
  }
};
