import React, { useRef } from 'react';

const fmt = (secs) => {
  if (!secs) return '0m';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

/**
 * Weekly focus report card modal with share canvas.
 */
const ReportCard = ({ isOpen, onClose, weeklyData, subjectBreakdown, currentStreak, totalFocusTime, totalSessions }) => {
  const canvasRef = useRef(null);
  if (!isOpen) return null;

  const thisWeekTotal = weeklyData?.reduce((acc, d) => acc + d.total, 0) || 0;
  const lastWeekApprox = Math.floor(thisWeekTotal * 0.85); // placeholder for trend
  const bestDay = weeklyData?.reduce((best, d) => d.total > (best?.total || 0) ? d : best, null);
  const topSubject = subjectBreakdown?.[0];

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    // Background
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0f172a');
    bg.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Header
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 18px system-ui';
    ctx.fillText('FMOOD', 32, 44);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '13px system-ui';
    ctx.fillText('Weekly Focus Report', 32, 64);

    // Stats
    const stats = [
      ['This Week', fmt(thisWeekTotal)],
      ['Sessions', String(totalSessions)],
      [`🔥 Streak`, `${currentStreak} days`],
      ['Top Subject', topSubject?.subject || '—'],
    ];

    stats.forEach(([label, value], i) => {
      const x = 32 + (i % 2) * 200;
      const y = 110 + Math.floor(i / 2) * 70;
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.roundRect(x, y, 170, 55, 8);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '11px system-ui';
      ctx.fillText(label.toUpperCase(), x + 12, y + 20);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px system-ui';
      ctx.fillText(value, x + 12, y + 42);
    });

    // Footer
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '11px system-ui';
    ctx.fillText('fmood.app', 32, H - 20);

    const link = document.createElement('a');
    link.download = 'fmood-report.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="report-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="report-card" onClick={e => e.stopPropagation()}>
        <div className="report-header">
          <div className="report-title">📊 Weekly Report</div>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        <div className="report-grid">
          <div className="report-stat">
            <div className="report-stat-label">This Week</div>
            <div className="report-stat-value">{fmt(thisWeekTotal)}</div>
          </div>
          <div className="report-stat">
            <div className="report-stat-label">Total Sessions</div>
            <div className="report-stat-value">{totalSessions}</div>
          </div>
          <div className="report-stat">
            <div className="report-stat-label">🔥 Current Streak</div>
            <div className="report-stat-value">{currentStreak} days</div>
          </div>
          <div className="report-stat">
            <div className="report-stat-label">All-Time Focus</div>
            <div className="report-stat-value">{fmt(totalFocusTime)}</div>
          </div>
        </div>

        {bestDay && (
          <div className="report-insight">
            <span className="report-insight-icon">⚡</span>
            <span>Best day this week: <strong>{bestDay.label}</strong> — {fmt(bestDay.total)}</span>
          </div>
        )}
        {topSubject && (
          <div className="report-insight">
            <span className="report-insight-icon">📚</span>
            <span>Most focused on: <strong>{topSubject.subject}</strong> — {fmt(topSubject.total)} total</span>
          </div>
        )}

        <button className="report-download-btn" onClick={handleDownload}>
          ⬇ Download Report Card
        </button>

        {/* Hidden canvas for PNG generation */}
        <canvas ref={canvasRef} width={440} height={260} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default ReportCard;
