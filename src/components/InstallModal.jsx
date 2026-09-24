import React, { useState, useEffect } from 'react';
import { IconMac, IconDownload, IconCheck } from './Icons';
import { useToast } from './Toast/ToastProvider';

const InstallModal = ({ isOpen, onClose, deferredPrompt, onInstalled }) => {
  const { toast } = useToast();
  const [isMac, setIsMac] = useState(true);
  const [isSafari, setIsSafari] = useState(false);
  const [isChrome, setIsChrome] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || '';
    const platform = navigator.platform || '';
    const macDetected = platform.toUpperCase().indexOf('MAC') >= 0 || ua.indexOf('Macintosh') >= 0;
    const safariDetected = /^((?!chrome|android).)*safari/i.test(ua);
    const chromeDetected = /chrome|chromium|edg|brave/i.test(ua);
    const standaloneDetected = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

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
        toast('FMOOD added to your Mac Applications & Dock!', 'success', 3500);
        if (onInstalled) onInstalled();
        onClose();
      }
    } catch (err) {
      console.error('Install prompt error:', err);
    } finally {
      setInstalling(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.origin);
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
      >
        <div className="install-modal-card">
          <div className="install-modal-header">
            <div className="install-modal-badge-group">
              <div className="install-mac-icon-badge" style={{ display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                <img src="/favicon.svg" alt="App Icon" style={{ width: 28, height: 28, borderRadius: 6 }} />
              </div>
              <div>
                <h3 id="install-modal-title" className="install-modal-title">
                  {isMac ? 'Add to Mac Dock' : 'Install Desktop App'}
                </h3>
                <span className="install-modal-subtitle">
                  {isStandalone ? 'Running in standalone mode' : isMac ? 'macOS standalone experience' : 'Quick access from your desktop'}
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

          <div className="install-modal-body">
            {isStandalone ? (
              <div className="install-standalone-banner">
                <div className="install-success-icon">
                  <IconCheck size={24} color="#10b981" />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', color: '#10b981', fontWeight: 700 }}>
                    Already in your Mac Dock!
                  </h4>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    FMOOD is already running as a native standalone window. You can keep it in your Dock for quick one-click focus sessions.
                  </p>
                </div>
              </div>
            ) : deferredPrompt ? (
              <div className="install-prompt-section">
                <div className="install-highlight-card">
                  <div className="install-highlight-text">
                    <strong>One-Click Mac Dock Installation</strong>
                    <p>Click below to install FMOOD into your Applications folder and automatically pin it to your Mac Dock.</p>
                  </div>
                  <button
                    className="btn btn-primary install-action-btn"
                    onClick={handlePromptInstall}
                    disabled={installing}
                    id="btn-confirm-pwa-install"
                  >
                    <IconDownload size={16} />
                    {installing ? 'Adding to Dock...' : 'Install & Add to Dock'}
                  </button>
                </div>
              </div>
            ) : isSafari ? (
              <div className="install-safari-guide">
                <div className="install-guide-heading">
                  <span className="install-pill">Safari on macOS</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Native macOS Sonoma feature</span>
                </div>

                <div className="install-steps-list">
                  <div className="install-step-item">
                    <span className="install-step-num">1</span>
                    <div className="install-step-content">
                      <span className="install-step-title">Open the Safari Menu</span>
                      <span className="install-step-desc">
                        In the macOS menu bar at the top of your screen, click <kbd className="mac-kbd">File</kbd>
                      </span>
                    </div>
                  </div>

                  <div className="install-step-item">
                    <span className="install-step-num">2</span>
                    <div className="install-step-content">
                      <span className="install-step-title">Select "Add to Dock..."</span>
                      <span className="install-step-desc">
                        Click <kbd className="mac-kbd">Add to Dock...</kbd> from the dropdown menu
                      </span>
                    </div>
                  </div>

                  <div className="install-step-item">
                    <span className="install-step-num">3</span>
                    <div className="install-step-content">
                      <span className="install-step-title">Confirm & Launch</span>
                      <span className="install-step-desc">
                        Click <kbd className="mac-kbd">Add</kbd>. FMOOD will immediately appear in your Mac Dock as an app!
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="install-chrome-guide">
                <div className="install-guide-heading">
                  <span className="install-pill">{isChrome ? 'Chrome / Arc / Edge' : 'Desktop Browser'}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Add to Mac Dock</span>
                </div>

                <div className="install-steps-list">
                  <div className="install-step-item">
                    <span className="install-step-num">1</span>
                    <div className="install-step-content">
                      <span className="install-step-title">Check the URL Address Bar</span>
                      <span className="install-step-desc">
                        Look for the <strong style={{ color: 'var(--accent)' }}>Install app</strong> icon (⤓ or ⊕) on the right side of the address bar.
                      </span>
                    </div>
                  </div>

                  <div className="install-step-item">
                    <span className="install-step-num">2</span>
                    <div className="install-step-content">
                      <span className="install-step-title">Or use the Browser Menu</span>
                      <span className="install-step-desc">
                        Click <kbd className="mac-kbd">⋮</kbd> → <kbd className="mac-kbd">Cast, save, and share</kbd> → <kbd className="mac-kbd">Install FMOOD...</kbd>
                      </span>
                    </div>
                  </div>

                  <div className="install-step-item">
                    <span className="install-step-num">3</span>
                    <div className="install-step-content">
                      <span className="install-step-title">Keep in Mac Dock</span>
                      <span className="install-step-desc">
                        Right click the FMOOD icon in your Mac Dock → <kbd className="mac-kbd">Options</kbd> → <kbd className="mac-kbd">Keep in Dock</kbd>.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="install-modal-footer">
              <div className="install-footer-tip">
                <span style={{ color: 'var(--accent)' }}>✦ Tip:</span> Launch FMOOD anytime with Spotlight (<kbd className="mac-kbd">⌘</kbd> + <kbd className="mac-kbd">Space</kbd>) for distraction-free focus.
              </div>
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
                  Got it
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
