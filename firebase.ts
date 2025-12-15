import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore/lite";

const firebaseConfig = {
  apiKey: "AIzaSyCXAoP8JC5JZxNBkvtzCg4tBzUGuYTgCoU",
  authDomain: "orgo-e6ff8.firebaseapp.com",
  projectId: "orgo-e6ff8",
  storageBucket: "orgo-e6ff8.firebasestorage.app",
  messagingSenderId: "787837715214",
  appId: "1:787837715214:web:387108dbaccbd48cea4d5f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);