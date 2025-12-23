import { initializeApp, getApps } from 'firebase/app';

// Config is safe to ship client-side for Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBt8py29UgFekAsNpad6GO72YRYHscWSeY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'ironlogg.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'ironlogg',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'ironlogg.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '789827780190',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:789827780190:web:6bddaf4d44483de2c4fecf',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-H91C0QE72T',
};

export const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
