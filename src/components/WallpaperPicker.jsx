import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWallpaper } from '../contexts/WallpaperContext';
import { uploadWallpaper } from '../cloudinary';
import { IconImage, IconCheck, IconTrash } from './Icons';

// Presets are now fetched from Firebase via globalCurated

const WallpaperPicker = () => {
  const { 
    wallpaper, 
    setWallpaper, 
    setShowPicker, 
    customWallpapers, 
    addCustomWallpaper, 
    removeCustomWallpaper,
    hiddenCurated,
    hideCuratedWallpaper,
    globalCurated,
    uploadToGlobalCurated,
    deleteGlobalCurated
  } = useWallpaper();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('presets');
  const [uploading, setUploading] = useState(false);
  const [uploadAsCurated, setUploadAsCurated] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef(null);

  const handlePresetSelect = async (url) => {
    await setWallpaper(url);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File too large. Max 10MB.');
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      const url = await uploadWallpaper(file);
      if (uploadAsCurated) {
        await uploadToGlobalCurated(url);
      } else {
        await addCustomWallpaper(url);
      }
      await setWallpaper(url);
      setActiveTab('presets');
      setUploadAsCurated(false);
    } catch (err) {
      console.error(err);
      setUploadError(err.message || 'Upload failed. Check Cloudinary config.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="drawer-overlay" onClick={() => setShowPicker(false)} aria-hidden="true" />
      <aside className="drawer wallpaper-drawer" role="dialog" aria-label="Wallpaper Gallery" aria-modal="true">
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconImage size={20} color="var(--accent)" />
            <h2 className="drawer-title" style={{ fontSize: '1.25rem' }}>Wallpapers</h2>
          </div>
          <button
            className="drawer-close"
            onClick={() => setShowPicker(false)}
            aria-label="Close wallpaper gallery"
          >
            ✕
          </button>
        </div>

        <div className="wallpaper-nav-tabs" role="tablist">
          <button
            className={`wallpaper-nav-tab ${activeTab === 'presets' ? 'active' : ''}`}
            onClick={() => setActiveTab('presets')}
            role="tab"
            aria-selected={activeTab === 'presets'}
            id="tab-presets"
          >
            Presets
          </button>
          <button
            className={`wallpaper-nav-tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
            role="tab"
            aria-selected={activeTab === 'upload'}
            id="tab-upload"
          >
            Upload
          </button>
        </div>

        <div className="wallpaper-drawer-body">
          {activeTab === 'presets' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {customWallpapers && customWallpapers.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px', letterSpacing: '0.05em' }}>My Uploads</h3>
                  <div className="wallpaper-grid">
                    {customWallpapers.map((url, i) => (
                      <div key={`custom-${i}`} style={{ position: 'relative' }}>
                        <button
                          className={`wallpaper-thumb ${wallpaper === url ? 'selected' : ''}`}
                          style={{ backgroundImage: `url(${url})`, width: '100%' }}
                          onClick={() => handlePresetSelect(url)}
                          aria-label={`Select custom wallpaper ${i+1}`}
                        >
                          {wallpaper === url && (
                            <div style={{
                              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: 'var(--accent-glow)', borderRadius: 'inherit', backdropFilter: 'blur(4px)'
                            }}>
                              <IconCheck size={28} color="#081226" />
                            </div>
                          )}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeCustomWallpaper(url); }}
                          style={{
                            position: 'absolute', top: '6px', right: '6px',
                            background: 'rgba(0,0,0,0.65)', color: '#ff5050',
                            borderRadius: '50%', width: '26px', height: '26px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px solid rgba(255,255,255,0.15)', zIndex: 10
                          }}
                          aria-label="Delete custom wallpaper"
                          title="Delete preset"
                        >
                          <IconTrash size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {globalCurated && globalCurated.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px', letterSpacing: '0.05em' }}>Curated Presets</h3>
                  <div className="wallpaper-grid">
                    {globalCurated.filter(wp => !hiddenCurated?.includes(wp.id)).map((wp) => (
                    <div key={wp.id} style={{ position: 'relative' }}>
                      <button
                        className={`wallpaper-thumb ${wallpaper === wp.url ? 'selected' : ''}`}
                        style={{ backgroundImage: `url(${wp.url})`, width: '100%' }}
                        onClick={() => handlePresetSelect(wp.url)}
                        title={wp.label}
                        aria-label={`Select ${wp.label} wallpaper`}
                      >
                        {wallpaper === wp.url && (
                          <div style={{
                            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'var(--accent-glow)', borderRadius: 'inherit', backdropFilter: 'blur(4px)'
                          }}>
                            <IconCheck size={28} color="#081226" />
                          </div>
                        )}
                      </button>
                      {currentUser?.email === 'deepeshsingh2606@gmail.com' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteGlobalCurated(wp.id); }}
                          style={{
                            position: 'absolute', top: '6px', right: '6px',
                            background: 'rgba(0,0,0,0.65)', color: '#ff5050',
                            borderRadius: '50%', width: '26px', height: '26px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px solid rgba(255,255,255,0.15)', zIndex: 10
                          }}
                          aria-label="Delete curated preset completely"
                          title="Delete preset for everyone"
                        >
                          <IconTrash size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div>
              <div
                className="upload-area"
                onClick={() => fileRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
              >
                <div className="upload-icon" style={{ marginBottom: '8px' }}>
                  <IconImage size={32} color="var(--text-secondary)" />
                </div>
                <div className="upload-text">
                  {uploading ? 'Uploading…' : 'Click to upload your image'}
                </div>
                <div className="upload-sub">JPG, PNG, WEBP — max 10MB</div>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
                id="wallpaper-file-input"
              />
              {uploadError && (
                <p style={{ color: '#ff5050', fontSize: '13px', marginTop: '12px', textAlign: 'center' }}>
                  {uploadError}
                </p>
              )}
              
              <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <input 
                  type="checkbox" 
                  id="curated-checkbox" 
                  checked={uploadAsCurated}
                  onChange={(e) => setUploadAsCurated(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--accent-glow)' }}
                />
                <label htmlFor="curated-checkbox" style={{ fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  Upload as a Global Curated Preset (visible to all users)
                </label>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default WallpaperPicker;
