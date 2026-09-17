import React, { useState } from 'react';

const SettingsDrawer = ({ settings, onSave, onClose }) => {
  const durations = settings?.durations || {};

  const [pomodoro, setPomodoro] = useState(Math.round((durations.pomodoro || 1500) / 60));
  const [shortBreak, setShortBreak] = useState(Math.round((durations.shortBreak || 300) / 60));
  const [longBreak, setLongBreak] = useState(Math.round((durations.longBreak || 900) / 60));

  const handleSave = async () => {
    await onSave({
      durations: {
        pomodoro: Number(pomodoro) * 60,
        shortBreak: Number(shortBreak) * 60,
        longBreak: Number(longBreak) * 60,
      },
    });
    onClose();
  };

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} aria-hidden="true" />
      <aside className="drawer" role="dialog" aria-label="Settings" aria-modal="true">
        <div className="drawer-header">
          <h2 className="drawer-title">⚙ Settings</h2>
          <button className="drawer-close" onClick={onClose} aria-label="Close settings">✕</button>
        </div>

        <div className="setting-item">
          <label className="setting-label" htmlFor="setting-pomodoro">
            Pomodoro Duration (minutes)
          </label>
          <input
            id="setting-pomodoro"
            className="setting-input"
            type="number"
            min="1"
            max="90"
            value={pomodoro}
            onChange={(e) => setPomodoro(e.target.value)}
          />
        </div>

        <div className="setting-item">
          <label className="setting-label" htmlFor="setting-short-break">
            Short Break Duration (minutes)
          </label>
          <input
            id="setting-short-break"
            className="setting-input"
            type="number"
            min="1"
            max="30"
            value={shortBreak}
            onChange={(e) => setShortBreak(e.target.value)}
          />
        </div>

        <div className="setting-item">
          <label className="setting-label" htmlFor="setting-long-break">
            Long Break Duration (minutes)
          </label>
          <input
            id="setting-long-break"
            className="setting-input"
            type="number"
            min="1"
            max="60"
            value={longBreak}
            onChange={(e) => setLongBreak(e.target.value)}
          />
        </div>

        <div style={{ flex: 1 }} />

        <button className="save-btn" onClick={handleSave} id="settings-save-btn">
          Save Settings
        </button>
      </aside>
    </>
  );
};

export default SettingsDrawer;
