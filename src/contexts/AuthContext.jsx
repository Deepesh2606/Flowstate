import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

const CACHED_USER_KEY = 'fmood_cached_user';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHED_USER_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  // If we already have a cached user, don't block render with loading
  const [loading, setLoading] = useState(() => {
    try {
      return !localStorage.getItem(CACHED_USER_KEY);
    } catch {
      return true;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalReason, setAuthModalReason] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userData = {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        };
        setCurrentUser(user);
        try {
          localStorage.setItem(CACHED_USER_KEY, JSON.stringify(userData));
        } catch {
          // ignore
        }
      } else {
        setCurrentUser(null);
        try {
          localStorage.removeItem(CACHED_USER_KEY);
        } catch {
          // ignore
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signInWithGoogle = async () => {
    setSigningIn(true);
    try {
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, googleProvider);
      setIsAuthModalOpen(false);
      setAuthModalReason('');
    } catch (err) {
      console.error('Google sign in error:', err);
      throw err;
    } finally {
      setSigningIn(false);
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const openAuthModal = (reason = '') => {
    setAuthModalReason(reason);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthModalReason('');
  };

  const value = {
    currentUser,
    signInWithGoogle,
    signOut,
    loading,
    signingIn,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
    authModalReason,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
