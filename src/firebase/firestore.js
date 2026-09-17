import {
  doc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

// ─── Settings ────────────────────────────────────────────────────────────────

export const getSettings = async (uid) => {
  const ref = doc(db, 'users', uid, 'data', 'settings');
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
};

export const saveSettings = async (uid, settings) => {
  const ref = doc(db, 'users', uid, 'data', 'settings');
  await setDoc(ref, settings, { merge: true });
};

export const subscribeSettings = (uid, callback) => {
  const ref = doc(db, 'users', uid, 'data', 'settings');
  return onSnapshot(ref, (snap) => {
    callback(snap.exists() ? snap.data() : null);
  });
};

// ─── Sessions ─────────────────────────────────────────────────────────────────

export const addSession = async (uid, session) => {
  const ref = collection(db, 'users', uid, 'sessions');
  const docRef = await addDoc(ref, {
    ...session,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const deleteSession = async (uid, sessionId) => {
  const ref = doc(db, 'users', uid, 'sessions', sessionId);
  await deleteDoc(ref);
};

export const subscribeSessions = (uid, callback) => {
  const ref = collection(db, 'users', uid, 'sessions');
  const q = query(ref, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const sessions = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(sessions);
  });
};
