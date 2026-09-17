import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WallpaperProvider } from './contexts/WallpaperContext';
import { ToastProvider } from './components/Toast/ToastProvider';
import SplashScreen from './components/SplashScreen';
import AppShell from './components/Layout/AppShell';
import PresetsPage from './components/PresetsPage';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

const AppInner = () => {
  const { currentUser, signInWithGoogle } = useAuth();
  const [signingIn, setSigningIn] = useState(false);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      console.error('Sign in failed:', e);
    } finally {
      setSigningIn(false);
    }
  };

  if (!currentUser) {
    return <SplashScreen onSignIn={handleSignIn} loading={signingIn} />;
  }

  return (
    <BrowserRouter>
      <WallpaperProvider>
        <Routes>
          <Route path="/" element={<AppShell />} />
          <Route path="/presets" element={<PresetsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </WallpaperProvider>
    </BrowserRouter>
  );
};

const App = () => (
  <AuthProvider>
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  </AuthProvider>
);

export default App;

