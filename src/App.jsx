import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { WallpaperProvider } from './contexts/WallpaperContext';
import { ToastProvider } from './components/Toast/ToastProvider';
import { AudioProvider } from './contexts/AudioContext';
import { SpotifyProvider } from './contexts/SpotifyContext';
import ModernMainPage from './components/Layout/ModernMainPage';
import AuthModal from './components/Auth/AuthModal';

const AppInner = () => {
  return (
    <WallpaperProvider>
      <SpotifyProvider>
        <AudioProvider>
          <ModernMainPage />
          <AuthModal />
        </AudioProvider>
      </SpotifyProvider>
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

