import React, { useState, useRef } from 'react';
import { useWallpaper } from '../contexts/WallpaperContext';
import { uploadWallpaper } from '../cloudinary';
import { IconImage, IconCheck, IconTrash } from './Icons';

const PRESET_WALLPAPERS = [
  { id: 'forest', label: 'Forest', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=80' },
  { id: 'aurora', label: 'Aurora', url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1600&q=80' },
  { id: 'mountains', label: 'Mountains', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80' },
  { id: 'galaxy', label: 'Galaxy', url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1600&q=80' },
  { id: 'ocean', label: 'Ocean', url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1600&q=80' },
  { id: 'desert', label: 'Desert Dunes', url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1600&q=80' },
  { id: 'neon-city', label: 'Neon City', url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1600&q=80' },
  { id: 'abstract', label: 'Abstract', url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1600&q=80' },
];

const WallpaperPicker = () => {
  const { 
    wallpaper, 
    setWallpaper, 
    setShowPicker, 
    customWallpapers, 
    addCustomWallpaper, 
    removeCustomWallpaper,
    hiddenCurated,
    hideCuratedWallpaper
  } = useWallpaper();
  const [activeTab, setActiveTab] = useState('presets');
  const [uploading, setUploading] = useState(false);
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
      await addCustomWallpaper(url);
      await setWallpaper(url);
      setActiveTab('presets');
    } catch (err) {
      console.error(err);
      setUploadError(err.message || 'Upload failed. Check Cloudinary config.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" role="dialog" aria-label="Wallpaper Picker">
        <div className="modal-header">
          <h2 className="modal-title">Choose Wallpaper</h2>
          {wallpaper && (
            <button
              className="drawer-close"
              onClick={() => setShowPicker(false)}
              aria-label="Close wallpaper picker"
            >
              ✕
            </button>
          )}
        </div>

        <div className="modal-tabs" role="tablist">
          <button
            className={`modal-tab ${activeTab === 'presets' ? 'active' : ''}`}
            onClick={() => setActiveTab('presets')}
            role="tab"
            aria-selected={activeTab === 'presets'}
            id="tab-presets"
          >
            Presets
          </button>
          <button
            className={`modal-tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
            role="tab"
            aria-selected={activeTab === 'upload'}
            id="tab-upload"
          >
            Upload
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'presets' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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

              <div>
                <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px', letterSpacing: '0.05em' }}>Curated</h3>
                <div className="wallpaper-grid">
                  {PRESET_WALLPAPERS.filter(wp => !hiddenCurated?.includes(wp.id)).map((wp) => (
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
                      <button
                        onClick={(e) => { e.stopPropagation(); hideCuratedWallpaper(wp.id); }}
                        style={{
                          position: 'absolute', top: '6px', right: '6px',
                          background: 'rgba(0,0,0,0.65)', color: '#ff5050',
                          borderRadius: '50%', width: '26px', height: '26px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: '1px solid rgba(255,255,255,0.15)', zIndex: 10
                        }}
                        aria-label="Delete curated preset"
                        title="Hide curated preset"
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WallpaperPicker;
