import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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

const PresetsPage = () => {
  const navigate = useNavigate();
  const { 
    wallpaper, 
    setWallpaper, 
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
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', height: '100%', overflowY: 'auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
        <button 
          onClick={() => navigate('/')} 
          style={{
            background: 'var(--glass-bg-strong)',
            border: '1px solid var(--glass-border)',
            padding: '10px 20px',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--text-primary)',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backdropFilter: 'blur(10px)',
            cursor: 'pointer'
          }}
        >
          ← Back to Workspace
        </button>
        <h1 style={{ flex: 1, textAlign: 'center', margin: 0, fontSize: '28px', color: '#fff' }}>
          Wallpaper Presets
        </h1>
        <div style={{ width: '150px' }} /> {/* Spacer for centering */}
      </header>

      <div className="modal-tabs" style={{ maxWidth: '400px', margin: '0 auto 40px auto' }} role="tablist">
        <button
          className={`modal-tab ${activeTab === 'presets' ? 'active' : ''}`}
          onClick={() => setActiveTab('presets')}
        >
          Gallery
        </button>
        <button
          className={`modal-tab ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          Upload New
        </button>
      </div>

      <div style={{ paddingBottom: '60px' }}>
        {activeTab === 'presets' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
            {customWallpapers && customWallpapers.length > 0 && (
              <section>
                <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '20px', letterSpacing: '0.05em' }}>
                  My Uploads
                </h3>
                <div className="wallpaper-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                  {customWallpapers.map((url, i) => (
                    <div key={`custom-${i}`} style={{ position: 'relative', height: '160px' }}>
                      <button
                        className={`wallpaper-thumb ${wallpaper === url ? 'selected' : ''}`}
                        style={{ backgroundImage: `url(${url})`, width: '100%', height: '100%', borderRadius: 'var(--radius-lg)' }}
                        onClick={() => handlePresetSelect(url)}
                        aria-label={`Select custom wallpaper ${i+1}`}
                      >
                        {wallpaper === url && (
                          <div style={{
                            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'var(--accent-glow)', borderRadius: 'inherit', backdropFilter: 'blur(4px)'
                          }}>
                            <IconCheck size={36} color="#081226" />
                          </div>
                        )}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeCustomWallpaper(url); }}
                        style={{
                          position: 'absolute', top: '10px', right: '10px',
                          background: 'rgba(0,0,0,0.65)', color: '#ff5050',
                          borderRadius: '50%', width: '32px', height: '32px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: '1px solid rgba(255,255,255,0.15)', zIndex: 10, cursor: 'pointer'
                        }}
                        aria-label="Delete custom wallpaper"
                        title="Delete preset"
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '20px', letterSpacing: '0.05em' }}>
                Curated Presets
              </h3>
              <div className="wallpaper-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                {PRESET_WALLPAPERS.filter(wp => !hiddenCurated?.includes(wp.id)).map((wp) => (
                  <div key={wp.id} style={{ position: 'relative', height: '160px' }}>
                    <button
                      className={`wallpaper-thumb ${wallpaper === wp.url ? 'selected' : ''}`}
                      style={{ backgroundImage: `url(${wp.url})`, width: '100%', height: '100%', borderRadius: 'var(--radius-lg)' }}
                      onClick={() => handlePresetSelect(wp.url)}
                      title={wp.label}
                      aria-label={`Select ${wp.label} wallpaper`}
                    >
                      {wallpaper === wp.url && (
                        <div style={{
                          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'var(--accent-glow)', borderRadius: 'inherit', backdropFilter: 'blur(4px)'
                        }}>
                          <IconCheck size={36} color="#081226" />
                        </div>
                      )}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); hideCuratedWallpaper(wp.id); }}
                      style={{
                        position: 'absolute', top: '10px', right: '10px',
                        background: 'rgba(0,0,0,0.65)', color: '#ff5050',
                        borderRadius: '50%', width: '32px', height: '32px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid rgba(255,255,255,0.15)', zIndex: 10, cursor: 'pointer'
                      }}
                      aria-label="Delete curated preset"
                      title="Hide curated preset"
                    >
                      <IconTrash size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'upload' && (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div
              className="upload-area"
              onClick={() => fileRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
              style={{ padding: '80px 40px' }}
            >
              <div className="upload-icon" style={{ marginBottom: '16px' }}>
                <IconImage size={48} color="var(--text-secondary)" />
              </div>
              <div className="upload-text" style={{ fontSize: '20px' }}>
                {uploading ? 'Uploading…' : 'Click to upload your 4K image'}
              </div>
              <div className="upload-sub" style={{ fontSize: '14px', marginTop: '12px' }}>
                JPG, PNG, WEBP — max 10MB
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            {uploadError && (
              <p style={{ color: '#ff5050', fontSize: '15px', marginTop: '20px', textAlign: 'center' }}>
                {uploadError}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PresetsPage;
