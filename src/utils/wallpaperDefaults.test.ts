import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ADMIN_EMAIL,
  FALLBACK_WALLPAPER,
  normalizeWallpaperUrl,
  isFirebaseConfigValid,
  canManageGlobalWallpaper,
  resolveActiveWallpaper,
} from './wallpaperDefaults.js';

test('normalizeWallpaperUrl filters invalid legacy URLs and migrates png default', () => {
  assert.equal(normalizeWallpaperUrl('/defaultpreset.png'), '/defaultpreset.jpg');
  assert.equal(normalizeWallpaperUrl('https://images.unsplash.com/photo-123'), null);
  assert.equal(normalizeWallpaperUrl('https://assets.mixkit.co/video.mp4'), null);
  assert.equal(normalizeWallpaperUrl('  /clock-presets-bg.jpg  '), '/clock-presets-bg.jpg');
  assert.equal(normalizeWallpaperUrl('null'), null);
  assert.equal(normalizeWallpaperUrl(''), null);
});

test('isFirebaseConfigValid distinguishes placeholders from real config', () => {
  assert.equal(isFirebaseConfigValid({ apiKey: 'your_api_key', projectId: 'your_project_id' }), false);
  assert.equal(isFirebaseConfigValid({ apiKey: '', projectId: '' }), false);
  assert.equal(isFirebaseConfigValid({ apiKey: 'AIzaSyRealKey123', projectId: 'flowstate-prod' }), true);
});

test('canManageGlobalWallpaper enforces admin email in production and allows local preview', () => {
  assert.equal(canManageGlobalWallpaper({ email: ADMIN_EMAIL }, true), true);
  assert.equal(canManageGlobalWallpaper({ email: 'student@example.com' }, true), false);
  assert.equal(canManageGlobalWallpaper(null, true), false);
  assert.equal(canManageGlobalWallpaper(null, false), true);
});

test('resolveActiveWallpaper serves global default to new visitors and updates dynamically', () => {
  const firstVisit = resolveActiveWallpaper({
    hasPersonalSelection: false,
    globalDefault: '/clock-presets-bg.jpg',
  });
  assert.equal(firstVisit, '/clock-presets-bg.jpg');

  const updatedGlobal = resolveActiveWallpaper({
    hasPersonalSelection: false,
    userWallpaper: '/defaultpreset.jpg',
    globalDefault: 'https://res.cloudinary.com/demo/image/upload/bg.jpg',
  });
  assert.equal(updatedGlobal, 'https://res.cloudinary.com/demo/image/upload/bg.jpg');
});

test('resolveActiveWallpaper respects personal user choice unless forced update is newer', () => {
  const personalKept = resolveActiveWallpaper({
    hasPersonalSelection: true,
    userWallpaper: 'https://res.cloudinary.com/demo/image/upload/my-bg.jpg',
    userSelectedAt: 2000,
    globalDefault: '/clock-presets-bg.jpg',
    globalDefaultUpdatedAt: 1000,
    forceForExisting: false,
  });
  assert.equal(personalKept, 'https://res.cloudinary.com/demo/image/upload/my-bg.jpg');

  const forcedBroadcast = resolveActiveWallpaper({
    hasPersonalSelection: true,
    userWallpaper: 'https://res.cloudinary.com/demo/image/upload/my-bg.jpg',
    userSelectedAt: 1000,
    globalDefault: '/clock-presets-bg.jpg',
    globalDefaultUpdatedAt: 2000,
    forceForExisting: true,
  });
  assert.equal(forcedBroadcast, '/clock-presets-bg.jpg');
});

test('resolveActiveWallpaper falls back safely when no global or user wallpaper is set', () => {
  assert.equal(resolveActiveWallpaper({}), FALLBACK_WALLPAPER);
});
