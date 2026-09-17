/**
 * Upload an image file to Cloudinary using an unsigned upload preset.
 *
 * Setup:
 *  1. Go to cloudinary.com → Settings → Upload Presets
 *  2. Create a new preset, set "Signing Mode" = Unsigned
 *  3. Copy the preset name + your Cloud Name into .env.local
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const uploadWallpaper = async (file) => {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'Cloudinary env vars missing. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to .env.local'
    );
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'flowstate/wallpapers');

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Cloudinary upload failed');
  }

  const data = await res.json();
  // Return a web-optimized URL: auto format + quality, max 1920px wide
  return data.secure_url.replace('/upload/', '/upload/f_auto,q_auto,w_1920/');
};
