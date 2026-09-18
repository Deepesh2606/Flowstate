import React from 'react';

const MODES = [
  { id: 'pomodoro', label: 'FOCUS' },
  { id: 'shortBreak', label: 'SHORT BREAK' },
  { id: 'longBreak', label: 'LONG BREAK' },
  { id: 'stopwatch', label: 'STOPWATCH' },
];

// Clock pill is intentionally NOT shown in timer mode pills.
// It appears alongside Stopwatch in the ClockTab navigation instead.

const ModePills = ({ mode, onSwitch }) => {
  return (
    <div className="liquid-pills-wrapper" role="group" aria-label="Timer mode">
      <div className="liquid-pill-track">
        {MODES.map((m) => {
          const isActive = mode === m.id;
          return (
            <button
              key={m.id}
              id={`mode-${m.id}`}
              className={`liquid-pill-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSwitch(m.id)}
              aria-pressed={isActive}
            >
              {isActive && <span className="liquid-pill-glaze" aria-hidden="true" />}
              <span className="liquid-pill-label">{m.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ModePills;

