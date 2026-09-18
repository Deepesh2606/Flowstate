import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWallpaper } from '../contexts/WallpaperContext';
import { useToast } from './Toast/ToastProvider';
import { uploadWallpaper } from '../cloudinary';
import { IconImage, IconCheck, IconTrash } from './Icons';

const preloadImage = (url) => {
  return new Promise((resolve) => {
    if (!url) return resolve(false);
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
    // Timeout safeguard (max 3.5s) so it never blocks indefinitely on slow networks
    setTimeout(() => resolve(false), 3500);
  });
};

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
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('presets');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('Uploading image...');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [justUploaded, setJustUploaded] = useState(false);
  const [uploadAsCurated, setUploadAsCurated] = useState(false);
  const [curatedLabel, setCuratedLabel] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef(null);

  const handlePresetSelect = (url) => {
    setWallpaper(url);
    preloadImage(url);
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

    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    setUploading(true);
    setUploadProgress(10);
    setUploadStatus('Optimizing & uploading image...');
    setUploadError('');

    try {
      const url = await uploadWallpaper(file, (percent) => {
        // Map 0-100% upload network transfer to 10-85% component fill
        const scaled = Math.round(10 + (percent * 0.75));
        setUploadProgress(Math.min(85, scaled));
      });

      // Once uploaded, preload and cache in browser memory to eliminate blank delay
      setUploadProgress(92);
      setUploadStatus('Caching & applying wallpaper...');
      await preloadImage(url);

      setUploadProgress(100);
      setUploadStatus('Wallpaper applied!');

      if (uploadAsCurated) {
        await uploadToGlobalCurated(url, curatedLabel);
      } else {
        await addCustomWallpaper(url);
      }
      await setWallpaper(url);

      // Smooth delay so user observes the 100% completion and browser renders wallpaper seamlessly
      await new Promise((resolve) => setTimeout(resolve, 600));

      setJustUploaded(true);
      toast('Wallpaper uploaded and applied successfully!', 'success', 3000);
      setUploadAsCurated(false);
      setCuratedLabel('');
      if (fileRef.current) {
        fileRef.current.value = '';
      }
    } catch (err) {
      console.error(err);
      setUploadError(err.message || 'Upload failed. Check Cloudinary config.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (preview) {
        URL.revokeObjectURL(preview);
      }
      setPreviewUrl(null);
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
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', margin: 0, letterSpacing: '0.05em' }}>My Uploads</h3>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('upload');
                        setTimeout(() => fileRef.current?.click(), 80);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        padding: '2px 6px'
                      }}
                      id="btn-upload-more-header"
                    >
                      + Upload More
                    </button>
                  </div>
                  <div className="wallpaper-grid">
                    <button
                      className="wallpaper-thumb"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        border: '2px dashed var(--glass-border)',
                        background: 'rgba(255, 255, 255, 0.03)',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)'
                      }}
                      onClick={() => {
                        setActiveTab('upload');
                        setTimeout(() => fileRef.current?.click(), 80);
                      }}
                      aria-label="Upload another wallpaper"
                      id="btn-upload-more-card"
                    >
                      <span style={{ fontSize: '20px', lineHeight: 1, color: 'var(--accent)' }}>+</span>
                      <span style={{ fontSize: '11px' }}>Upload More</span>
                    </button>
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
              {justUploaded && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.28)',
                  borderRadius: '12px',
                  padding: '14px',
                  textAlign: 'center',
                  marginBottom: '16px'
                }}>
                  <div style={{ color: '#10b981', fontWeight: 600, fontSize: '13px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <IconCheck size={16} /> Wallpaper applied!
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      style={{
                        fontSize: '12px',
                        padding: '6px 14px',
                        background: 'var(--accent)',
                        color: '#081226',
                        fontWeight: 600,
                        borderRadius: '20px',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      id="btn-upload-more-pill"
                    >
                      + Upload More
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('presets')}
                      style={{
                        fontSize: '12px',
                        padding: '6px 14px',
                        background: 'var(--glass-bg-strong)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)',
                        borderRadius: '20px',
                        cursor: 'pointer'
                      }}
                      id="btn-view-wallpapers-pill"
                    >
                      View Gallery
                    </button>
                  </div>
                </div>
              )}

              <div
                className={`upload-area ${uploading ? 'is-uploading' : ''}`}
                onClick={() => !uploading && fileRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => !uploading && e.key === 'Enter' && fileRef.current?.click()}
                style={{
                  minHeight: '190px',
                  justifyContent: 'center',
                }}
                id="wallpaper-upload-area"
              >
                {/* Background image preview if available during upload */}
                {previewUrl && (
                  <div
                    className="upload-preview-backdrop"
                    style={{ backgroundImage: `url(${previewUrl})` }}
                  />
                )}

                {/* Filling layer that fills the component upwards as upload progresses */}
                {uploading && (
                  <div
                    className="upload-progress-fill"
                    style={{ height: `${uploadProgress}%` }}
                  />
                )}

                {/* Content layer */}
                <div className="upload-content-layer">
                  {uploading ? (
                    <>
                      <div className="upload-spinner-ring" />
                      <div className="upload-progress-badge">
                        <span>Uploading</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="upload-mini-track">
                        <div
                          className="upload-mini-bar"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <div className="upload-sub" style={{ color: 'var(--text-secondary)' }}>
                        Optimizing & applying wallpaper...
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="upload-icon" style={{ marginBottom: '4px' }}>
                        <IconImage size={36} color="var(--accent)" />
                      </div>
                      <div className="upload-text">
                        Click to upload your image
                      </div>
                      <div className="upload-sub">JPG, PNG, WEBP — max 10MB</div>
                    </>
                  )}
                </div>
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
              
              <div className={`curated-toggle-card ${uploadAsCurated ? 'active' : ''}`}>
                <div className="curated-toggle-content">
                  <div className="curated-toggle-header">
                    <div className="curated-globe-icon" aria-hidden="true">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                    </div>
                    <div className="curated-toggle-text">
                      <div className="curated-toggle-title">
                        <span>Global Curated Preset</span>
                        <span className={`curated-badge ${uploadAsCurated ? 'active' : ''}`}>
                          {uploadAsCurated ? 'Visible to All' : 'Private'}
                        </span>
                      </div>
                      <p className="curated-toggle-desc">
                        {uploadAsCurated
                          ? 'Added to curated presets for everyone using Flowstate.'
                          : 'Saved to your personal uploads only. Enable to share with all users.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`toggle-switch ${uploadAsCurated ? 'on' : ''}`}
                    onClick={() => setUploadAsCurated(!uploadAsCurated)}
                    role="switch"
                    aria-checked={uploadAsCurated}
                    aria-label="Upload as global curated preset"
                    id="btn-toggle-curated-preset"
                  >
                    <div className="toggle-thumb" />
                  </button>
                </div>

                {uploadAsCurated && (
                  <div className="curated-name-field">
                    <label
                      htmlFor="curated-preset-label"
                      style={{ display: 'block', fontSize: '11.5px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}
                    >
                      Preset Theme Title <span style={{ opacity: 0.6 }}>(optional)</span>
                    </label>
                    <input
                      type="text"
                      id="curated-preset-label"
                      className="settings-input"
                      placeholder="e.g. Cyberpunk Neon, Tokyo Rain..."
                      value={curatedLabel}
                      onChange={(e) => setCuratedLabel(e.target.value)}
                      maxLength={35}
                      style={{ fontSize: '12.5px', padding: '8px 12px', width: '100%', borderRadius: '8px', boxSizing: 'border-box' }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default WallpaperPicker;
