import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { firebaseApp } from './firebaseClient';
import { WorkoutSession } from '../types';

const db = getFirestore(firebaseApp);
const userHistoryCollection = (uid: string) => collection(db, 'users', uid, 'workoutSessions');

export const fetchWorkoutHistory = async (uid: string): Promise<WorkoutSession[]> => {
  const q = query(userHistoryCollection(uid), orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data() as WorkoutSession;
    return {
      ...data,
      id: doc.id,
    };
  });
};

export const addWorkoutSession = async (uid: string, session: Omit<WorkoutSession, 'id'>): Promise<WorkoutSession> => {
  const docRef = await addDoc(userHistoryCollection(uid), {
    ...session,
    createdAt: serverTimestamp(),
  });
  return { ...session, id: docRef.id };
};

export const deleteWorkoutSession = async (uid: string, sessionId: string): Promise<void> => {
  const ref = doc(db, 'users', uid, 'workoutSessions', sessionId);
  await deleteDoc(ref);
};

export const updateWorkoutSession = async (
  uid: string,
  sessionId: string,
  session: Omit<WorkoutSession, 'id'>
): Promise<void> => {
  const ref = doc(db, 'users', uid, 'workoutSessions', sessionId);
  await updateDoc(ref, { ...session });
};
