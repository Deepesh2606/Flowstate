import test from 'node:test';
import assert from 'node:assert/strict';
import { getOptimizedWallpaperUrl, getCloudinaryThumbnailUrl } from './imageUtils';

test('getOptimizedWallpaperUrl preserves folder paths when no prior transform exists', () => {
  const folderOnly = 'https://res.cloudinary.com/demo/image/upload/flowstate/wallpapers/kyoto.jpg';
  const optimized = getOptimizedWallpaperUrl(folderOnly);
  assert.equal(
    optimized,
    'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto:good,w_1920,c_limit/flowstate/wallpapers/kyoto.jpg'
  );
});

test('getOptimizedWallpaperUrl preserves version segments and folder paths', () => {
  const versioned = 'https://res.cloudinary.com/demo/image/upload/v1712345678/flowstate/wallpapers/alpine.jpg';
  const optimized = getOptimizedWallpaperUrl(versioned);
  assert.equal(
    optimized,
    'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto:good,w_1920,c_limit/v1712345678/flowstate/wallpapers/alpine.jpg'
  );
});

test('getOptimizedWallpaperUrl leaves already optimized Cloudinary URLs intact', () => {
  const already = 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_1600,c_limit/v1712345678/flowstate/wallpapers/rain.jpg';
  assert.equal(getOptimizedWallpaperUrl(already), already);
});

test('getCloudinaryThumbnailUrl preserves folders and versions while replacing existing transforms', () => {
  const withTransform = 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_1600,c_limit/v1712345678/flowstate/wallpapers/rain.jpg';
  assert.equal(
    getCloudinaryThumbnailUrl(withTransform),
    'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto:eco,w_400,c_fill,g_auto/v1712345678/flowstate/wallpapers/rain.jpg'
  );

  const withoutTransform = 'https://res.cloudinary.com/demo/image/upload/samples/landscapes/nature-mountains.jpg';
  assert.equal(
    getCloudinaryThumbnailUrl(withoutTransform),
    'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto:eco,w_400,c_fill,g_auto/samples/landscapes/nature-mountains.jpg'
  );
});

test('getCloudinaryThumbnailUrl generates first-frame JPEG thumbnail for Cloudinary videos without g_auto', () => {
  const videoUrl = 'https://res.cloudinary.com/demo/video/upload/v1700000000/flowstate/wallpapers/rain_loop.mp4';
  assert.equal(
    getCloudinaryThumbnailUrl(videoUrl),
    'https://res.cloudinary.com/demo/video/upload/so_0,f_auto,q_auto:eco,w_400,c_fill/v1700000000/flowstate/wallpapers/rain_loop.jpg'
  );
});

test('getCloudinaryThumbnailUrl cleanly replaces chained leading transform segments', () => {
  const chained = 'https://res.cloudinary.com/demo/image/upload/w_1600,c_limit/f_auto,q_auto/v1700000000/flowstate/wallpapers/dusk.jpg';
  assert.equal(
    getCloudinaryThumbnailUrl(chained),
    'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto:eco,w_400,c_fill,g_auto/v1700000000/flowstate/wallpapers/dusk.jpg'
  );
});

