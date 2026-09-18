import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { saveSettings, subscribeSettings, subscribeGlobalCurated, addGlobalCurated, seedGlobalCurated, removeGlobalCurated, setGlobalDefault } from '../firebase/firestore';

const WallpaperContext = createContext(null);

export const useWallpaper = () => {
  const ctx = useContext(WallpaperContext);
  if (!ctx) throw new Error('useWallpaper must be used within WallpaperProvider');
  return ctx;
};

const WALLPAPER_STORAGE_KEY = 'flowstate_cached_wallpaper';

const DEFAULT_PRESET_WALLPAPERS = [
  { id: 'forest', label: 'Forest', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=80&auto=format,compress' },
  { id: 'aurora', label: 'Aurora', url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1600&q=80&auto=format,compress' },
  { id: 'mountains', label: 'Mountains', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80&auto=format,compress' },
  { id: 'galaxy', label: 'Galaxy', url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1600&q=80&auto=format,compress' },
  { id: 'ocean', label: 'Ocean', url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1600&q=80&auto=format,compress' },
  { id: 'desert', label: 'Desert Dunes', url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1600&q=80&auto=format,compress' },
  { id: 'neon-city', label: 'Neon City', url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1600&q=80&auto=format,compress' },
  { id: 'abstract', label: 'Abstract', url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1600&q=80&auto=format,compress' },
];

export const WallpaperProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [wallpaper, setWallpaperState] = useState(() => {
    try {
      return localStorage.getItem(WALLPAPER_STORAGE_KEY) || "/defaultpreset.png";
    } catch {
      return "/defaultpreset.png";
    }
  });
  const [customWallpapers, setCustomWallpapers] = useState([]);
  const [hiddenCurated, setHiddenCurated] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [globalCurated, setGlobalCurated] = useState(DEFAULT_PRESET_WALLPAPERS);
  const [globalDefault, setGlobalDefaultState] = useState(null);

  // Subscribe to global curated wallpapers immediately
  useEffect(() => {
    const unsubGlobal = subscribeGlobalCurated((curatedList, defaultWallpaperUrl) => {
      if (curatedList && curatedList.length > 0) {
        setGlobalCurated(curatedList);
      } else {
        seedGlobalCurated(DEFAULT_PRESET_WALLPAPERS);
      }
      if (defaultWallpaperUrl) {
        setGlobalDefaultState(defaultWallpaperUrl);
        if (!localStorage.getItem(WALLPAPER_STORAGE_KEY)) {
          setWallpaperState(defaultWallpaperUrl);
        }
      }
    });
    return () => unsubGlobal();
  }, []);

  // Subscribe to current user settings
  useEffect(() => {
    if (!currentUser) return;
    
    // Optimistically load from localStorage to prevent delayed UI changes on login
    try {
      const cachedWallpaper = localStorage.getItem(`wallpaper_${currentUser.uid}`);
      if (cachedWallpaper) setWallpaperState(cachedWallpaper);

      const cachedCustom = localStorage.getItem(`custom_wallpapers_${currentUser.uid}`);
      if (cachedCustom) setCustomWallpapers(JSON.parse(cachedCustom));

      const cachedHidden = localStorage.getItem(`hidden_curated_${currentUser.uid}`);
      if (cachedHidden) setHiddenCurated(JSON.parse(cachedHidden));
    } catch (err) {
      // ignore parse errors
    }

    const unsub = subscribeSettings(currentUser.uid, (settings) => {
      if (settings?.wallpaper) {
        setWallpaperState(settings.wallpaper);
        try {
          localStorage.setItem(WALLPAPER_STORAGE_KEY, settings.wallpaper);
          localStorage.setItem(`wallpaper_${currentUser.uid}`, settings.wallpaper);
        } catch {
          // ignore
        }
      } else if (!localStorage.getItem(WALLPAPER_STORAGE_KEY)) {
        setShowPicker(true);
      }
      if (settings?.customWallpapers) {
        setCustomWallpapers(settings.customWallpapers);
        try {
          localStorage.setItem(`custom_wallpapers_${currentUser.uid}`, JSON.stringify(settings.customWallpapers));
        } catch {}
      }
      if (settings?.hiddenCurated) {
        setHiddenCurated(settings.hiddenCurated);
        try {
          localStorage.setItem(`hidden_curated_${currentUser.uid}`, JSON.stringify(settings.hiddenCurated));
        } catch {}
      }
    });

    return () => unsub();
  }, [currentUser]);

  const setWallpaper = useCallback(
    async (url) => {
      setWallpaperState(url);
      setShowPicker(false);
      try {
        if (url) {
          localStorage.setItem(WALLPAPER_STORAGE_KEY, url);
          if (currentUser) localStorage.setItem(`wallpaper_${currentUser.uid}`, url);
        } else {
          localStorage.removeItem(WALLPAPER_STORAGE_KEY);
          if (currentUser) localStorage.removeItem(`wallpaper_${currentUser.uid}`);
        }
      } catch {
        // ignore
      }
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
        try {
          localStorage.setItem(`custom_wallpapers_${currentUser.uid}`, JSON.stringify(updated));
        } catch {}
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
        try {
          localStorage.setItem(`custom_wallpapers_${currentUser.uid}`, JSON.stringify(updated));
        } catch {}
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
        try {
          localStorage.setItem(`hidden_curated_${currentUser.uid}`, JSON.stringify(updated));
        } catch {}
        await saveSettings(currentUser.uid, { hiddenCurated: updated });
      }
    },
    [currentUser, hiddenCurated]
  );

  const uploadToGlobalCurated = useCallback(
    async (url, label = 'Curated') => {
      if (currentUser?.email === 'deepeshsingh2606@gmail.com') {
        const id = `user-curated-${Date.now()}`;
        const finalLabel = label?.trim() || 'Curated';
        await addGlobalCurated({ id, label: finalLabel, url });
      }
    },
    [currentUser]
  );

  const deleteGlobalCurated = useCallback(
    async (id) => {
      if (currentUser?.email === 'deepeshsingh2606@gmail.com') {
        await removeGlobalCurated(id);
      }
    },
    [currentUser]
  );

  const setAsGlobalDefault = useCallback(
    async (url) => {
      if (currentUser?.email === 'deepeshsingh2606@gmail.com') {
        await setGlobalDefault(url);
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
        globalDefault,
        uploadToGlobalCurated,
        deleteGlobalCurated,
        setAsGlobalDefault
      }}
    >
      {children}
    </WallpaperContext.Provider>
  );
};
