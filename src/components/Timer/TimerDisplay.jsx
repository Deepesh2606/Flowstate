import React from 'react';
import FlipCard from './FlipCard';

const TimerDisplay = ({
  progress = 0,
  timeLeft,
  stopwatchMs = 0,
  isRunning,
  mode,
  hasWallpaper,
  clockStyle = 'digital',
  timerStyle = 'default',
  showProgressBar = true,
  showSeconds = true,
}) => {
  const isOverHour = timeLeft >= 3600;
  const hours = Math.floor(timeLeft / 3600);
  const minutes = isOverHour ? Math.floor((timeLeft % 3600) / 60) : Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isStopwatch = mode === 'stopwatch';
  const msFormatted = String(stopwatchMs).padStart(2, '0');

  // Resolved timer style (clockStyle === 'flip' acts as flip if timerStyle is default)
  const resolvedStyle = timerStyle !== 'default' ? timerStyle : (clockStyle === 'flip' ? 'flip' : 'default');

  // Digital time string
  let timeStr = '';
  if (isOverHour) {
    timeStr = showSeconds
      ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      : `${hours}:${String(minutes).padStart(2, '0')}`;
  } else {
    timeStr = showSeconds
      ? `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      : String(minutes).padStart(2, '0');
  }

  // Gauge calculations
  const radius = 95;
  const circumference = 2 * Math.PI * radius;
  const gaugeOffset = circumference * (1 - Math.min(1, Math.max(0, progress)));

  // Dot matrix: 20 dots
  const totalDots = 20;
  const activeDots = Math.round(progress * totalDots);

  return (
    <div className={`flocus-timer-wrapper timer-style-${resolvedStyle}`} style={{ position: 'relative' }}>
      {!hasWallpaper && <div className="liquid-orb" />}

      {/* 1. FLIP CLOCK STYLE */}
      {resolvedStyle === 'flip' ? (
        <div
          className={`flip-clock-container ${isRunning ? 'active' : ''}`}
          aria-live="polite"
          aria-atomic="true"
        >
          {isOverHour && (
            <>
              <FlipCard value={hours} label="HOURS" />
              <div className="flip-clock-colon">:</div>
            </>
          )}
          <FlipCard value={minutes} label="MINUTES" />
          {showSeconds && (
            <>
              <div className="flip-clock-colon">:</div>
              <FlipCard value={seconds} label="SECONDS" />
            </>
          )}
          {isStopwatch && (
            <div className="flip-card-unit flip-card-ms-unit">
              <div className="flip-card-wrapper flip-ms-wrapper">
                <div className="flip-flap flip-top-static">
                  <span>.{msFormatted}</span>
                </div>
                <div className="flip-flap flip-bottom-static">
                  <span>.{msFormatted}</span>
                </div>
                <div className="flip-divider-seam" />
              </div>
              <div className="flip-card-label">MS</div>
            </div>
          )}
        </div>
      ) : resolvedStyle === 'gauge' ? (
        /* 2. GAUGE STYLE (Radial ring with digits in center) */
        <div className={`timer-gauge-container ${isRunning ? 'active' : ''}`}>
          <svg className="timer-gauge-svg" viewBox="0 0 220 220" width="230" height="230">
            <circle
              className="timer-gauge-track"
              cx="110"
              cy="110"
              r={radius}
              fill="none"
              strokeWidth="10"
            />
            <circle
              className="timer-gauge-fill"
              cx="110"
              cy="110"
              r={radius}
              fill="none"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={gaugeOffset}
              transform="rotate(-90 110 110)"
            />
          </svg>
          <div className="timer-gauge-center-digits" aria-live="polite" aria-atomic="true">
            <span>{timeStr}</span>
            {isStopwatch && <span className="stopwatch-ms">.{msFormatted}</span>}
          </div>
        </div>
      ) : resolvedStyle === 'dotmatrix' ? (
        /* 3. DOT MATRIX STYLE */
        <div className={`timer-dotmatrix-container ${isRunning ? 'active' : ''}`}>
          <div className="timer-dotmatrix-grid" role="meter" aria-valuenow={Math.round(progress * 100)}>
            {Array.from({ length: totalDots }).map((_, i) => (
              <span
                key={i}
                className={`timer-dotmatrix-dot ${i < activeDots ? 'active' : ''}`}
              />
            ))}
          </div>
          <div className="flocus-timer-digits" aria-live="polite" aria-atomic="true">
            <span>{timeStr}</span>
            {isStopwatch && <span className="stopwatch-ms">.{msFormatted}</span>}
          </div>
        </div>
      ) : resolvedStyle === 'pie' ? (
        /* 4. PIE STYLE */
        <div className={`timer-pie-container ${isRunning ? 'active' : ''}`}>
          <div className="timer-pie-indicator">
            <svg viewBox="0 0 60 60" width="56" height="56">
              <circle cx="30" cy="30" r="26" fill="rgba(255, 255, 255, 0.08)" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="2" />
              <circle
                cx="30"
                cy="30"
                r="13"
                fill="none"
                stroke="var(--accent, #06b6d4)"
                strokeWidth="26"
                strokeDasharray={2 * Math.PI * 13}
                strokeDashoffset={2 * Math.PI * 13 * (1 - Math.min(1, Math.max(0, progress)))}
                transform="rotate(-90 30 30)"
                style={{ transition: 'stroke-dashoffset 0.3s ease' }}
              />
            </svg>
          </div>
          <div className="flocus-timer-digits" aria-live="polite" aria-atomic="true">
            <span>{timeStr}</span>
            {isStopwatch && <span className="stopwatch-ms">.{msFormatted}</span>}
          </div>
        </div>
      ) : resolvedStyle === 'progress' ? (
        /* 5. PROGRESS BAR STYLE */
        <div className={`timer-progressbar-style-container ${isRunning ? 'active' : ''}`}>
          <div className="flocus-timer-digits" aria-live="polite" aria-atomic="true">
            <span>{timeStr}</span>
            {isStopwatch && <span className="stopwatch-ms">.{msFormatted}</span>}
          </div>
          <div className="timer-integrated-progress-track">
            <div
              className="timer-integrated-progress-fill"
              style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
            />
          </div>
        </div>
      ) : (
        /* 6. DEFAULT DIGITAL STYLE */
        <div
          className={`flocus-timer-digits ${isRunning ? 'active' : ''}`}
          aria-live="polite"
          aria-atomic="true"
        >
          <span>{timeStr}</span>
          {isStopwatch && <span className="stopwatch-ms">.{msFormatted}</span>}
        </div>
      )}

      {/* Optional global progress bar beneath timer if enabled */}
      {showProgressBar && mode !== 'stopwatch' && resolvedStyle !== 'progress' && resolvedStyle !== 'gauge' && (
        <div className="timer-bottom-progress-bar" role="progressbar" aria-valuenow={Math.round(progress * 100)}>
          <div
            className="timer-bottom-progress-fill"
            style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default TimerDisplay;

