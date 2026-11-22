export const ADMIN_EMAIL = 'deepeshsingh2606@gmail.com';
export const FALLBACK_WALLPAPER = '/defaultpreset.jpg';

export const BUILTIN_WALLPAPERS = [
  {
    id: 'builtin-obsidian-waves',
    label: 'Obsidian Waves',
    url: '/defaultpreset.jpg',
    isBuiltin: true,
  },
  {
    id: 'builtin-pastoral-meadow',
    label: 'Pastoral Meadow',
    url: '/clock-presets-bg.jpg',
    isBuiltin: true,
  },
];

export const normalizeWallpaperUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;
  if (trimmed.includes('assets.mixkit.co') || trimmed.includes('images.unsplash.com')) {
    return null;
  }
  if (trimmed === '/defaultpreset.png') return '/defaultpreset.jpg';
  return trimmed;
};

export const isValidWallpaper = (wp) => {
  if (!wp) return false;
  const url = typeof wp === 'string' ? wp : wp.url;
  return Boolean(normalizeWallpaperUrl(url));
};

export const isFirebaseConfigValid = (config = {}) => {
  const apiKey = String(config?.apiKey || '').trim();
  const projectId = String(config?.projectId || '').trim();
  if (!apiKey || !projectId) return false;
  if (apiKey.toLowerCase().startsWith('your_') || projectId.toLowerCase().startsWith('your_')) {
    return false;
  }
  return true;
};

export const canManageGlobalWallpaper = (currentUser, firebaseConfigured = true) => {
  if (currentUser?.email?.toLowerCase() === ADMIN_EMAIL) return true;
  // In local/sandbox preview where Firebase env vars are not yet connected,
  // allow previewing and testing the global default wallpaper controls locally.
  if (!firebaseConfigured) return true;
  return false;
};

/**
 * Resolves which wallpaper a user should see right now.
 *
 * Priority:
 * 1. If the user explicitly selected a personal wallpaper (and it is valid) AND
 *    either there is no forced broadcast update or they picked it after a forced update,
 *    honor their personal wallpaper.
 * 2. Otherwise, inherit the current globalDefault wallpaper set for everyone.
 * 3. Finally, fall back to the bundled local FALLBACK_WALLPAPER.
 */
export const resolveActiveWallpaper = ({
  userWallpaper = null,
  hasPersonalSelection = false,
  userSelectedAt = 0,
  globalDefault = null,
  globalDefaultUpdatedAt = 0,
  forceForExisting = false,
  fallback = FALLBACK_WALLPAPER,
} = {}) => {
  const cleanGlobal = normalizeWallpaperUrl(globalDefault);
  const cleanUser = normalizeWallpaperUrl(userWallpaper);
  const cleanFallback = normalizeWallpaperUrl(fallback) || FALLBACK_WALLPAPER;

  if (hasPersonalSelection && cleanUser) {
    if (forceForExisting && cleanGlobal && globalDefaultUpdatedAt > userSelectedAt) {
      return cleanGlobal;
    }
    return cleanUser;
  }

  return cleanGlobal || cleanFallback;
};
