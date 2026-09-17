import React, { useEffect, useRef } from 'react';

const MODE_CONFIG = {
  pomodoro:   { label: 'Focus Time', emoji: '🍅', color: '#00C896', glow: 'rgba(0,200,150,0.25)' },
  shortBreak: { label: 'Short Break', emoji: '☕', color: '#60a5fa', glow: 'rgba(96,165,250,0.25)' },
  longBreak:  { label: 'Long Break', emoji: '🌙', color: '#a78bfa', glow: 'rgba(167,139,250,0.25)' },
};

const TimerDisplay = ({ progress, timeLeft, mode, isRunning }) => {
  const cfg = MODE_CONFIG[mode] || MODE_CONFIG.pomodoro;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const pct = Math.round(progress * 100);

  return (
    <div className="timer-card" style={{ '--mode-color': cfg.color, '--mode-glow': cfg.glow }}>
      {/* Ambient glow orb */}
      <div className="timer-glow-orb" style={{ background: cfg.glow }} />

      {/* Mode badge */}
      <div className="timer-mode-badge">
        <span>{cfg.emoji}</span>
        <span>{cfg.label}</span>
        {isRunning && <span className="timer-live-dot" style={{ background: cfg.color }} />}
      </div>

      {/* Main time display */}
      <div
        className={`timer-digits ${isRunning && mode === 'pomodoro' ? 'timer-digits-pulse' : ''}`}
        style={{ color: cfg.color }}
        aria-live="polite"
        aria-atomic="true"
        aria-label={`${minutes} minutes ${seconds} seconds remaining`}
      >
        {timeStr}
      </div>

      {/* Progress bar */}
      <div className="timer-progress-track">
        <div
          className="timer-progress-fill"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${cfg.color}88, ${cfg.color})`,
            boxShadow: `0 0 12px ${cfg.glow}`,
          }}
        />
        <span className="timer-pct-label" style={{ color: cfg.color }}>{pct}%</span>
      </div>
    </div>
  );
};

export default TimerDisplay;
