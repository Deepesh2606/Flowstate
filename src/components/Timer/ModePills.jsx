import React from 'react';

const MODES = [
  { id: 'pomodoro', label: 'FOCUS' },
  { id: 'shortBreak', label: 'SHORT BREAK' },
  { id: 'longBreak', label: 'LONG BREAK' },
  { id: 'stopwatch', label: 'STOPWATCH' },
];

const ModePills = ({ mode, onSwitch, onSelectClock }) => {
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
        {onSelectClock && (
          <button
            type="button"
            id="mode-clock"
            className="liquid-pill-btn"
            onClick={onSelectClock}
            title="Switch to Live Real-Time Clock"
          >
            <span className="liquid-pill-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span className="live-pulse-dot" style={{ width: '6px', height: '6px' }} />
              CLOCK
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ModePills;

