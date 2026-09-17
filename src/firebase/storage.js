import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config';

/**
 * Upload user wallpaper to Firebase Storage.
 * Path: wallpapers/{uid}/background
 * Returns the public download URL.
 */
export const uploadWallpaper = async (uid, file) => {
  const storageRef = ref(storage, `wallpapers/${uid}/background`);
  const snapshot = await uploadBytes(storageRef, file);
  const url = await getDownloadURL(snapshot.ref);
  return url;
};
