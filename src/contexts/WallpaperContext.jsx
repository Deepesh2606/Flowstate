import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { isFirebaseConfigured } from '../firebase/config';
import {
  saveSettings,
  subscribeSettings,
  subscribeGlobalCurated,
  addGlobalCurated,
  removeGlobalCurated,
  setGlobalDefault,
} from '../firebase/firestore';
import { isVideoUrl, getOptimizedWallpaperUrl } from '../utils/imageUtils';
import {
  FALLBACK_WALLPAPER,
  BUILTIN_WALLPAPERS,
  normalizeWallpaperUrl,
  isValidWallpaper,
  canManageGlobalWallpaper,
  resolveActiveWallpaper,
} from '../utils/wallpaperDefaults';

const WallpaperContext = createContext(null);

export const useWallpaper = () => {
  const ctx = useContext(WallpaperContext);
  if (!ctx) throw new Error('useWallpaper must be used within WallpaperProvider');
  return ctx;
};

const WALLPAPER_STORAGE_KEY = 'flowstate_cached_wallpaper';
const PERSONAL_SELECTED_KEY = 'flowstate_wallpaper_personal_selected';
const PERSONAL_SELECTED_AT_KEY = 'flowstate_wallpaper_personal_selected_at';
const GLOBAL_DEFAULT_STORAGE_KEY = 'flowstate_global_default_wallpaper';
const GLOBAL_DEFAULT_META_KEY = 'flowstate_global_default_meta';
const CUSTOM_WALLPAPERS_STORAGE_KEY = 'flowstate_custom_wallpapers';

const readJsonStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const WallpaperProvider = ({ children }) => {
  const { currentUser } = useAuth();

  const [customWallpapers, setCustomWallpapers] = useState(() =>
    readJsonStorage(CUSTOM_WALLPAPERS_STORAGE_KEY, [])
  );

  const [globalDefault, setGlobalDefaultState] = useState(() => {
    try {
      return normalizeWallpaperUrl(localStorage.getItem(GLOBAL_DEFAULT_STORAGE_KEY)) || FALLBACK_WALLPAPER;
    } catch {
      return FALLBACK_WALLPAPER;
    }
  });

  const [globalDefaultMeta, setGlobalDefaultMeta] = useState(() =>
    readJsonStorage(GLOBAL_DEFAULT_META_KEY, { updatedAt: 0, forceForExisting: false })
  );

  const [personalWallpaper, setPersonalWallpaper] = useState(() => {
    try {
      const isPersonal = localStorage.getItem(PERSONAL_SELECTED_KEY) === 'true';
      if (!isPersonal) return null;
      return normalizeWallpaperUrl(localStorage.getItem(WALLPAPER_STORAGE_KEY));
    } catch {
      return null;
    }
  });

  const [personalSelectedAt, setPersonalSelectedAt] = useState(() => {
    try {
      return Number(localStorage.getItem(PERSONAL_SELECTED_AT_KEY)) || 0;
    } catch {
      return 0;
    }
  });

  const [hiddenCurated, setHiddenCurated] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [globalCurated, setGlobalCurated] = useState([]);

  const canSetGlobalDefault = useMemo(
    () => canManageGlobalWallpaper(currentUser, isFirebaseConfigured),
    [currentUser]
  );

  const wallpaper = useMemo(
    () =>
      resolveActiveWallpaper({
        userWallpaper: personalWallpaper,
        hasPersonalSelection: Boolean(personalWallpaper),
        userSelectedAt: personalSelectedAt,
        globalDefault,
        globalDefaultUpdatedAt: globalDefaultMeta?.updatedAt || 0,
        forceForExisting: Boolean(globalDefaultMeta?.forceForExisting),
        fallback: FALLBACK_WALLPAPER,
      }),
    [personalWallpaper, personalSelectedAt, globalDefault, globalDefaultMeta]
  );

  const isUsingSiteDefault = !personalWallpaper || wallpaper === globalDefault;

  // Preload the active wallpaper immediately on mount/change so it renders cleanly
  useEffect(() => {
    try {
      const optUrl = getOptimizedWallpaperUrl(wallpaper || FALLBACK_WALLPAPER);
      if (optUrl && !isVideoUrl(optUrl)) {
        const img = new window.Image();
        img.src = optUrl;
      }
    } catch {
      // ignore
    }
  }, [wallpaper]);

  // Subscribe to global curated wallpapers and site-wide default wallpaper from Firestore
  useEffect(() => {
    if (!isFirebaseConfigured) return undefined;

    const unsubGlobal = subscribeGlobalCurated((curatedList, defaultWallpaperUrl, meta) => {
      const validCurated = (curatedList || []).filter(isValidWallpaper);
      setGlobalCurated(validCurated);

      const cleanDefault = normalizeWallpaperUrl(defaultWallpaperUrl);
      if (cleanDefault) {
        setGlobalDefaultState(cleanDefault);
        const nextMeta = {
          updatedAt: meta?.updatedAt || 0,
          forceForExisting: Boolean(meta?.forceForExisting),
        };
        setGlobalDefaultMeta(nextMeta);
        try {
          localStorage.setItem(GLOBAL_DEFAULT_STORAGE_KEY, cleanDefault);
          localStorage.setItem(GLOBAL_DEFAULT_META_KEY, JSON.stringify(nextMeta));
          if (localStorage.getItem(PERSONAL_SELECTED_KEY) !== 'true') {
            localStorage.setItem(WALLPAPER_STORAGE_KEY, cleanDefault);
          }
        } catch {
          // ignore
        }
      }

      if (typeof window !== 'undefined') {
        const preloadIdle = () => {
          validCurated.slice(0, 10).forEach((wp) => {
            if (wp.url && !isVideoUrl(wp.url)) {
              const img = new Image();
              img.src = getOptimizedWallpaperUrl(wp.url);
            }
          });
        };
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(preloadIdle);
        } else {
          setTimeout(preloadIdle, 1000);
        }
      }
    });

    return () => unsubGlobal();
  }, []);

  // Subscribe to current user personal settings
  useEffect(() => {
    if (!currentUser) return undefined;

    try {
      const cachedWallpaper = normalizeWallpaperUrl(localStorage.getItem(`wallpaper_${currentUser.uid}`));
      if (cachedWallpaper) {
        setPersonalWallpaper(cachedWallpaper);
      }
      const cachedCustom = readJsonStorage(`custom_wallpapers_${currentUser.uid}`, null);
      if (cachedCustom) setCustomWallpapers(cachedCustom);

      const cachedHidden = readJsonStorage(`hidden_curated_${currentUser.uid}`, null);
      if (cachedHidden) setHiddenCurated(cachedHidden);
    } catch {
      // ignore
    }

    if (!isFirebaseConfigured) return undefined;

    const unsub = subscribeSettings(currentUser.uid, (settings) => {
      if (settings && Object.prototype.hasOwnProperty.call(settings, 'wallpaper')) {
        const cleanUserWp = normalizeWallpaperUrl(settings.wallpaper);
        setPersonalWallpaper(cleanUserWp);
        if (settings.wallpaperSelectedAt) {
          setPersonalSelectedAt(Number(settings.wallpaperSelectedAt) || 0);
        }
        try {
          if (cleanUserWp) {
            localStorage.setItem(WALLPAPER_STORAGE_KEY, cleanUserWp);
            localStorage.setItem(PERSONAL_SELECTED_KEY, 'true');
            localStorage.setItem(`wallpaper_${currentUser.uid}`, cleanUserWp);
          } else {
            localStorage.removeItem(PERSONAL_SELECTED_KEY);
            localStorage.removeItem(`wallpaper_${currentUser.uid}`);
          }
        } catch {
          // ignore
        }
      }

      if (settings?.customWallpapers) {
        const valid = settings.customWallpapers.map(normalizeWallpaperUrl).filter(Boolean);
        setCustomWallpapers(valid);
        try {
          localStorage.setItem(CUSTOM_WALLPAPERS_STORAGE_KEY, JSON.stringify(valid));
          localStorage.setItem(`custom_wallpapers_${currentUser.uid}`, JSON.stringify(valid));
        } catch {
          // ignore
        }
      }

      if (settings?.hiddenCurated) {
        setHiddenCurated(settings.hiddenCurated);
        try {
          localStorage.setItem(`hidden_curated_${currentUser.uid}`, JSON.stringify(settings.hiddenCurated));
        } catch {
          // ignore
        }
      }
    });

    return () => unsub();
  }, [currentUser]);

  const setWallpaper = useCallback(
    async (url) => {
      const clean = normalizeWallpaperUrl(url);
      const now = Date.now();
      setPersonalWallpaper(clean);
      setPersonalSelectedAt(clean ? now : 0);
      setShowPicker(false);

      try {
        if (clean) {
          localStorage.setItem(WALLPAPER_STORAGE_KEY, clean);
          localStorage.setItem(PERSONAL_SELECTED_KEY, 'true');
          localStorage.setItem(PERSONAL_SELECTED_AT_KEY, String(now));
          if (currentUser) localStorage.setItem(`wallpaper_${currentUser.uid}`, clean);
        } else {
          localStorage.removeItem(PERSONAL_SELECTED_KEY);
          localStorage.removeItem(PERSONAL_SELECTED_AT_KEY);
          localStorage.setItem(WALLPAPER_STORAGE_KEY, globalDefault || FALLBACK_WALLPAPER);
          if (currentUser) localStorage.removeItem(`wallpaper_${currentUser.uid}`);
        }
      } catch {
        // ignore
      }

      if (currentUser && isFirebaseConfigured) {
        await saveSettings(currentUser.uid, {
          wallpaper: clean,
          wallpaperSelectedAt: clean ? now : 0,
        });
      }
    },
    [currentUser, globalDefault]
  );

  const resetToGlobalDefault = useCallback(async () => {
    await setWallpaper(null);
  }, [setWallpaper]);

  const addCustomWallpaper = useCallback(
    async (url) => {
      const clean = normalizeWallpaperUrl(url);
      if (!clean) return;
      const updated = [clean, ...customWallpapers.filter((w) => w !== clean)];
      setCustomWallpapers(updated);
      try {
        localStorage.setItem(CUSTOM_WALLPAPERS_STORAGE_KEY, JSON.stringify(updated));
        if (currentUser) {
          localStorage.setItem(`custom_wallpapers_${currentUser.uid}`, JSON.stringify(updated));
        }
      } catch {
        // ignore
      }
      if (currentUser && isFirebaseConfigured) {
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
      } catch {
        // ignore
      }
      if (currentUser && isFirebaseConfigured) {
        await saveSettings(currentUser.uid, { customWallpapers: updated });
      }
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
        } catch {
          // ignore
        }
        if (isFirebaseConfigured) {
          await saveSettings(currentUser.uid, { hiddenCurated: updated });
        }
      }
    },
    [currentUser, hiddenCurated]
  );

  const uploadToGlobalCurated = useCallback(
    async (url, label = 'Curated') => {
      if (!canSetGlobalDefault) return;
      const clean = normalizeWallpaperUrl(url);
      if (!clean) return;
      const id = `user-curated-${Date.now()}`;
      const finalLabel = label?.trim() || 'Curated';
      if (isFirebaseConfigured) {
        await addGlobalCurated({ id, label: finalLabel, url: clean });
      } else {
        setGlobalCurated((prev) => [{ id, label: finalLabel, url: clean }, ...prev]);
      }
    },
    [canSetGlobalDefault]
  );

  const deleteGlobalCurated = useCallback(
    async (id) => {
      if (!canSetGlobalDefault) return;
      if (isFirebaseConfigured) {
        await removeGlobalCurated(id);
      } else {
        setGlobalCurated((prev) => prev.filter((item) => item.id !== id));
      }
    },
    [canSetGlobalDefault]
  );

  const setAsGlobalDefault = useCallback(
    async (url, options = {}) => {
      if (!canSetGlobalDefault) {
        throw new Error('Only the site admin can set the default wallpaper for everyone.');
      }
      const clean = normalizeWallpaperUrl(url);
      if (!clean) {
        throw new Error('Please choose a valid wallpaper URL.');
      }

      const now = Date.now();
      const nextMeta = {
        updatedAt: now,
        forceForExisting: Boolean(options.forceForExisting),
      };

      // Update immediately for instant feedback
      setGlobalDefaultState(clean);
      setGlobalDefaultMeta(nextMeta);
      // Also switch the admin's own view to follow the new site default
      setPersonalWallpaper(null);
      setPersonalSelectedAt(0);

      try {
        localStorage.setItem(GLOBAL_DEFAULT_STORAGE_KEY, clean);
        localStorage.setItem(GLOBAL_DEFAULT_META_KEY, JSON.stringify(nextMeta));
        localStorage.setItem(WALLPAPER_STORAGE_KEY, clean);
        localStorage.removeItem(PERSONAL_SELECTED_KEY);
        localStorage.removeItem(PERSONAL_SELECTED_AT_KEY);
        if (currentUser) localStorage.removeItem(`wallpaper_${currentUser.uid}`);
      } catch {
        // ignore
      }

      if (isFirebaseConfigured) {
        await setGlobalDefault(clean, options);
        if (currentUser) {
          await saveSettings(currentUser.uid, { wallpaper: null, wallpaperSelectedAt: 0 });
        }
      }
    },
    [canSetGlobalDefault, currentUser]
  );

  return (
    <WallpaperContext.Provider
      value={{
        wallpaper,
        setWallpaper,
        resetToGlobalDefault,
        isUsingSiteDefault,
        builtinWallpapers: BUILTIN_WALLPAPERS,
        customWallpapers,
        addCustomWallpaper,
        removeCustomWallpaper,
        hiddenCurated,
        hideCuratedWallpaper,
        showPicker,
        setShowPicker,
        globalCurated,
        globalDefault,
        globalDefaultMeta,
        canSetGlobalDefault,
        isFirebaseConfigured,
        uploadToGlobalCurated,
        deleteGlobalCurated,
        setAsGlobalDefault,
        isVideoUrl,
      }}
    >
      {children}
    </WallpaperContext.Provider>
  );
};
