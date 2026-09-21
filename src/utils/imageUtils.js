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
 * Analyzes wallpaper luminance and color distribution, specifically weighting the center region
 * where the clock sits, to calculate optimal contrast color and shadows.
 *
 * @param {string} imageUrl - The URL of the wallpaper image.
 * @returns {Promise<{ color: string, shadow: string, isLight: boolean, brightness: number }>}
 */
export const getWallpaperContrast = (imageUrl) => {
  return new Promise((resolve) => {
    if (!imageUrl || isVideoUrl(imageUrl)) {
      resolve({
        color: '#ffffff',
        shadow: '0 2px 24px rgba(0, 0, 0, 0.85), 0 0 50px rgba(0, 0, 0, 0.6)',
        isLight: false,
        brightness: 40,
      });
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    let resolved = false;
    const safeResolve = (res) => {
      if (!resolved) {
        resolved = true;
        resolve(res);
      }
    };

    // Safety timeout in case image loading hangs
    const timeoutId = setTimeout(() => {
      safeResolve({
        color: '#ffffff',
        shadow: '0 2px 24px rgba(0, 0, 0, 0.85), 0 0 50px rgba(0, 0, 0, 0.6)',
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
        const weightedLuma = centerAvgLuma * 0.75 + totalAvgLuma * 0.25;
        const isLight = weightedLuma > 138;

        let color, shadow;
        if (isLight) {
          // Deep obsidian clock for light backgrounds with clean ambient glow
          color = '#0a0f1d';
          shadow = '0 2px 20px rgba(255, 255, 255, 0.6), 0 0 40px rgba(255, 255, 255, 0.4)';
        } else {
          // Pure crisp white clock with deep drop shadow for dark backgrounds
          color = '#ffffff';
          shadow = '0 2px 24px rgba(0, 0, 0, 0.85), 0 0 50px rgba(0, 0, 0, 0.6)';
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
          shadow: '0 2px 24px rgba(0, 0, 0, 0.85), 0 0 50px rgba(0, 0, 0, 0.6)',
          isLight: false,
          brightness: 40,
        });
      }
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      safeResolve({
        color: '#ffffff',
        shadow: '0 2px 24px rgba(0, 0, 0, 0.85), 0 0 50px rgba(0, 0, 0, 0.6)',
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

