import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC8lehoAk5CaJQ03AaD5NxpE3tGzA2usVM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "estim88-dzid.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "estim88-dzid",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "estim88-dzid.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "227584379356",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:227584379356:web:8e99182ea74b441374e719"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
