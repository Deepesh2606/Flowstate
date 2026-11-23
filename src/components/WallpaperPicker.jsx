import React, { useState, useRef } from 'react';
import { useWallpaper } from '../contexts/WallpaperContext';
import { useToast } from './Toast/ToastProvider';
import { uploadWallpaper } from '../cloudinary';
import { IconImage, IconCheck, IconTrash, IconStar, IconLock } from './Icons';
import { isVideoUrl, getCloudinaryThumbnailUrl } from '../utils/imageUtils';
import { useSettings } from '../hooks/useSettings';
import ProUpgradeModal from './Settings/ProUpgradeModal';

const preloadImage = (url) => {
  return new Promise((resolve) => {
    if (!url) return resolve(false);
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
    setTimeout(() => resolve(false), 3500);
  });
};

const toThumbUrl = (url) => getCloudinaryThumbnailUrl(url, 400);

const WallpaperMediaItem = ({ isVid, url, thumbUrl, alt }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imgSrc, setImgSrc] = useState(thumbUrl);
  const [useVideoFallback, setUseVideoFallback] = useState(false);
  const [failed, setFailed] = useState(false);

  React.useEffect(() => {
    setImgSrc(thumbUrl);
    setUseVideoFallback(false);
    setFailed(false);
  }, [thumbUrl, url]);

  const handleImgError = () => {
    if (isVid) {
      setUseVideoFallback(true);
      return;
    }
    // If optimized Cloudinary thumbnail failed, retry the original raw URL before showing fallback
    if (imgSrc !== url && url) {
      setImgSrc(url);
      return;
    }
    setFailed(true);
  };

  if (failed) {
    return (
      <div className="wp-thumb-fallback" aria-label={alt}>
        <IconImage size={18} color="rgba(255,255,255,0.45)" />
        <span>{alt}</span>
      </div>
    );
  }

  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative' }}
      onMouseEnter={() => isVid && setIsHovered(true)}
      onMouseLeave={() => isVid && setIsHovered(false)}
    >
      {isVid && (isHovered || useVideoFallback) ? (
        <video
          src={url}
          className="wallpaper-thumb-media"
          muted
          autoPlay={isHovered}
          loop={isHovered}
          preload="metadata"
          playsInline
          onError={() => setFailed(true)}
        />
      ) : (
        <img
          className="wallpaper-thumb-media"
          src={imgSrc}
          loading="lazy"
          referrerPolicy="no-referrer"
          alt={alt}
          onError={handleImgError}
        />
      )}
    </div>
  );
};

const WallpaperPicker = () => {
  const {
    wallpaper,
    setWallpaper,
    resetToGlobalDefault,
    isUsingSiteDefault,
    setShowPicker,
    builtinWallpapers,
    customWallpapers,
    addCustomWallpaper,
    removeCustomWallpaper,
    hiddenCurated,
    globalCurated,
    globalDefault,
    canSetGlobalDefault,
    isFirebaseConfigured,
    uploadToGlobalCurated,
    deleteGlobalCurated,
    setAsGlobalDefault,
  } = useWallpaper();
  const { settings } = useSettings();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('presets');
  const [showProModal, setShowProModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [justUploaded, setJustUploaded] = useState(false);
  const [uploadAsCurated, setUploadAsCurated] = useState(false);
  const [uploadAsDefault, setUploadAsDefault] = useState(false);
  const [forceForExisting, setForceForExisting] = useState(true);
  const [savingDefaultUrl, setSavingDefaultUrl] = useState(null);
  const [curatedLabel, setCuratedLabel] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [customUrlError, setCustomUrlError] = useState('');
  const fileRef = useRef(null);

  const canUpload = Boolean(settings?.isPro || canSetGlobalDefault);

  const handlePresetSelect = (url) => {
    setWallpaper(url);
    preloadImage(url);
  };

  const handleSetDefaultForEveryone = async (e, url, label = 'Wallpaper') => {
    if (e) e.stopPropagation();
    setSavingDefaultUrl(url);
    try {
      await setAsGlobalDefault(url, { forceForExisting });
      preloadImage(url);
      toast(
        isFirebaseConfigured
          ? `"${label}" is now the default wallpaper for everyone.`
          : `"${label}" set as default wallpaper for everyone (preview saved locally).`,
        'success',
        3200
      );
    } catch (err) {
      toast(err?.message || 'Could not update default wallpaper.', 'error', 3000);
    } finally {
      setSavingDefaultUrl(null);
    }
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
    setUploadError('');

    try {
      const url = await uploadWallpaper(file, (percent) => {
        const scaled = Math.round(10 + percent * 0.75);
        setUploadProgress(Math.min(85, scaled));
      });

      setUploadProgress(92);
      if (!isVid) {
        await preloadImage(url);
      }

      setUploadProgress(100);

      if (uploadAsCurated) {
        await uploadToGlobalCurated(url, curatedLabel);
      } else {
        await addCustomWallpaper(url);
      }

      if (uploadAsDefault && canSetGlobalDefault) {
        await setAsGlobalDefault(url, { forceForExisting });
      } else {
        await setWallpaper(url);
      }

      await new Promise((resolve) => setTimeout(resolve, 450));

      setJustUploaded(true);
      toast(
        uploadAsDefault && canSetGlobalDefault
          ? 'Wallpaper uploaded and set as default for everyone!'
          : 'Wallpaper uploaded and applied!',
        'success',
        3000
      );
      setUploadAsCurated(false);
      setUploadAsDefault(false);
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

  const getWallpaperLabel = (targetUrl) => {
    const builtin = builtinWallpapers?.find((b) => b.url === targetUrl);
    if (builtin) return builtin.label;
    const curated = globalCurated?.find((c) => c.url === targetUrl);
    if (curated?.label) return curated.label;
    return 'Custom Default';
  };

  const renderWallpaperCard = ({ id, url, label, isVid = false, onDelete = null }) => {
    const isSelected = wallpaper === url;
    const isGlobalDefault = globalDefault === url;
    const isSavingDefault = savingDefaultUrl === url;

    return (
      <div key={id} className="wp-card-item">
        <button
          type="button"
          className={`wallpaper-thumb ${isSelected ? 'selected' : ''}`}
          style={{ width: '100%', position: 'relative', overflow: 'hidden' }}
          onClick={() => handlePresetSelect(url)}
          title={`Apply ${label}`}
          aria-label={`Apply ${label} wallpaper`}
        >
          <WallpaperMediaItem
            isVid={isVid}
            url={url}
            thumbUrl={toThumbUrl(url)}
            alt={label}
          />
          {isVid && <span className="wallpaper-video-badge">Video</span>}
          {isGlobalDefault && (
            <span className="wp-default-indicator" title="Active default wallpaper for all users">
              <IconStar size={10} /> Default
            </span>
          )}
          {isSelected && (
            <div className="wp-selected-scrim">
              <span className="wp-selected-check">
                <IconCheck size={18} color="#06131f" />
              </span>
            </div>
          )}
        </button>

        <div className="wp-card-footer">
          <span className="wp-card-label" title={label}>{label}</span>
          <div className="wp-card-actions">
            {canSetGlobalDefault && (
              <button
                type="button"
                className={`wp-set-default-btn ${isGlobalDefault ? 'is-default' : ''}`}
                disabled={isGlobalDefault || isSavingDefault}
                onClick={(e) => handleSetDefaultForEveryone(e, url, label)}
                aria-label={
                  isGlobalDefault
                    ? `${label} is the default wallpaper for everyone`
                    : `Set ${label} as default wallpaper for everyone`
                }
                title={
                  isGlobalDefault
                    ? 'Current site-wide default wallpaper'
                    : 'Set as default wallpaper for everyone'
                }
              >
                <IconStar size={11} />
                <span>{isSavingDefault ? 'Saving...' : isGlobalDefault ? 'Everyone' : 'Set Default'}</span>
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="wp-delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                aria-label={`Delete ${label}`}
                title={`Delete ${label}`}
              >
                <IconTrash size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="drawer-overlay" onClick={() => setShowPicker(false)} aria-hidden="true" />
      <aside className="drawer wallpaper-drawer" role="dialog" aria-label="Wallpaper Gallery" aria-modal="true">
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconImage size={20} color="var(--accent)" />
            <h2 className="drawer-title" style={{ fontSize: '1.15rem' }}>Wallpapers</h2>
          </div>
          <button
            type="button"
            className="drawer-close"
            onClick={() => setShowPicker(false)}
            aria-label="Close wallpaper gallery"
          >
            ✕
          </button>
        </div>

        <div className="wallpaper-nav-tabs" role="tablist">
          <button
            type="button"
            className={`wallpaper-nav-tab ${activeTab === 'presets' ? 'active' : ''}`}
            onClick={() => setActiveTab('presets')}
            role="tab"
            aria-selected={activeTab === 'presets'}
            id="tab-presets"
          >
            Gallery
          </button>

          <button
            type="button"
            className={`wallpaper-nav-tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => {
              if (!canUpload) {
                setShowProModal(true);
              } else {
                setActiveTab('upload');
              }
            }}
            role="tab"
            aria-selected={activeTab === 'upload'}
            id="tab-upload"
          >
            Upload / URL {canUpload ? '' : <IconLock size={12} style={{ marginLeft: '4px' }} />}
          </button>
        </div>

        <div className="wallpaper-drawer-body">
          {activeTab === 'presets' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Site-Wide Default Wallpaper Status Card */}
              <div className="wp-global-default-card" data-testid="global-default-banner">
                <div className="wp-global-default-top">
                  <img
                    src={toThumbUrl(globalDefault)}
                    alt="Current site default wallpaper"
                    className="wp-global-default-thumb"
                    referrerPolicy="no-referrer"
                  />
                  <div className="wp-global-default-info">
                    <div className="wp-global-default-kicker">Site Default for Everyone</div>
                    <div className="wp-global-default-name">{getWallpaperLabel(globalDefault)}</div>
                  </div>
                  {!isUsingSiteDefault && (
                    <button
                      type="button"
                      className="wp-reset-default-btn"
                      onClick={() => {
                        resetToGlobalDefault();
                        toast('Switched back to the site default wallpaper.', 'info', 2200);
                      }}
                    >
                      Use Default
                    </button>
                  )}
                </div>

                {canSetGlobalDefault && (
                  <label className="wp-force-checkbox">
                    <input
                      type="checkbox"
                      checked={forceForExisting}
                      onChange={(e) => setForceForExisting(e.target.checked)}
                    />
                    <span>Apply new default to existing visitors too</span>
                  </label>
                )}
              </div>

              {/* Built-in Presets (always available) */}
              <div>
                <h3 className="wp-section-heading">Built-in Sanctuary Presets</h3>
                <div className="wallpaper-grid">
                  {(builtinWallpapers || []).map((wp) =>
                    renderWallpaperCard({
                      id: wp.id,
                      url: wp.url,
                      label: wp.label,
                      isVid: false,
                    })
                  )}
                </div>
              </div>

              {/* Personal Uploads */}
              {customWallpapers && customWallpapers.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <h3 className="wp-section-heading" style={{ marginBottom: 0 }}>My Uploads</h3>
                    <button
                      type="button"
                      onClick={() => {
                        if (!canUpload) {
                          setShowProModal(true);
                          return;
                        }
                        setActiveTab('upload');
                        setTimeout(() => fileRef.current?.click(), 80);
                      }}
                      className="wp-inline-action"
                      id="btn-upload-more-header"
                    >
                      + Upload
                    </button>
                  </div>
                  <div className="wallpaper-grid">
                    {customWallpapers.map((url, i) =>
                      renderWallpaperCard({
                        id: `custom-${i}`,
                        url,
                        label: `Custom ${i + 1}`,
                        isVid: isVideoUrl(url),
                        onDelete: () => removeCustomWallpaper(url),
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Global Curated Presets */}
              {globalCurated && globalCurated.length > 0 ? (
                <div>
                  <h3 className="wp-section-heading">Curated Presets</h3>
                  <div className="wallpaper-grid">
                    {globalCurated
                      .filter((wp) => !hiddenCurated?.includes(wp.id))
                      .map((wp) => {
                        const displayTitle =
                          wp.label && wp.label.trim().toLowerCase() !== 'user upload'
                            ? wp.label
                            : 'Curated Preset';
                        return renderWallpaperCard({
                          id: wp.id,
                          url: wp.url,
                          label: displayTitle,
                          isVid: wp.isVideo || isVideoUrl(wp.url),
                          onDelete: canSetGlobalDefault ? () => deleteGlobalCurated(wp.id) : null,
                        });
                      })}
                  </div>
                </div>
              ) : (
                !isFirebaseConfigured && (
                  <div className="wp-cloud-notice">
                    <div className="wp-cloud-notice-title">Preview Mode — Vercel Env Vars Not Loaded Here</div>
                    <p className="wp-cloud-notice-desc">
                      Your saved Cloudinary curated wallpapers sync from Firebase using your Vercel environment variables (<code>VITE_FIREBASE_*</code> &amp; <code>VITE_CLOUDINARY_*</code>). They will load automatically once deployed to Vercel, or add them to <code>.env.local</code> for local testing.
                    </p>
                  </div>
                )
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div>
              {justUploaded && (
                <div className="wp-upload-success-banner">
                  <div style={{ color: '#10b981', fontWeight: 600, fontSize: '13px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <IconCheck size={16} /> Wallpaper applied!
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="wp-pill-cta"
                      id="btn-upload-more-pill"
                    >
                      + Upload More
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('presets')}
                      className="wp-pill-secondary"
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
                style={{ minHeight: '170px', justifyContent: 'center' }}
                id="wallpaper-upload-area"
              >
                {previewUrl && (
                  <div
                    className="upload-preview-backdrop"
                    style={{ backgroundImage: `url(${previewUrl})` }}
                  />
                )}

                {uploading && (
                  <div
                    className="upload-progress-fill"
                    style={{ height: `${uploadProgress}%` }}
                  />
                )}

                <div className="upload-content-layer">
                  {uploading ? (
                    <>
                      <div className="upload-spinner-ring" />
                      <div className="upload-progress-badge">
                        <span>Uploading</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="upload-mini-track">
                        <div className="upload-mini-bar" style={{ width: `${uploadProgress}%` }} />
                      </div>
                      <div className="upload-sub" style={{ color: 'var(--text-secondary)' }}>
                        Optimizing & applying wallpaper...
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="upload-icon" style={{ marginBottom: '4px' }}>
                        <IconImage size={34} color="var(--accent)" />
                      </div>
                      <div className="upload-text">Click to upload image or video</div>
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
              <div style={{ marginTop: '22px', paddingTop: '18px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 className="wp-section-heading">Or Paste Image / Video URL</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const trimmed = customUrlInput.trim();
                    if (!trimmed) return;
                    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/')) {
                      setCustomUrlError('Please enter a valid http/https link or local asset path.');
                      return;
                    }
                    setCustomUrlError('');
                    try {
                      await addCustomWallpaper(trimmed);
                      if (uploadAsDefault && canSetGlobalDefault) {
                        await setAsGlobalDefault(trimmed, { forceForExisting });
                        toast('Custom URL set as default wallpaper for everyone!', 'success', 3000);
                      } else {
                        await setWallpaper(trimmed);
                        toast('Custom wallpaper applied!', 'success', 3000);
                      }
                      setCustomUrlInput('');
                      setActiveTab('presets');
                    } catch {
                      setCustomUrlError('Failed to apply wallpaper URL.');
                    }
                  }}
                  style={{ display: 'flex', gap: '8px' }}
                >
                  <input
                    type="text"
                    placeholder="https://example.com/scene.jpg"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    className="wp-url-input"
                    aria-label="Wallpaper image or video URL"
                  />
                  <button type="submit" className="wp-url-submit-btn">
                    {uploadAsDefault && canSetGlobalDefault ? 'Set Default' : 'Apply'}
                  </button>
                </form>
                {customUrlError && (
                  <p style={{ color: '#ff5050', fontSize: '12px', marginTop: '6px' }}>{customUrlError}</p>
                )}
              </div>

              {canSetGlobalDefault && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '18px' }}>
                  {/* Set as Default for Everyone Toggle */}
                  <div className={`curated-toggle-card ${uploadAsDefault ? 'active' : ''}`}>
                    <div className="curated-toggle-content">
                      <div className="curated-toggle-header">
                        <div className="curated-globe-icon" aria-hidden="true">
                          <IconStar size={16} />
                        </div>
                        <div className="curated-toggle-text">
                          <div className="curated-toggle-title">
                            <span>Set as Default for Everyone</span>
                          </div>
                          <p className="curated-toggle-desc">
                            {uploadAsDefault
                              ? 'New uploads or URLs will immediately become the default background for all Flowstate visitors.'
                              : 'Apply only to your own workspace. Enable to make it the site-wide default.'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className={`toggle-switch ${uploadAsDefault ? 'on' : ''}`}
                        onClick={() => setUploadAsDefault((v) => !v)}
                        role="switch"
                        aria-checked={uploadAsDefault}
                        aria-label="Set uploaded wallpaper as default for everyone"
                        id="btn-toggle-default-everyone"
                      >
                        <div className="toggle-thumb" />
                      </button>
                    </div>
                  </div>

                  {/* Global Curated Preset Toggle */}
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
                            <span>Add to Curated Presets</span>
                          </div>
                          <p className="curated-toggle-desc">
                            {uploadAsCurated
                              ? 'Added to the shared curated gallery for everyone.'
                              : 'Saved to your personal uploads only.'}
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
                          placeholder="e.g. Kyoto Rain, Alpine Dusk..."
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
          )}
        </div>
      </aside>
      <ProUpgradeModal isOpen={showProModal} onClose={() => setShowProModal(false)} />
    </>
  );
};

export default WallpaperPicker;
