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
  const q = query(ref, orderBy('timestamp', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const sessions = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(sessions, null);
    },
    (err) => {
      console.error('Firestore subscribe error:', err);
      callback([], err); // Pass empty array and error to avoid stuck loading
    }
  );
};

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const addTask = async (uid, text) => {
  const ref = collection(db, 'users', uid, 'tasks');
  const docRef = await addDoc(ref, {
    text,
    completed: false,
    createdAt: serverTimestamp(),
    timestamp: Date.now(),
  });
  return docRef.id;
};

export const updateTask = async (uid, taskId, updates) => {
  const ref = doc(db, 'users', uid, 'tasks', taskId);
  await updateDoc(ref, updates);
};

export const deleteTask = async (uid, taskId) => {
  const ref = doc(db, 'users', uid, 'tasks', taskId);
  await deleteDoc(ref);
};

export const subscribeTasks = (uid, callback) => {
  const ref = collection(db, 'users', uid, 'tasks');
  const q = query(ref, orderBy('timestamp', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const tasks = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(tasks, null);
    },
    (err) => {
      console.error('Firestore tasks error:', err);
      callback([], err);
    }
  );
};
