import React from 'react';

const MODES = [
  { id: 'pomodoro', label: 'FOCUS' },
  { id: 'shortBreak', label: 'SHORT BREAK' },
  { id: 'longBreak', label: 'LONG BREAK' },
  { id: 'stopwatch', label: 'STOPWATCH' },
];

const ModePills = ({ mode, onSwitch }) => {
  return (
    <div className="flocus-mode-group" role="group" aria-label="Timer mode">
      {MODES.map((m) => (
        <button
          key={m.id}
          id={`mode-${m.id}`}
          className={`flocus-mode-btn ${mode === m.id ? 'active' : ''}`}
          onClick={() => onSwitch(m.id)}
          aria-pressed={mode === m.id}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
};

export default ModePills;
