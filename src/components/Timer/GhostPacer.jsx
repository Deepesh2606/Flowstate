import React, { useState } from 'react';
import { useStats } from '../../hooks/useStats';

const STORAGE_KEY = 'fmood_ghost_pacer_collapsed';

export const GhostPacer = () => {
  const { sessions } = useStats();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [showInfo, setShowInfo] = useState(false);

  const toggleCollapsed = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {}
      return next;
    });
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const now = new Date();
  const currentDayMinute = now.getHours() * 60 + now.getMinutes();

  // Today's focus time
  const todaySessions = sessions.filter(s => s.date === todayStr);
  const todaySeconds = todaySessions.reduce((acc, s) => acc + (s.duration || 0), 0);
  const todayMinutes = Math.round(todaySeconds / 60);

  // Ghost comparison date: yesterday, or most recent active study day
  const yesterdaySessions = sessions.filter(s => s.date === yesterdayStr);
  const pastSessions = sessions.filter(s => s.date !== todayStr);
  const pastDates = [...new Set(pastSessions.map(s => s.date))].sort().reverse();
  const ghostDate = yesterdaySessions.length > 0 ? yesterdayStr : pastDates[0] || null;

  let ghostSecondsSoFar = 0;
  let isFromYesterday = ghostDate === yesterdayStr;

  if (ghostDate) {
    const ghostSessions = sessions.filter(s => s.date === ghostDate);
    ghostSessions.forEach(s => {
      if (s.timestamp) {
        const sDate = new Date(s.timestamp);
        const sMinute = sDate.getHours() * 60 + sDate.getMinutes();
        if (sMinute <= currentDayMinute) {
          ghostSecondsSoFar += (s.duration || 0);
        }
      } else {
        ghostSecondsSoFar += (s.duration || 0);
      }
    });
  }

  const ghostMinutes = Math.round(ghostSecondsSoFar / 60);
  const hasGhostData = Boolean(ghostDate && (ghostMinutes > 0 || todayMinutes > 0));
  const diffMinutes = todayMinutes - ghostMinutes;

  const maxTrack = Math.max(todayMinutes, ghostMinutes, 60);
  const userPct = Math.min(95, Math.max(5, Math.round((todayMinutes / maxTrack) * 100)));
  const ghostPct = Math.min(95, Math.max(5, Math.round((ghostMinutes / maxTrack) * 100)));

  const formatTimeStr = (mins) => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const ghostLabel = isFromYesterday
    ? 'Yesterday at this time'
    : ghostDate
    ? `Last active (${new Date(ghostDate + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' })})`
    : 'No past session yet';

  return (
    <div className={`ghost-pacer-container ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Collapsed Pill */}
      {isCollapsed ? (
        <button
          type="button"
          className="ghost-pacer-pill"
          onClick={toggleCollapsed}
          title="Click to view Ghost Pacer (Race against yesterday)"
        >
          <span className="ghost-icon-pulse">👻</span>
          <span className="ghost-pill-text">
            {!hasGhostData ? (
              'Ghost Pacer: Set today\'s pace'
            ) : diffMinutes > 0 ? (
              <span className="ghost-lead-ahead">+{formatTimeStr(diffMinutes)} ahead of ghost</span>
            ) : diffMinutes < 0 ? (
              <span className="ghost-lead-behind">{formatTimeStr(Math.abs(diffMinutes))} behind ghost</span>
            ) : (
              <span>Tied with ghost ({formatTimeStr(todayMinutes)})</span>
            )}
          </span>
          <span className="ghost-pill-expand-icon">▾</span>
        </button>
      ) : (
        /* Expanded HUD */
        <div className="ghost-pacer-card">
          <div className="ghost-pacer-header">
            <div className="ghost-pacer-title-group">
              <span className="ghost-title-icon">👻</span>
              <div>
                <div className="ghost-title">
                  Ghost Pacer
                  <button
                    type="button"
                    className="ghost-info-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowInfo(v => !v);
                    }}
                    title="What is Ghost Pacer?"
                    aria-label="What is Ghost Pacer?"
                  >
                    ⓘ
                  </button>
                </div>
                <div className="ghost-subtitle">{ghostLabel}</div>
              </div>
            </div>

            <div className="ghost-header-actions">
              {hasGhostData && (
                <div className={`ghost-status-badge ${diffMinutes >= 0 ? 'ahead' : 'behind'}`}>
                  {diffMinutes > 0 ? (
                    `+${formatTimeStr(diffMinutes)} ahead`
                  ) : diffMinutes < 0 ? (
                    `${formatTimeStr(Math.abs(diffMinutes))} behind`
                  ) : (
                    'On pace'
                  )}
                </div>
              )}
              <button
                type="button"
                className="ghost-collapse-btn"
                onClick={toggleCollapsed}
                title="Minimize Ghost Pacer"
                aria-label="Minimize Ghost Pacer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Info Tooltip Card */}
          {showInfo && (
            <div className="ghost-info-popover">
              <div className="ghost-info-text">
                <strong>Race against your past self!</strong><br />
                Inspired by Mario Kart, Ghost Pacer shows how much focus time you had logged by <em>this exact minute</em> yesterday. Keep ahead of your ghost to level up your consistency!
              </div>
              <button type="button" className="ghost-info-close" onClick={() => setShowInfo(false)}>
                Got it
              </button>
            </div>
          )}

          {/* Race Track */}
          <div className="ghost-race-track-wrapper">
            <div className="ghost-track-line">
              {/* Ghost Marker */}
              {hasGhostData && ghostMinutes > 0 && (
                <div
                  className="ghost-marker ghost-avatar-marker"
                  style={{ left: `${ghostPct}%` }}
                  title={`Ghost: ${formatTimeStr(ghostMinutes)}`}
                >
                  <span className="ghost-marker-icon">👻</span>
                  <span className="ghost-marker-label">{formatTimeStr(ghostMinutes)}</span>
                </div>
              )}

              {/* User Marker */}
              <div
                className="ghost-marker user-avatar-marker"
                style={{ left: `${userPct}%` }}
                title={`You: ${formatTimeStr(todayMinutes)}`}
              >
                <span className="ghost-marker-icon">🏃</span>
                <span className="ghost-marker-label">{formatTimeStr(todayMinutes)}</span>
              </div>
            </div>

            {/* Track Legend / Summary */}
            <div className="ghost-track-legend">
              <span className="ghost-legend-item">
                <span className="ghost-legend-dot user-dot" /> You (Today): <strong>{formatTimeStr(todayMinutes)}</strong>
              </span>
              <span className="ghost-legend-item">
                <span className="ghost-legend-dot ghost-dot" /> Ghost: <strong>{formatTimeStr(ghostMinutes)}</strong>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GhostPacer;
