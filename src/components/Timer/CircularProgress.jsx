import React from 'react';

const RADIUS = 90;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const MODE_LABELS = {
  pomodoro: 'Focus',
  shortBreak: 'Short Break',
  longBreak: 'Long Break',
};

const CircularProgress = ({ progress, timeLeft, mode, isRunning }) => {
  const offset = CIRCUMFERENCE * (1 - progress);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="timer-ring-container">
      <svg
        className="timer-ring-svg"
        width="220"
        height="220"
        viewBox="0 0 220 220"
        aria-hidden="true"
      >
        {/* Track ring */}
        <circle
          className="timer-ring-track"
          cx="110"
          cy="110"
          r={RADIUS}
          strokeWidth="8"
        />
        {/* Progress ring */}
        <circle
          className={`timer-ring-progress ${isRunning && mode === 'pomodoro' ? 'pulsing' : ''}`}
          cx="110"
          cy="110"
          r={RADIUS}
          strokeWidth="8"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>

      <div className="timer-center">
        <div className="timer-time" aria-live="polite" aria-atomic="true">
          {timeStr}
        </div>
        <div className="timer-mode-label">{MODE_LABELS[mode]}</div>
      </div>
    </div>
  );
};

export default CircularProgress;
