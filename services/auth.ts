import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { firebaseApp } from './firebaseClient';

const auth = getAuth(firebaseApp);
// Ensure sessions persist across reloads
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error('Auth persistence error:', err);
});

export const watchAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const login = async (email: string, password: string) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
};

export const register = async (email: string, password: string) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
};

export const logout = () => signOut(auth);

export { auth };
