import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWallpaper } from '../contexts/WallpaperContext';
import { useToast } from './Toast/ToastProvider';
import { uploadWallpaper } from '../cloudinary';
import { IconImage, IconCheck, IconTrash, IconStar, IconLock } from './Icons';
import { isVideoUrl } from '../utils/imageUtils';
import { useSettings } from '../hooks/useSettings';
import ProUpgradeModal from './Settings/ProUpgradeModal';

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

/**
 * Convert a full-res Cloudinary URL to a small thumbnail URL for the picker grid.
 * 400px wide, auto format/quality — loads ~4x faster than the full image.
 */
const toThumbUrl = (url) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace(/\/upload\/[^/]*\//, '/upload/f_auto,q_auto:eco,w_400,c_fill,g_auto/');
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
    globalDefault,
    uploadToGlobalCurated,
    deleteGlobalCurated,
    setAsGlobalDefault
  } = useWallpaper();
  const { currentUser } = useAuth();
  const { settings } = useSettings();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('presets');
  const [showProModal, setShowProModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('Uploading image...');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [justUploaded, setJustUploaded] = useState(false);
  const [uploadAsCurated, setUploadAsCurated] = useState(false);
  const [curatedLabel, setCuratedLabel] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [customUrlError, setCustomUrlError] = useState('');
  const fileRef = useRef(null);

  const handlePresetSelect = (url) => {
    setWallpaper(url);
    preloadImage(url);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVid = file.type.startsWith('video/') || Boolean(file.name.match(/\.(mp4|webm|mov)$/i));
    if (!file.type.startsWith('image/') && !isVid) {
      setUploadError('Please select an image or video file (MP4, WebM, JPG, PNG).');
      return;
    }
    const maxBytes = isVid ? 50 * 1024 * 1024 : 15 * 1024 * 1024;
    if (file.size > maxBytes) {
      setUploadError(`File too large. Max ${isVid ? '50MB for video' : '15MB for image'}.`);
      return;
    }

    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    setUploading(true);
    setUploadProgress(10);
    setUploadStatus(isVid ? 'Uploading & optimizing video...' : 'Optimizing & uploading image...');
    setUploadError('');

    try {
      const url = await uploadWallpaper(file, (percent) => {
        // Map 0-100% upload network transfer to 10-85% component fill
        const scaled = Math.round(10 + (percent * 0.75));
        setUploadProgress(Math.min(85, scaled));
      });

      // Once uploaded, preload images in browser memory
      setUploadProgress(92);
      setUploadStatus('Applying wallpaper...');
      if (!isVid) {
        await preloadImage(url);
      }

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
            onClick={() => {
              if (!settings?.isPro) {
                setShowProModal(true);
              } else {
                setActiveTab('upload');
              }
            }}
            role="tab"
            aria-selected={activeTab === 'upload'}
            id="tab-upload"
          >
            Upload {settings?.isPro ? '' : <IconLock size={12} style={{marginLeft: '4px'}} />}
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
                        if (!settings?.isPro) {
                          setShowProModal(true);
                          return;
                        }
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
                        if (!settings?.isPro) {
                          setShowProModal(true);
                          return;
                        }
                        setActiveTab('upload');
                        setTimeout(() => fileRef.current?.click(), 80);
                      }}
                      aria-label="Upload another wallpaper"
                      id="btn-upload-more-card"
                    >
                      <span style={{ fontSize: '20px', lineHeight: 1, color: 'var(--accent)' }}>+</span>
                      <span style={{ fontSize: '11px' }}>Upload More</span>
                    </button>
                    {customWallpapers.map((url, i) => {
                      const isVid = isVideoUrl(url);
                      const thumbUrl = toThumbUrl(url);
                      return (
                      <div key={`custom-${i}`} style={{ position: 'relative' }}>
                        <button
                          className={`wallpaper-thumb ${wallpaper === url ? 'selected' : ''}`}
                          style={{ width: '100%', position: 'relative', overflow: 'hidden' }}
                          onClick={() => handlePresetSelect(url)}
                          title="Custom Wallpaper"
                          aria-label={`Select custom wallpaper ${i + 1}`}
                        >
                          {isVid ? (
                            <video
                              src={url}
                              className="wallpaper-thumb-media"
                              muted
                              loop
                              playsInline
                              preload="none"
                              onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                              onMouseLeave={(e) => e.currentTarget.pause()}
                            />
                          ) : (
                            <img
                              className="wallpaper-thumb-media"
                              src={thumbUrl}
                              loading="lazy"
                              alt="Custom Wallpaper Thumbnail"
                            />
                          )}
                          {isVid && <span className="wallpaper-video-badge">▶ Video</span>}
                          {wallpaper === url && (
                            <div style={{
                              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: 'var(--accent-glow)', borderRadius: 'inherit', backdropFilter: 'blur(4px)', zIndex: 3
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
                          aria-label="Delete wallpaper"
                          title="Delete wallpaper"
                        >
                          <IconTrash size={14} />
                        </button>
                      </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {globalCurated && globalCurated.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px', letterSpacing: '0.05em' }}>Curated Presets</h3>
                  <div className="wallpaper-grid">
                    {globalCurated.filter(wp => !hiddenCurated?.includes(wp.id)).map((wp) => {
                      const displayTitle = (wp.label && wp.label.trim().toLowerCase() !== 'user upload') ? wp.label : 'Curated Preset';
                      const isVid = wp.isVideo || isVideoUrl(wp.url);
                      return (
                      <div key={wp.id} style={{ position: 'relative' }}>
                        <button
                          className={`wallpaper-thumb ${wallpaper === wp.url ? 'selected' : ''}`}
                          style={{ width: '100%', position: 'relative', overflow: 'hidden' }}
                          onClick={() => handlePresetSelect(wp.url)}
                          title={displayTitle}
                          aria-label={`Select ${displayTitle}`}
                        >
                          {isVid ? (
                            <video
                              src={wp.url}
                              className="wallpaper-thumb-media"
                              muted
                              loop
                              playsInline
                              preload="none"
                              onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                              onMouseLeave={(e) => e.currentTarget.pause()}
                            />
                          ) : (
                            <img
                              className="wallpaper-thumb-media"
                              src={toThumbUrl(wp.url)}
                              loading="lazy"
                              alt={displayTitle}
                            />
                          )}
                          {isVid && <span className="wallpaper-video-badge">▶ Video</span>}
                          {wallpaper === wp.url && (
                            <div style={{
                              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: 'var(--accent-glow)', borderRadius: 'inherit', backdropFilter: 'blur(4px)', zIndex: 3
                            }}>
                              <IconCheck size={28} color="#081226" />
                            </div>
                          )}
                        </button>
                      {currentUser?.email === 'deepeshsingh2606@gmail.com' && (
                        <div style={{ position: 'absolute', top: '6px', right: '6px', display: 'flex', gap: '6px', zIndex: 10 }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteGlobalCurated(wp.id); }}
                            style={{
                              background: 'rgba(0,0,0,0.65)', color: '#ff5050',
                              borderRadius: '50%', width: '26px', height: '26px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              border: '1px solid rgba(255,255,255,0.15)'
                            }}
                            aria-label="Delete curated preset completely"
                            title="Delete preset for everyone"
                          >
                            <IconTrash size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              </div>
              )}

              {(!customWallpapers || customWallpapers.length === 0) && (!globalCurated || globalCurated.length === 0) && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>🖼️</div>
                  <h3 style={{ fontSize: '15px', color: '#fff', marginBottom: '6px' }}>No Wallpapers Added Yet</h3>
                  <p style={{ fontSize: '13px', lineHeight: 1.5, marginBottom: '20px' }}>
                    Upload your favorite image or video loops via Cloudinary to personalize your workspace.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      if (!settings?.isPro) {
                        setShowProModal(true);
                        return;
                      }
                      setActiveTab('upload');
                      setTimeout(() => fileRef.current?.click(), 80);
                    }}
                    style={{ padding: '8px 20px', borderRadius: '12px', fontSize: '13px' }}
                  >
                    Upload Wallpaper
                  </button>
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
                        Click to upload image or video
                      </div>
                      <div className="upload-sub">JPG, PNG, WEBP, MP4, WebM — max 50MB</div>
                    </>
                  )}
                </div>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/mp4,video/webm,video/quicktime"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
                id="wallpaper-file-input"
              />
              {uploadError && (
                <p style={{ color: '#ff5050', fontSize: '13px', marginTop: '12px', textAlign: 'center' }}>
                  {uploadError}
                </p>
              )}

              {/* Direct URL Input Section */}
              <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.05em' }}>
                  Or Paste Link (Image or Video)
                </h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const trimmed = customUrlInput.trim();
                    if (!trimmed) return;
                    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
                      setCustomUrlError('Please enter a valid http/https link.');
                      return;
                    }
                    setCustomUrlError('');
                    try {
                      await addCustomWallpaper(trimmed);
                      await setWallpaper(trimmed);
                      toast('Custom wallpaper applied!', 'success', 3000);
                      setCustomUrlInput('');
                      setActiveTab('presets');
                    } catch (err) {
                      setCustomUrlError('Failed to apply wallpaper URL.');
                    }
                  }}
                  style={{ display: 'flex', gap: '8px' }}
                >
                  <input
                    type="url"
                    placeholder="https://example.com/video.mp4"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    style={{
                      flex: 1,
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '10px',
                      padding: '8px 12px',
                      color: '#fff',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      background: 'var(--accent)',
                      color: '#081226',
                      fontWeight: 600,
                      fontSize: '12px',
                      borderRadius: '10px',
                      border: 'none',
                      padding: '0 16px',
                      cursor: 'pointer'
                    }}
                  >
                    Apply
                  </button>
                </form>
                {customUrlError && (
                  <p style={{ color: '#ff5050', fontSize: '12px', marginTop: '6px' }}>{customUrlError}</p>
                )}
              </div>
              
              {currentUser?.email === 'deepeshsingh2606@gmail.com' && (
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
                          ? 'Added to curated presets for everyone using Fmood.'
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
              )}
            </div>
          )}
        </div>
      </aside>
      <ProUpgradeModal isOpen={showProModal} onClose={() => setShowProModal(false)} />
    </>
  );
};

export default WallpaperPicker;
