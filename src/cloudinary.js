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

export const uploadWallpaper = (file, onProgress) => {
  return new Promise((resolve, reject) => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      return reject(
        new Error(
          'Cloudinary env vars missing. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to .env.local'
        )
      );
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', 'flowstate/wallpapers');

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          // Reserve 5-90% for network transfer
          const percent = Math.round((event.loaded / event.total) * 90);
          onProgress(Math.max(5, percent));
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (onProgress) onProgress(100);
        try {
          const data = JSON.parse(xhr.responseText);
          const isVideo = data.resource_type === 'video' || (data.format && ['mp4', 'webm', 'mov', 'ogg'].includes(data.format.toLowerCase()));
          if (isVideo) {
            resolve(data.secure_url.replace('/upload/', '/upload/f_auto,q_auto/'));
          } else {
            resolve(data.secure_url.replace('/upload/', '/upload/f_auto,q_auto,w_1600,c_limit/'));
          }
        } catch (err) {
          reject(new Error('Invalid response from Cloudinary'));
        }
      } else {
        let errMessage = 'Cloudinary upload failed';
        try {
          const errData = JSON.parse(xhr.responseText);
          if (errData.error?.message) errMessage = errData.error.message;
        } catch {}
        reject(new Error(errMessage));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(formData);
  });
};
