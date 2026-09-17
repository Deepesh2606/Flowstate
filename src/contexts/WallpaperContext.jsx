import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { saveSettings, subscribeSettings } from '../firebase/firestore';

const WallpaperContext = createContext(null);

export const useWallpaper = () => {
  const ctx = useContext(WallpaperContext);
  if (!ctx) throw new Error('useWallpaper must be used within WallpaperProvider');
  return ctx;
};

export const WallpaperProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [wallpaper, setWallpaperState] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeSettings(currentUser.uid, (settings) => {
      if (settings?.wallpaper) {
        setWallpaperState(settings.wallpaper);
      } else {
        // First load — show picker
        setShowPicker(true);
      }
    });
    return unsub;
  }, [currentUser]);

  const setWallpaper = useCallback(
    async (url) => {
      setWallpaperState(url);
      setShowPicker(false);
      if (currentUser) {
        await saveSettings(currentUser.uid, { wallpaper: url });
      }
    },
    [currentUser]
  );

  return (
    <WallpaperContext.Provider value={{ wallpaper, setWallpaper, showPicker, setShowPicker }}>
      {children}
    </WallpaperContext.Provider>
  );
};
