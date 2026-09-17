import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { saveSettings, subscribeSettings, subscribeGlobalCurated, addGlobalCurated, seedGlobalCurated } from '../firebase/firestore';

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
  const [hiddenCurated, setHiddenCurated] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [globalCurated, setGlobalCurated] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeSettings(currentUser.uid, (settings) => {
      if (settings?.wallpaper) {
        setWallpaperState(settings.wallpaper);
      } else {
        setShowPicker(true);
      }
      if (settings?.customWallpapers) {
        setCustomWallpapers(settings.customWallpapers);
      }
      if (settings?.hiddenCurated) {
        setHiddenCurated(settings.hiddenCurated);
      }
    });

    const unsubGlobal = subscribeGlobalCurated((curatedList) => {
      if (curatedList) {
        setGlobalCurated(curatedList);
      } else {
        // Database is empty, seed it with defaults
        const PRESET_WALLPAPERS = [
          { id: 'forest', label: 'Forest', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=80' },
          { id: 'aurora', label: 'Aurora', url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1600&q=80' },
          { id: 'mountains', label: 'Mountains', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80' },
          { id: 'galaxy', label: 'Galaxy', url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1600&q=80' },
          { id: 'ocean', label: 'Ocean', url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1600&q=80' },
          { id: 'desert', label: 'Desert Dunes', url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1600&q=80' },
          { id: 'neon-city', label: 'Neon City', url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1600&q=80' },
          { id: 'abstract', label: 'Abstract', url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1600&q=80' },
        ];
        seedGlobalCurated(PRESET_WALLPAPERS);
      }
    });

    return () => {
      unsub();
      unsubGlobal();
    };
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

  const hideCuratedWallpaper = useCallback(
    async (id) => {
      const updated = [...hiddenCurated, id];
      setHiddenCurated(updated);
      if (currentUser) {
        await saveSettings(currentUser.uid, { hiddenCurated: updated });
      }
    },
    [currentUser, hiddenCurated]
  );

  const uploadToGlobalCurated = useCallback(
    async (url) => {
      if (currentUser) {
        const id = `user-curated-${Date.now()}`;
        await addGlobalCurated({ id, label: 'User Upload', url });
      }
    },
    [currentUser]
  );

  return (
    <WallpaperContext.Provider 
      value={{ 
        wallpaper, 
        setWallpaper, 
        customWallpapers, 
        addCustomWallpaper, 
        removeCustomWallpaper,
        hiddenCurated,
        hideCuratedWallpaper,
        showPicker,
        setShowPicker,
        globalCurated,
        uploadToGlobalCurated
      }}
    >
      {children}
    </WallpaperContext.Provider>
  );
};
