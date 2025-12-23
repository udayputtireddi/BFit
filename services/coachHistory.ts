import {
  collection,
  getDocs,
  addDoc,
  orderBy,
  query,
  serverTimestamp,
  getFirestore,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { firebaseApp } from './firebaseClient';
import { ChatMessage, ChatThread } from '../types';

const db = getFirestore(firebaseApp);

const threadCollection = (uid: string) => collection(db, 'users', uid, 'coachThreads');
const messageCollection = (uid: string, threadId: string) => collection(db, 'users', uid, 'coachThreads', threadId, 'messages');

export const fetchChatThreads = async (uid: string): Promise<ChatThread[]> => {
  const q = query(threadCollection(uid), orderBy('updatedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      title: (data.title as string) || 'New Chat',
      updatedAt: data.updatedAt?.toDate?.().toISOString?.() || '',
      createdAt: data.createdAt?.toDate?.().toISOString?.() || '',
      preview: data.preview as string | undefined,
    };
  });
};

export const createChatThread = async (uid: string, title: string): Promise<ChatThread> => {
  const ref = await addDoc(threadCollection(uid), {
    title: title || 'New Chat',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    preview: '',
  });
  return { id: ref.id, title: title || 'New Chat' };
};

export const fetchThreadMessages = async (uid: string, threadId: string): Promise<ChatMessage[]> => {
  const q = query(messageCollection(uid, threadId), orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      role: data.role as ChatMessage['role'],
      text: data.text as string,
    };
  });
};

export const renameThread = async (uid: string, threadId: string, title: string) => {
  const ref = doc(db, 'users', uid, 'coachThreads', threadId);
  await updateDoc(ref, { title, updatedAt: serverTimestamp() });
};

export const addChatMessages = async (
  uid: string,
  threadId: string,
  messages: ChatMessage[],
  preview?: string
): Promise<void> => {
  const col = messageCollection(uid, threadId);
  await Promise.all(
    messages.map((msg) =>
      addDoc(col, {
        role: msg.role,
        text: msg.text,
        createdAt: serverTimestamp(),
      })
    )
  );
  const threadRef = doc(db, 'users', uid, 'coachThreads', threadId);
  await updateDoc(threadRef, {
    updatedAt: serverTimestamp(),
    preview: preview || messages[messages.length - 1]?.text || '',
  });
};
