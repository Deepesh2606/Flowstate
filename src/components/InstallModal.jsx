import React, { useState, useEffect } from 'react';
import { IconDownload, IconCheck, IconX } from './Icons';
import { useToast } from './Toast/ToastProvider';

const PREVIEW_PRESETS = [25, 45, 60, 90];

const InstallModal = ({ isOpen, onClose, deferredPrompt, onInstalled, initialTab = 'extension' }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isMac, setIsMac] = useState(true);
  const [isSafari, setIsSafari] = useState(false);
  const [isChrome, setIsChrome] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedExtAddr, setCopiedExtAddr] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [downloadingExt, setDownloadingExt] = useState(false);

  // Interactive miniature popup preview state
  const [previewMinutes, setPreviewMinutes] = useState(45);
  const [previewMode, setPreviewMode] = useState('focus');
  const [previewRunning, setPreviewRunning] = useState(false);
  const [previewBlocker, setPreviewBlocker] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || 'extension');
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    const ua = navigator.userAgent || '';
    const platform = navigator.platform || '';
    const macDetected = platform.toUpperCase().indexOf('MAC') >= 0 || ua.indexOf('Macintosh') >= 0;
    const safariDetected = /^((?!chrome|android).)*safari/i.test(ua);
    const chromeDetected = /chrome|chromium|edg|brave/i.test(ua);
    const standaloneDetected =
      window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    setIsMac(macDetected);
    setIsSafari(safariDetected);
    setIsChrome(chromeDetected);
    setIsStandalone(standaloneDetected);
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePromptInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        toast('FLOWSTATE added to your Applications & Dock!', 'success', 3500);
        if (onInstalled) onInstalled();
        onClose();
      }
    } catch (err) {
      console.error('Install prompt error:', err);
    } finally {
      setInstalling(false);
    }
  };

  const handleDownloadExtension = async () => {
    setDownloadingExt(true);
    try {
      const res = await fetch('/api/extension/download');
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'flowstate-chrome-extension.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast('Downloaded flowstate-chrome-extension.zip — unzip and load in chrome://extensions.', 'success', 4000);
    } catch (err) {
      console.error('Chrome extension download error:', err);
      toast('Could not download extension package. Try again.', 'error', 3000);
    } finally {
      setDownloadingExt(false);
    }
  };

  const handleCopyExtAddress = () => {
    navigator.clipboard?.writeText('chrome://extensions');
    setCopiedExtAddr(true);
    toast('Copied chrome://extensions — paste in a new tab.', 'info', 2400);
    setTimeout(() => setCopiedExtAddr(false), 2400);
  };

  const handleCopyUrl = () => {
    navigator.clipboard?.writeText(window.location.origin);
    setCopiedUrl(true);
    toast('App link copied to clipboard.', 'info', 2400);
    setTimeout(() => setCopiedUrl(false), 2400);
  };

  const previewTimeLabel =
    previewMode === 'focus'
      ? `${String(previewMinutes).padStart(2, '0')}:00`
      : previewMode === 'short'
        ? '05:00'
        : '15:00';

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} aria-hidden="true" style={{ zIndex: 120 }} />
      <div
        className="install-modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-modal-title"
        data-testid="install-modal"
      >
        <div className={`install-modal-card ext-showcase-card ${activeTab === 'extension' ? 'is-wide' : ''}`}>
          {/* Top Header */}
          <div className="ext-modal-header">
            <div className="ext-modal-brand">
              <div className="ext-modal-icon">
                <img src="/favicon.svg" alt="FLOWSTATE" width={24} height={24} />
              </div>
              <div>
                <h3 id="install-modal-title" className="ext-modal-title">
                  {activeTab === 'extension'
                    ? 'FLOWSTATE Chrome Extension'
                    : isMac
                      ? 'Add to Mac Dock'
                      : 'Install Desktop App'}
                </h3>
                <p className="ext-modal-sub">
                  {activeTab === 'extension'
                    ? 'Manifest V3 · 45m focus default · Site blocker · Goal ring'
                    : isStandalone
                      ? 'Running as a standalone desktop window'
                      : 'Pin FLOWSTATE to your dock or taskbar for distraction-free sessions'}
                </p>
              </div>
            </div>

            <div className="ext-modal-header-right">
              <div className="ext-modal-segmented" role="tablist" aria-label="Install options">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'extension'}
                  className={`ext-modal-seg-btn ${activeTab === 'extension' ? 'active' : ''}`}
                  onClick={() => setActiveTab('extension')}
                  data-testid="install-tab-extension"
                >
                  Chrome Extension
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'desktop'}
                  className={`ext-modal-seg-btn ${activeTab === 'desktop' ? 'active' : ''}`}
                  onClick={() => setActiveTab('desktop')}
                  data-testid="install-tab-desktop"
                >
                  {isMac ? 'Desktop App' : 'Install App'}
                </button>
              </div>

              <button
                type="button"
                className="ext-modal-close"
                onClick={onClose}
                aria-label="Close modal"
              >
                <IconX size={16} />
              </button>
            </div>
          </div>

          <div className="ext-modal-body">
            {activeTab === 'extension' ? (
              <div className="ext-showcase-grid">
                {/* Left Column: Live Interactive Extension Popup Preview */}
                <div className="ext-preview-stage" aria-label="Interactive Chrome extension popup preview">
                  <div className="ext-preview-caption">Interactive toolbar popup preview</div>
                  <div className="ext-mini-popup">
                    <div className="ext-mini-top">
                      <span className="ext-mini-logo">FLOWSTATE</span>
                      <span className="ext-mini-badge-chip">
                        {previewMode === 'focus' ? `${previewMinutes}m` : previewMode === 'short' ? '5m' : '15m'}
                      </span>
                    </div>

                    <div className="ext-mini-tabs">
                      <button
                        type="button"
                        className={previewMode === 'focus' ? 'active' : ''}
                        onClick={() => { setPreviewMode('focus'); setPreviewRunning(false); }}
                      >
                        Focus
                      </button>
                      <button
                        type="button"
                        className={previewMode === 'short' ? 'active' : ''}
                        onClick={() => { setPreviewMode('short'); setPreviewRunning(false); }}
                      >
                        Short
                      </button>
                      <button
                        type="button"
                        className={previewMode === 'long' ? 'active' : ''}
                        onClick={() => { setPreviewMode('long'); setPreviewRunning(false); }}
                      >
                        Long
                      </button>
                    </div>

                    <div className="ext-mini-digits tabular-nums">{previewTimeLabel}</div>

                    <div className="ext-mini-presets">
                      {PREVIEW_PRESETS.map((m) => {
                        const isSelected = previewMode === 'focus' && previewMinutes === m;
                        return (
                          <button
                            key={m}
                            type="button"
                            className={`ext-mini-preset-btn ${isSelected ? 'is-active' : ''}`}
                            aria-pressed={isSelected}
                            onClick={() => {
                              setPreviewMode('focus');
                              setPreviewMinutes(m);
                            }}
                          >
                            {m}m
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      className={`ext-mini-cta ${previewRunning ? 'is-running' : ''}`}
                      onClick={() => setPreviewRunning((r) => !r)}
                    >
                      {previewRunning ? 'Pause Focus' : 'Start Focus'}
                    </button>

                    <div className="ext-mini-footer-row">
                      <div className="ext-mini-goal-line">
                        <span className="ext-mini-ring" aria-hidden="true" />
                        <span>Daily goal · 120m</span>
                      </div>
                      <button
                        type="button"
                        className={`ext-mini-shield-toggle ${previewBlocker ? 'on' : ''}`}
                        onClick={() => setPreviewBlocker((b) => !b)}
                        aria-pressed={previewBlocker}
                      >
                        Shield {previewBlocker ? 'On' : 'Off'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Download CTA + Clean 3-Step Install */}
                <div className="ext-install-column">
                  <div className="ext-download-box">
                    <div className="ext-download-copy">
                      <h4>Ready for Chrome, Brave, Arc & Edge</h4>
                      <p>
                        Tracks focus blocks from your toolbar badge, blocks distracting sites automatically while a session runs, and syncs back to FLOWSTATE in one click.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="ext-primary-download-btn"
                      onClick={handleDownloadExtension}
                      disabled={downloadingExt}
                      data-testid="btn-download-chrome-extension"
                    >
                      <IconDownload size={16} />
                      <span>{downloadingExt ? 'Packaging Extension...' : 'Download Extension (.zip)'}</span>
                    </button>

                    <div className="ext-meta-strip">
                      <span>Manifest V3</span>
                      <span aria-hidden="true">·</span>
                      <span>Chrome Web Store ready</span>
                      <span aria-hidden="true">·</span>
                      <span>No account required</span>
                    </div>
                  </div>

                  <div className="ext-steps-section">
                    <div className="ext-steps-header">
                      <span>Quick 3-step setup</span>
                      <button
                        type="button"
                        className="ext-copy-addr-btn"
                        onClick={handleCopyExtAddress}
                      >
                        {copiedExtAddr ? 'Copied chrome://extensions' : 'Copy chrome://extensions'}
                      </button>
                    </div>

                    <ol className="ext-steps-ordered">
                      <li>
                        <span className="ext-step-idx">1</span>
                        <div>
                          <strong>Download & extract</strong>
                          <span>Unzip <kbd className="mac-kbd">flowstate-chrome-extension.zip</kbd> into a local folder.</span>
                        </div>
                      </li>
                      <li>
                        <span className="ext-step-idx">2</span>
                        <div>
                          <strong>Open Extensions & enable Developer mode</strong>
                          <span>Paste <kbd className="mac-kbd">chrome://extensions</kbd> in a new tab and toggle Developer mode on.</span>
                        </div>
                      </li>
                      <li>
                        <span className="ext-step-idx">3</span>
                        <div>
                          <strong>Load unpacked & pin</strong>
                          <span>Click <kbd className="mac-kbd">Load unpacked</kbd>, select the unzipped folder, and pin FLOWSTATE.</span>
                        </div>
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            ) : isStandalone ? (
              <div className="install-standalone-banner">
                <div className="install-success-icon">
                  <IconCheck size={24} color="#10b981" />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', color: '#6ee7b7', fontWeight: 700 }}>
                    Already running as a desktop app
                  </h4>
                  <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--ink-secondary)' }}>
                    FLOWSTATE is open in standalone window mode.
                  </p>
                </div>
              </div>
            ) : deferredPrompt ? (
              <div className="ext-download-box">
                <div className="ext-download-copy">
                  <h4>One-Click Desktop Installation</h4>
                  <p>Install FLOWSTATE into your Applications folder and pin it to your Dock or taskbar.</p>
                </div>
                <button
                  type="button"
                  className="ext-primary-download-btn"
                  onClick={handlePromptInstall}
                  disabled={installing}
                  id="btn-confirm-pwa-install"
                >
                  <IconDownload size={16} />
                  <span>{installing ? 'Adding...' : 'Install Desktop App'}</span>
                </button>
              </div>
            ) : isSafari ? (
              <div className="ext-steps-section">
                <div className="ext-steps-header">
                  <span>Safari on macOS</span>
                </div>
                <ol className="ext-steps-ordered">
                  <li>
                    <span className="ext-step-idx">1</span>
                    <div>
                      <strong>Add to Dock from Safari Menu</strong>
                      <span>
                        Click <kbd className="mac-kbd">File</kbd> → <kbd className="mac-kbd">Add to Dock...</kbd> → <kbd className="mac-kbd">Add</kbd>.
                      </span>
                    </div>
                  </li>
                </ol>
              </div>
            ) : (
              <div className="ext-steps-section">
                <div className="ext-steps-header">
                  <span>{isChrome ? 'Chrome · Arc · Edge' : 'Desktop Browser'}</span>
                </div>
                <ol className="ext-steps-ordered">
                  <li>
                    <span className="ext-step-idx">1</span>
                    <div>
                      <strong>Install from browser menu</strong>
                      <span>
                        Click <kbd className="mac-kbd">⋮</kbd> → <kbd className="mac-kbd">Cast, save, and share</kbd> → <kbd className="mac-kbd">Install FLOWSTATE...</kbd>
                      </span>
                    </div>
                  </li>
                </ol>
              </div>
            )}

            <div className="ext-modal-footer">
              <button type="button" className="ext-footer-btn" onClick={handleCopyUrl}>
                {copiedUrl ? 'Link Copied' : 'Copy App Link'}
              </button>
              <button type="button" className="ext-footer-btn ext-footer-btn--primary" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InstallModal;
