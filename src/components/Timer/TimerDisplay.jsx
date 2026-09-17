import React from 'react';

const TimerDisplay = ({ timeLeft, isRunning, mode }) => {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  // For stopwatch, maybe show hours if it goes really long? 
  // Let's just stick to MM:SS or H:MM:SS if over an hour.
  let timeStr = '';
  if (timeLeft >= 3600) {
    const h = Math.floor(timeLeft / 3600);
    const m = Math.floor((timeLeft % 3600) / 60);
    const s = timeLeft % 60;
    timeStr = `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  } else {
    timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return (
    <div className="flocus-timer-wrapper">
      <div
        className={`flocus-timer-digits ${isRunning ? 'active' : ''}`}
        aria-live="polite"
        aria-atomic="true"
      >
        {timeStr}
      </div>
    </div>
  );
};

export default TimerDisplay;
