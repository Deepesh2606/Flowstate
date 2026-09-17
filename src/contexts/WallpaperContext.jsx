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
  const [customWallpapers, setCustomWallpapers] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeSettings(currentUser.uid, (settings) => {
      if (settings?.wallpaper) {
        setWallpaperState(settings.wallpaper);
      }
      if (settings?.customWallpapers) {
        setCustomWallpapers(settings.customWallpapers);
      }
    });
    return unsub;
  }, [currentUser]);

  const setWallpaper = useCallback(
    async (url) => {
      setWallpaperState(url);
      if (currentUser) {
        await saveSettings(currentUser.uid, { wallpaper: url });
      }
    },
    [currentUser]
  );

  const addCustomWallpaper = useCallback(
    async (url) => {
      const updated = [url, ...customWallpapers];
      setCustomWallpapers(updated);
      if (currentUser) {
        await saveSettings(currentUser.uid, { customWallpapers: updated });
      }
    },
    [currentUser, customWallpapers]
  );

  const removeCustomWallpaper = useCallback(
    async (url) => {
      const updated = customWallpapers.filter((w) => w !== url);
      setCustomWallpapers(updated);
      if (currentUser) {
        await saveSettings(currentUser.uid, { customWallpapers: updated });
      }
      // If the removed wallpaper is the active one, revert to default
      if (wallpaper === url) {
        await setWallpaper(null);
      }
    },
    [currentUser, customWallpapers, wallpaper, setWallpaper]
  );

  return (
    <WallpaperContext.Provider 
      value={{ 
        wallpaper, 
        setWallpaper, 
        customWallpapers, 
        addCustomWallpaper, 
        removeCustomWallpaper 
      }}
    >
      {children}
    </WallpaperContext.Provider>
  );
};
