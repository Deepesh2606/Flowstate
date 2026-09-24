import React, { useState } from 'react';
import { IconPip, IconCheck } from '../Icons';

const PipHelpModal = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="auth-modal-card pip-help-card" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose} aria-label="Close modal">
          ✕
        </button>

        <div className="auth-modal-header" style={{ marginBottom: '16px' }}>
          <div className="pip-help-icon-wrapper">
            <IconPip size={26} color="var(--accent)" />
          </div>
          <h2 className="auth-modal-title" style={{ fontSize: '1.25rem' }}>
            Picture-in-Picture Support
          </h2>
          <p className="auth-modal-desc" style={{ marginBottom: '16px' }}>
            Interactive floating timer windows use the <strong>Document Picture-in-Picture</strong> standard.
          </p>
        </div>

        <div className="pip-browser-list">
          <div className="pip-browser-row supported">
            <div className="pip-browser-status">✅ Fully Supported</div>
            <div className="pip-browser-names">
              <strong>Google Chrome</strong>, <strong>Microsoft Edge</strong>, <strong>Brave</strong>, <strong>Arc</strong>, <strong>Opera</strong>
            </div>
            <div className="pip-browser-sub">Full interactive floating timer with play, pause & skip buttons.</div>
          </div>

          <div className="pip-browser-row unsupported">
            <div className="pip-browser-status">⚠️ Safari & Firefox</div>
            <div className="pip-browser-names">
              Apple WebKit does not support Document PiP yet.
            </div>
            <div className="pip-browser-sub">
              Apple restricts Picture-in-Picture to video playback only, preventing interactive timer widgets.
            </div>
          </div>
        </div>

        <div className="pip-safari-tip">
          <div className="pip-safari-tip-title">💡 Tip for Safari Users:</div>
          <div className="pip-safari-tip-text">
            On macOS Sonoma+, click <strong>File → Add to Dock</strong> in Safari to run Fmood as a standalone compact window, or open Fmood in Chrome/Edge/Brave.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            type="button"
            className="pip-action-btn secondary"
            onClick={handleCopyLink}
            id="pip-copy-link-btn"
          >
            {copied ? (
              <>
                <IconCheck size={14} color="#10b981" /> Copied!
              </>
            ) : (
              'Copy Link for Chrome'
            )}
          </button>
          <button
            type="button"
            className="pip-action-btn primary"
            onClick={onClose}
            id="pip-close-btn"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};

export default PipHelpModal;
