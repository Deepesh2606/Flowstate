import React, { useRef } from 'react';

const fmt = (secs) => {
  if (!secs) return '0m';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

/**
 * Shareable session card — renders to canvas for PNG download.
 */
const ShareCard = ({ isOpen, onClose, duration, subject, sessionCount }) => {
  const canvasRef = useRef(null);
  if (!isOpen) return null;

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0f172a');
    bg.addColorStop(0.5, '#1e1b4b');
    bg.addColorStop(1, '#0c1a2e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Decorative orb
    const grad = ctx.createRadialGradient(W * 0.8, H * 0.2, 0, W * 0.8, H * 0.2, 150);
    grad.addColorStop(0, 'rgba(6,182,212,0.25)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // App logo text
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText('DEEPLY', 32, 44);

    // Tagline
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('Focus Session Complete', 32, 64);

    // Duration — big
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 52px system-ui, sans-serif';
    ctx.fillText(fmt(duration), 32, 148);

    // Subject
    if (subject) {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillText(`on ${subject}`, 32, 176);
    }

    // Session count badge
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.roundRect(32, 200, 140, 36, 8);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(`🎯 Session #${sessionCount}`, 46, 223);

    // Date
    const dateStr = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText(dateStr, 32, H - 20);

    const link = document.createElement('a');
    link.download = 'deeply-session.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleCopy = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    handleDownload(); // trigger draw first
    try {
      canvas.toBlob(async (blob) => {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      });
    } catch (e) {
      console.warn('Copy to clipboard not supported');
    }
  };

  return (
    <div className="share-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="share-card-modal" onClick={e => e.stopPropagation()}>
        <div className="share-card-header">
          <div className="share-card-title">📤 Share Your Session</div>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        <div className="share-card-preview">
          <div className="share-preview-inner">
            <div className="share-preview-app">DEEPLY</div>
            <div className="share-preview-dur">{fmt(duration)}</div>
            {subject && <div className="share-preview-subj">on {subject}</div>}
            <div className="share-preview-session">🎯 Session #{sessionCount}</div>
          </div>
        </div>

        <div className="share-card-actions">
          <button type="button" className="share-action-btn" onClick={handleDownload}>
            ⬇ Download PNG
          </button>
          <button type="button" className="share-action-btn secondary" onClick={handleCopy}>
            📋 Copy Image
          </button>
        </div>

        <canvas ref={canvasRef} width={400} height={260} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default ShareCard;
