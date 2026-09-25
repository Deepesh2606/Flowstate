import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { saveSettings, subscribeSettings, subscribeGlobalCurated, addGlobalCurated, seedGlobalCurated, removeGlobalCurated, setGlobalDefault } from '../firebase/firestore';
import { isVideoUrl } from '../utils/imageUtils';

const WallpaperContext = createContext(null);

export const useWallpaper = () => {
  const ctx = useContext(WallpaperContext);
  if (!ctx) throw new Error('useWallpaper must be used within WallpaperProvider');
  return ctx;
};

const WALLPAPER_STORAGE_KEY = 'fmood_cached_wallpaper';
const CUSTOM_WALLPAPERS_STORAGE_KEY = 'fmood_custom_wallpapers';

const isUserAddedWallpaper = (wp) => {
  if (!wp || !wp.url) return false;
  return true;
};

export const WallpaperProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [customWallpapers, setCustomWallpapers] = useState(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_WALLPAPERS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wallpaper, setWallpaperState] = useState(() => {
    try {
      const cached = localStorage.getItem(WALLPAPER_STORAGE_KEY);
      if (cached) {
        return cached;
      }
      return '/defaultpreset.png';
    } catch {
      return '/defaultpreset.png';
    }
  });

  const [hiddenCurated, setHiddenCurated] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [globalCurated, setGlobalCurated] = useState([]);
  const [globalDefault, setGlobalDefaultState] = useState(null);

  // Preload the active wallpaper immediately on mount so it renders with 0 delay
  useEffect(() => {
    try {
      const currentWp = wallpaper || localStorage.getItem(WALLPAPER_STORAGE_KEY);
      if (currentWp && !isVideoUrl(currentWp)) {
        const img = new window.Image();
        img.src = currentWp;
      }
    } catch {
      // ignore
    }
  }, [wallpaper]);

  // Subscribe to global curated wallpapers and fetch Cloudinary wallpaper immediately on entry
  useEffect(() => {
    const unsubGlobal = subscribeGlobalCurated((curatedList, defaultWallpaperUrl) => {
      const validCurated = (curatedList || []).filter(isUserAddedWallpaper);
      setGlobalCurated(validCurated);

      const validDefault = defaultWallpaperUrl && isUserAddedWallpaper({ url: defaultWallpaperUrl })
        ? defaultWallpaperUrl
        : (validCurated[0]?.url || null);

      if (validDefault) {
        setGlobalDefaultState(validDefault);
        const cached = localStorage.getItem(WALLPAPER_STORAGE_KEY);
        if (!cached) {
          setWallpaperState(validDefault);
          try { localStorage.setItem(WALLPAPER_STORAGE_KEY, validDefault); } catch {}
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
      if (cachedWallpaper) {
        setWallpaperState(cachedWallpaper);
      }

      const cachedCustom = localStorage.getItem(`custom_wallpapers_${currentUser.uid}`);
      if (cachedCustom) {
        const parsed = JSON.parse(cachedCustom);
        setCustomWallpapers(parsed);
      }

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
      }
      if (settings?.customWallpapers) {
        const valid = settings.customWallpapers.filter(url => !url.includes('assets.mixkit.co') && !url.includes('images.unsplash.com'));
        setCustomWallpapers(valid);
        try {
          localStorage.setItem(CUSTOM_WALLPAPERS_STORAGE_KEY, JSON.stringify(valid));
          localStorage.setItem(`custom_wallpapers_${currentUser.uid}`, JSON.stringify(valid));
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
      const updated = [url, ...customWallpapers.filter(w => w !== url)];
      setCustomWallpapers(updated);
      try {
        localStorage.setItem(CUSTOM_WALLPAPERS_STORAGE_KEY, JSON.stringify(updated));
        if (currentUser) {
          localStorage.setItem(`custom_wallpapers_${currentUser.uid}`, JSON.stringify(updated));
        }
      } catch {}
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
      try {
        localStorage.setItem(CUSTOM_WALLPAPERS_STORAGE_KEY, JSON.stringify(updated));
        if (currentUser) {
          localStorage.setItem(`custom_wallpapers_${currentUser.uid}`, JSON.stringify(updated));
        }
      } catch {}
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
        setAsGlobalDefault,
        isVideoUrl
      }}
    >
      {children}
    </WallpaperContext.Provider>
  );
};
