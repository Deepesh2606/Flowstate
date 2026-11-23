/**
 * Checks if a given wallpaper URL is a video file.
 * Supports MP4, WebM, MOV, OGG, and Cloudinary video URLs.
 */
export const isVideoUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return (
    url.match(/\.(mp4|webm|mov|ogg)(\?.*)?$/i) !== null ||
    url.includes('/video/upload/') ||
    url.includes('resource_type=video') ||
    url.startsWith('data:video/')
  );
};

/**
 * Checks whether a single Cloudinary path segment is an existing transformation list
 * (e.g. "f_auto,q_auto:good,w_1600,c_limit") rather than a version ("v1712345678")
 * or a folder name (e.g. "flowstate" or "samples").
 */
const isCloudinaryTransformSegment = (segment) => {
  if (!segment) return false;
  // Version segment like v1712345678 is never a transformation
  if (/^v\d+$/.test(segment)) return false;
  // Cloudinary transformation tokens follow <1-3 lowercase letters>_<value> separated by commas
  const tokens = segment.split(',');
  return tokens.length > 0 && tokens.every((tok) => /^[a-z]{1,3}_[^/]+$/.test(tok));
};

/**
 * Safely injects or replaces Cloudinary transformation segment(s) right after /upload/
 * without stripping version segments (v12345) or folder names (flowstate/wallpapers/...).
 */
export const applyCloudinaryTransform = (url, transformStr, { replaceExisting = false } = {}) => {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('cloudinary.com') || !url.includes('/upload/')) return url;

  const uploadMarker = '/upload/';
  const uploadIdx = url.indexOf(uploadMarker);
  const prefix = url.slice(0, uploadIdx + uploadMarker.length);
  const rest = url.slice(uploadIdx + uploadMarker.length);
  const segments = rest.split('/');

  if (segments.length <= 1) {
    return `${prefix}${transformStr}/${rest}`;
  }

  let firstNonTransformIdx = 0;
  while (
    firstNonTransformIdx < segments.length - 1 &&
    isCloudinaryTransformSegment(segments[firstNonTransformIdx])
  ) {
    firstNonTransformIdx += 1;
  }

  if (firstNonTransformIdx > 0) {
    if (!replaceExisting) {
      return url;
    }
    return `${prefix}${transformStr}/${segments.slice(firstNonTransformIdx).join('/')}`;
  }

  // First segment is a version (v12345) or folder (flowstate) — preserve it intact!
  return `${prefix}${transformStr}/${rest}`;
};

/**
 * Optimizes a wallpaper URL for fast loading and low bandwidth.
 * Safely injects Cloudinary f_auto,q_auto transformations without corrupting folder paths.
 */
export const getOptimizedWallpaperUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  if (url === '/defaultpreset.png') return '/defaultpreset.jpg';

  if (url.includes('cloudinary.com') && url.includes('/upload/')) {
    if (isVideoUrl(url)) {
      if (url.includes('f_auto') || url.includes('q_auto')) return url;
      return applyCloudinaryTransform(url, 'f_auto,q_auto', { replaceExisting: false });
    }
    if (url.includes('f_auto')) return url;
    return applyCloudinaryTransform(url, 'f_auto,q_auto:good,w_1920,c_limit', { replaceExisting: false });
  }
  return url;
};

/**
 * Builds a lightweight 400px thumbnail URL for Cloudinary images and videos
 * while strictly preserving version and folder path segments.
 */
export const getCloudinaryThumbnailUrl = (url, width = 400) => {
  if (!url || typeof url !== 'string') return '/defaultpreset.jpg';
  if (url === '/defaultpreset.png') return '/defaultpreset.jpg';
  if (!url.includes('cloudinary.com') || !url.includes('/upload/')) return url;

  const isVid = isVideoUrl(url);
  let targetUrl = url;
  if (isVid) {
    // Request a first-frame JPEG poster from Cloudinary video delivery (omit g_auto which can 400 on video)
    targetUrl = targetUrl.replace(/\.(mp4|webm|mov|ogg)(\?.*)?$/i, '.jpg$2');
    if (!/\.(jpg|jpeg|png|webp)(\?.*)?$/i.test(targetUrl)) {
      targetUrl = `${targetUrl}.jpg`;
    }
  }

  const transform = isVid
    ? `so_0,f_auto,q_auto:eco,w_${width},c_fill`
    : `f_auto,q_auto:eco,w_${width},c_fill,g_auto`;

  return applyCloudinaryTransform(targetUrl, transform, { replaceExisting: true });
};



const contrastCache = new Map();

/**
 * Analyzes wallpaper luminance and color distribution, specifically weighting the center region
 * where the clock sits, to calculate optimal contrast color and shadows.
 * Results are cached in-memory for instant 0ms retrieval on subsequent setting changes.
 *
 * @param {string} imageUrl - The URL of the wallpaper image.
 * @returns {Promise<{ color: string, shadow: string, isLight: boolean, brightness: number }>}
 */
export const getWallpaperContrast = (imageUrl) => {
  if (!imageUrl || isVideoUrl(imageUrl)) {
    return Promise.resolve({
      color: '#ffffff',
      shadow: '0 2px 14px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 0, 0, 0.4)',
      isLight: false,
      brightness: 40,
    });
  }

  if (contrastCache.has(imageUrl)) {
    return Promise.resolve(contrastCache.get(imageUrl));
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    let resolved = false;
    const safeResolve = (res) => {
      if (!resolved) {
        resolved = true;
        contrastCache.set(imageUrl, res);
        resolve(res);
      }
    };

    // Safety timeout in case image loading hangs
    const timeoutId = setTimeout(() => {
      safeResolve({
        color: '#ffffff',
        shadow: '0 2px 14px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 0, 0, 0.4)',
        isLight: false,
        brightness: 40,
      });
    }, 3500);

    img.onload = () => {
      clearTimeout(timeoutId);
      try {
        const canvas = document.createElement('canvas');
        const w = 120;
        const h = 80;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          throw new Error('Canvas 2D context unavailable');
        }

        ctx.drawImage(img, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;

        // Clock sits in the center/upper-center region of viewport
        const xMin = Math.floor(w * 0.15);
        const xMax = Math.floor(w * 0.85);
        const yMin = Math.floor(h * 0.20);
        const yMax = Math.floor(h * 0.75);

        let centerLumaSum = 0;
        let centerCount = 0;
        let totalLumaSum = 0;
        let totalCount = 0;

        for (let y = 0; y < h; y += 2) {
          for (let x = 0; x < w; x += 2) {
            const idx = (y * w + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            // ITU-R BT.709 perceived luminance
            const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;

            totalLumaSum += luma;
            totalCount++;

            if (x >= xMin && x <= xMax && y >= yMin && y <= yMax) {
              centerLumaSum += luma;
              centerCount++;
            }
          }
        }

        const centerAvgLuma = centerCount > 0 ? centerLumaSum / centerCount : 128;
        const totalAvgLuma = totalCount > 0 ? totalLumaSum / totalCount : 128;

        // Weight center clock area 75%, overall image 25%
        // Account for the 45% dark scrim overlay so mid-tone scenic wallpapers keep crisp white text
        const weightedLuma = centerAvgLuma * 0.75 + totalAvgLuma * 0.25;
        const isLight = weightedLuma > 190;

        let color, shadow;
        if (isLight) {
          // Deep obsidian clock for light backgrounds with clean ambient glow
          color = '#0a0f1d';
          shadow = '0 2px 10px rgba(255, 255, 255, 0.4), 0 0 20px rgba(255, 255, 255, 0.2)';
        } else {
          // Pure crisp white clock with deep drop shadow for dark backgrounds
          color = '#ffffff';
          shadow = '0 2px 14px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 0, 0, 0.4)';
        }

        safeResolve({
          color,
          shadow,
          isLight,
          brightness: Math.round(weightedLuma),
        });
      } catch (e) {
        console.warn('Canvas pixel analysis unavailable, using default contrast fallback:', e);
        safeResolve({
          color: '#ffffff',
          shadow: '0 2px 14px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 0, 0, 0.4)',
          isLight: false,
          brightness: 40,
        });
      }
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      safeResolve({
        color: '#ffffff',
        shadow: '0 2px 14px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 0, 0, 0.4)',
        isLight: false,
        brightness: 40,
      });
    };

    // To prevent browser cache CORS issues (where background-image cached without CORS headers blocks canvas),
    // append a lightweight mode parameter if external HTTP URL
    if (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
      img.src = imageUrl;
    } else {
      const sep = imageUrl.includes('?') ? '&' : '?';
      img.src = `${imageUrl}${sep}cors_mode=1`;
    }
  });
};

/**
 * Backward-compatible helper for average wallpaper brightness
 */
export const getBrightness = async (imageUrl) => {
  const result = await getWallpaperContrast(imageUrl);
  return result ? result.brightness : null;
};

