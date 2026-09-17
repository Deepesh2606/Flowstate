import React, { useState, useRef } from 'react';
import { useWallpaper } from '../contexts/WallpaperContext';
import { useAuth } from '../contexts/AuthContext';
import { uploadWallpaper } from '../firebase/storage';

const PRESET_WALLPAPERS = [
  {
    id: 'forest',
    label: 'Forest',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=80',
  },
  {
    id: 'aurora',
    label: 'Aurora',
    url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1600&q=80',
  },
  {
    id: 'mountains',
    label: 'Mountains',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80',
  },
  {
    id: 'galaxy',
    label: 'Galaxy',
    url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1600&q=80',
  },
  {
    id: 'ocean',
    label: 'Ocean',
    url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1600&q=80',
  },
  {
    id: 'desert',
    label: 'Desert Dunes',
    url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1600&q=80',
  },
  {
    id: 'neon-city',
    label: 'Neon City',
    url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1600&q=80',
  },
  {
    id: 'abstract',
    label: 'Abstract',
    url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1600&q=80',
  },
];

const WallpaperPicker = () => {
  const { wallpaper, setWallpaper, setShowPicker } = useWallpaper();
  const { currentUser } = useAuth();
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
    setUploading(true);
    setUploadError('');
    try {
      const url = await uploadWallpaper(currentUser.uid, file);
      await setWallpaper(url);
    } catch (err) {
      console.error(err);
      setUploadError('Upload failed. Check Firebase Storage rules.');
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
            <div className="wallpaper-grid">
              {PRESET_WALLPAPERS.map((wp) => (
                <button
                  key={wp.id}
                  id={`wallpaper-${wp.id}`}
                  className={`wallpaper-thumb ${wallpaper === wp.url ? 'selected' : ''}`}
                  style={{ backgroundImage: `url(${wp.url})` }}
                  onClick={() => handlePresetSelect(wp.url)}
                  title={wp.label}
                  aria-label={`Select ${wp.label} wallpaper`}
                >
                  {wallpaper === wp.url && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(0,200,150,0.3)',
                      borderRadius: 'inherit',
                    }}>
                      <span style={{ fontSize: '24px' }}>✓</span>
                    </div>
                  )}
                </button>
              ))}
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
                <div className="upload-icon">🖼️</div>
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
