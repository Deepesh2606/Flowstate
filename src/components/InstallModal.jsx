import React, { useState, useEffect } from 'react';
import { IconDownload, IconCheck } from './Icons';
import { useToast } from './Toast/ToastProvider';

const InstallModal = ({ isOpen, onClose, deferredPrompt, onInstalled, initialTab = 'extension' }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isMac, setIsMac] = useState(true);
  const [isSafari, setIsSafari] = useState(false);
  const [isChrome, setIsChrome] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [downloadingExt, setDownloadingExt] = useState(false);

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
      toast('Downloaded flowstate-chrome-extension.zip — load it in chrome://extensions!', 'success', 4000);
    } catch (err) {
      console.error('Chrome extension download error:', err);
      toast('Could not download extension package. Try again.', 'error', 3000);
    } finally {
      setDownloadingExt(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard?.writeText(window.location.origin);
    setCopied(true);
    toast('App link copied to clipboard!', 'info', 2500);
    setTimeout(() => setCopied(false), 2500);
  };

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
        <div className="install-modal-card">
          <div className="install-modal-header">
            <div className="install-modal-badge-group">
              <div
                className="install-mac-icon-badge"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
              >
                <img src="/favicon.svg" alt="App Icon" style={{ width: 28, height: 28, borderRadius: 6 }} />
              </div>
              <div>
                <h3 id="install-modal-title" className="install-modal-title">
                  {activeTab === 'extension'
                    ? 'FLOWSTATE Chrome Extension'
                    : isMac
                      ? 'Add to Mac Dock'
                      : 'Install Desktop App'}
                </h3>
                <span className="install-modal-subtitle">
                  {activeTab === 'extension'
                    ? 'Manifest V3 · Toolbar countdown, goal ring & site blocker'
                    : isStandalone
                      ? 'Running in standalone mode'
                      : isMac
                        ? 'macOS standalone experience'
                        : 'Quick access from your desktop'}
                </span>
              </div>
            </div>
            <button
              className="drawer-close"
              onClick={onClose}
              aria-label="Close modal"
              style={{ width: '32px', height: '32px' }}
            >
              ✕
            </button>
          </div>

          {/* Tab Switcher */}
          <div style={{ padding: '0 20px 12px', display: 'flex', gap: '6px' }}>
            <button
              type="button"
              className={`btn ${activeTab === 'extension' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('extension')}
              style={{ flex: 1, fontSize: '12px', padding: '7px 12px' }}
              data-testid="install-tab-extension"
            >
              Chrome Extension
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'desktop' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('desktop')}
              style={{ flex: 1, fontSize: '12px', padding: '7px 12px' }}
              data-testid="install-tab-desktop"
            >
              {isMac ? 'Mac Dock / App' : 'Desktop App'}
            </button>
          </div>

          <div className="install-modal-body">
            {activeTab === 'extension' ? (
              <div className="install-chrome-guide">
                <div className="install-highlight-card" style={{ marginBottom: '14px' }}>
                  <div className="install-highlight-text">
                    <strong>Manifest V3 Chrome Extension (45m default)</strong>
                    <p>
                      Includes a 45-minute focus default, live toolbar countdown badge, daily deep work goal ring, distraction site blocker, and one-click launch back to FLOWSTATE. Packaged with manifest.json at the ZIP root for both local loading and Chrome Web Store submission.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary install-action-btn"
                    onClick={handleDownloadExtension}
                    disabled={downloadingExt}
                    data-testid="btn-download-chrome-extension"
                  >
                    <IconDownload size={16} />
                    {downloadingExt ? 'Packaging ZIP...' : 'Download Chrome Extension (.zip)'}
                  </button>
                </div>

                <div className="install-guide-heading">
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>Chrome · Brave · Arc · Edge</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>4-step install</span>
                </div>

                <div className="install-steps-list">
                  <div className="install-step-item">
                    <span className="install-step-num">1</span>
                    <div className="install-step-content">
                      <span className="install-step-title">Download & Unzip</span>
                      <span className="install-step-desc">
                        Click the download button above and extract <kbd className="mac-kbd">flowstate-chrome-extension.zip</kbd> into a folder.
                      </span>
                    </div>
                  </div>

                  <div className="install-step-item">
                    <span className="install-step-num">2</span>
                    <div className="install-step-content">
                      <span className="install-step-title">Open Chrome Extensions</span>
                      <span className="install-step-desc">
                        Go to <kbd className="mac-kbd">chrome://extensions</kbd> in a new browser tab.
                      </span>
                    </div>
                  </div>

                  <div className="install-step-item">
                    <span className="install-step-num">3</span>
                    <div className="install-step-content">
                      <span className="install-step-title">Enable Developer Mode</span>
                      <span className="install-step-desc">
                        Toggle <strong>Developer mode</strong> on in the top-right corner.
                      </span>
                    </div>
                  </div>

                  <div className="install-step-item">
                    <span className="install-step-num">4</span>
                    <div className="install-step-content">
                      <span className="install-step-title">Load Unpacked Folder</span>
                      <span className="install-step-desc">
                        Click <kbd className="mac-kbd">Load unpacked</kbd>, select the extracted folder containing <kbd className="mac-kbd">manifest.json</kbd>, and pin FLOWSTATE to your toolbar.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : isStandalone ? (
              <div className="install-standalone-banner">
                <div className="install-success-icon">
                  <IconCheck size={24} color="#10b981" />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', color: '#10b981', fontWeight: 700 }}>
                    Already in your Mac Dock!
                  </h4>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    FLOWSTATE is already running as a native standalone window.
                  </p>
                </div>
              </div>
            ) : deferredPrompt ? (
              <div className="install-prompt-section">
                <div className="install-highlight-card">
                  <div className="install-highlight-text">
                    <strong>One-Click Desktop Installation</strong>
                    <p>Install FLOWSTATE into your Applications folder and pin it to your Dock or taskbar.</p>
                  </div>
                  <button
                    className="btn btn-primary install-action-btn"
                    onClick={handlePromptInstall}
                    disabled={installing}
                    id="btn-confirm-pwa-install"
                  >
                    <IconDownload size={16} />
                    {installing ? 'Adding...' : 'Install Desktop App'}
                  </button>
                </div>
              </div>
            ) : isSafari ? (
              <div className="install-safari-guide">
                <div className="install-guide-heading">
                  <span className="install-pill">Safari on macOS</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Native macOS feature</span>
                </div>

                <div className="install-steps-list">
                  <div className="install-step-item">
                    <span className="install-step-num">1</span>
                    <div className="install-step-content">
                      <span className="install-step-title">Open the Safari Menu</span>
                      <span className="install-step-desc">
                        Click <kbd className="mac-kbd">File</kbd> → <kbd className="mac-kbd">Add to Dock...</kbd> → <kbd className="mac-kbd">Add</kbd>.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="install-chrome-guide">
                <div className="install-guide-heading">
                  <span className="install-pill">{isChrome ? 'Chrome / Arc / Edge' : 'Desktop Browser'}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Install App</span>
                </div>

                <div className="install-steps-list">
                  <div className="install-step-item">
                    <span className="install-step-num">1</span>
                    <div className="install-step-content">
                      <span className="install-step-title">Use the Address Bar or Browser Menu</span>
                      <span className="install-step-desc">
                        Click <kbd className="mac-kbd">⋮</kbd> → <kbd className="mac-kbd">Cast, save, and share</kbd> → <kbd className="mac-kbd">Install FLOWSTATE...</kbd>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="install-modal-footer">
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCopyUrl}
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                >
                  {copied ? '✓ Link Copied' : 'Copy App Link'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InstallModal;
