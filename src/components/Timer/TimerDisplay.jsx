import React from 'react';
import FlipCard from './FlipCard';

const TimerDisplay = ({
  timeLeft,
  stopwatchMs = 0,
  isRunning,
  mode,
  hasWallpaper,
  clockStyle = 'digital',
  showSeconds = true,
}) => {
  const isOverHour = timeLeft >= 3600;
  const hours = Math.floor(timeLeft / 3600);
  const minutes = isOverHour ? Math.floor((timeLeft % 3600) / 60) : Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isStopwatch = mode === 'stopwatch';
  const msFormatted = String(stopwatchMs).padStart(2, '0');

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

  return (
    <div className="flocus-timer-wrapper" style={{ position: 'relative' }}>
      {!hasWallpaper && <div className="liquid-orb" />}

      {clockStyle === 'flip' ? (
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
      ) : (
        <div
          className={`flocus-timer-digits ${isRunning ? 'active' : ''}`}
          aria-live="polite"
          aria-atomic="true"
        >
          <span>{timeStr}</span>
          {isStopwatch && (
            <span className="stopwatch-ms">.{msFormatted}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default TimerDisplay;

