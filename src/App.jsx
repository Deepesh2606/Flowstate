import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { WallpaperProvider } from './contexts/WallpaperContext';
import { ToastProvider } from './components/Toast/ToastProvider';
import { AudioProvider } from './contexts/AudioContext';
import AppShell from './components/Layout/AppShell';
import AuthModal from './components/Auth/AuthModal';

const AppInner = () => {
  return (
    <WallpaperProvider>
      <AudioProvider>
        <AppShell />
        <AuthModal />
      </AudioProvider>
    </WallpaperProvider>
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

