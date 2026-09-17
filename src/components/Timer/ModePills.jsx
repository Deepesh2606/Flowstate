import React from 'react';

const MODES = [
  { id: 'pomodoro', label: 'Pomodoro', emoji: '🍅' },
  { id: 'shortBreak', label: 'Short Break', emoji: '☕' },
  { id: 'longBreak', label: 'Long Break', emoji: '🌙' },
];

const ModePills = ({ mode, onSwitch }) => {
  return (
    <div className="pill-group" role="group" aria-label="Timer mode">
      {MODES.map((m) => (
        <button
          key={m.id}
          id={`mode-${m.id}`}
          className={`pill ${mode === m.id ? 'active' : ''}`}
          onClick={() => onSwitch(m.id)}
          aria-pressed={mode === m.id}
        >
          {m.emoji} {m.label}
        </button>
      ))}
    </div>
  );
};

export default ModePills;
