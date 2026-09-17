import React, { useState } from 'react';
import { useToast } from '../Toast/ToastProvider';
import { IconSettings, IconFocus, IconInfo } from '../Icons';

const Toggle = ({ id, checked, onChange, label, sub }) => (
  <div className="setting-toggle-row" id={`row-${id}`}>
    <div>
      <div className="setting-toggle-label">{label}</div>
      {sub && <div className="setting-toggle-sub">{sub}</div>}
    </div>
    <button
      id={id}
      className={`toggle-switch ${checked ? 'on' : ''}`}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      aria-label={label}
    >
      <span className="toggle-thumb" />
    </button>
  </div>
);

const SettingsDrawer = ({ settings, onSave, onClose }) => {
  const { toast } = useToast();
  const d = settings?.durations || {};

  // Timer durations
  const [pomodoro, setPomodoro]       = useState(Math.round((d.pomodoro   || 2700) / 60));
  const [shortBreak, setShortBreak]   = useState(Math.round((d.shortBreak || 300)  / 60));
  const [longBreak, setLongBreak]     = useState(Math.round((d.longBreak  || 900)  / 60));
  const [longBreakInterval, setLongBreakInterval] = useState(settings?.longBreakInterval || 4);
  const [dailyGoal, setDailyGoal]     = useState(settings?.dailyGoal || 8);

  // Behaviour toggles
  const [autoStartBreaks, setAutoStartBreaks]       = useState(settings?.autoStartBreaks ?? false);
  const [autoStartPomodoros, setAutoStartPomodoros] = useState(settings?.autoStartPomodoros ?? false);
  const [soundEnabled, setSoundEnabled]             = useState(settings?.soundEnabled ?? true);
  const [notifyOnComplete, setNotifyOnComplete]     = useState(settings?.notifyOnComplete ?? true);

  const handleSave = async () => {
    await onSave({
      durations: {
        pomodoro:   Math.max(1, Number(pomodoro))   * 60,
        shortBreak: Math.max(1, Number(shortBreak)) * 60,
        longBreak:  Math.max(1, Number(longBreak))  * 60,
      },
      longBreakInterval: Math.max(1, Number(longBreakInterval)),
      dailyGoal:         Math.max(1, Number(dailyGoal)),
      autoStartBreaks,
      autoStartPomodoros,
      soundEnabled,
      notifyOnComplete,
    });
    toast('Settings saved!', 'success');
    onClose();
  };

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} aria-hidden="true" />
      <aside className="drawer" role="dialog" aria-label="Settings" aria-modal="true">

        <div className="drawer-header">
          <h2 className="drawer-title">Settings</h2>
          <button className="drawer-close" onClick={onClose} aria-label="Close settings">✕</button>
        </div>

        {/* ── Timer Durations ── */}
        <div className="settings-section">
          <div className="settings-section-title"><IconSettings size={14} /> Timer Durations</div>

          <div className="setting-item">
            <label className="setting-label" htmlFor="setting-pomodoro">Focus (minutes)</label>
            <div className="setting-input-row">
              <button className="setting-stepper" onClick={() => setPomodoro(Math.max(1, pomodoro - 1))}>−</button>
              <input
                id="setting-pomodoro"
                className="setting-input setting-input-center"
                type="number" min="1" max="90"
                value={pomodoro}
                onChange={(e) => setPomodoro(Number(e.target.value))}
              />
              <button className="setting-stepper" onClick={() => setPomodoro(Math.min(90, pomodoro + 1))}>+</button>
            </div>
          </div>

          <div className="setting-item">
            <label className="setting-label" htmlFor="setting-short-break">Short Break (minutes)</label>
            <div className="setting-input-row">
              <button className="setting-stepper" onClick={() => setShortBreak(Math.max(1, shortBreak - 1))}>−</button>
              <input
                id="setting-short-break"
                className="setting-input setting-input-center"
                type="number" min="1" max="30"
                value={shortBreak}
                onChange={(e) => setShortBreak(Number(e.target.value))}
              />
              <button className="setting-stepper" onClick={() => setShortBreak(Math.min(30, shortBreak + 1))}>+</button>
            </div>
          </div>

          <div className="setting-item">
            <label className="setting-label" htmlFor="setting-long-break">Long Break (minutes)</label>
            <div className="setting-input-row">
              <button className="setting-stepper" onClick={() => setLongBreak(Math.max(1, longBreak - 1))}>−</button>
              <input
                id="setting-long-break"
                className="setting-input setting-input-center"
                type="number" min="1" max="60"
                value={longBreak}
                onChange={(e) => setLongBreak(Number(e.target.value))}
              />
              <button className="setting-stepper" onClick={() => setLongBreak(Math.min(60, longBreak + 1))}>+</button>
            </div>
          </div>

          <div className="setting-item">
            <label className="setting-label" htmlFor="setting-interval">Long Break Every (sessions)</label>
            <div className="setting-input-row">
              <button className="setting-stepper" onClick={() => setLongBreakInterval(Math.max(1, longBreakInterval - 1))}>−</button>
              <input
                id="setting-interval"
                className="setting-input setting-input-center"
                type="number" min="1" max="10"
                value={longBreakInterval}
                onChange={(e) => setLongBreakInterval(Number(e.target.value))}
              />
              <button className="setting-stepper" onClick={() => setLongBreakInterval(Math.min(10, longBreakInterval + 1))}>+</button>
            </div>
          </div>

          <div className="setting-item">
            <label className="setting-label" htmlFor="setting-goal">Daily Session Goal</label>
            <div className="setting-input-row">
              <button className="setting-stepper" onClick={() => setDailyGoal(Math.max(1, dailyGoal - 1))}>−</button>
              <input
                id="setting-goal"
                className="setting-input setting-input-center"
                type="number" min="1" max="20"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(Number(e.target.value))}
              />
              <button className="setting-stepper" onClick={() => setDailyGoal(Math.min(20, dailyGoal + 1))}>+</button>
            </div>
          </div>
        </div>

        {/* ── Behaviour ── */}
        <div className="settings-section">
          <div className="settings-section-title"><IconFocus size={14} /> Behaviour</div>

          <Toggle
            id="toggle-auto-breaks"
            checked={autoStartBreaks}
            onChange={setAutoStartBreaks}
            label="Auto-start Breaks"
            sub="Breaks begin automatically after focus ends"
          />
          <Toggle
            id="toggle-auto-pomodoros"
            checked={autoStartPomodoros}
            onChange={setAutoStartPomodoros}
            label="Auto-start Focus"
            sub="Focus timer starts after break ends"
          />
        </div>

        {/* ── Sound & Notifications ── */}
        <div className="settings-section">
          <div className="settings-section-title"><IconInfo size={14} /> Sound & Notifications</div>

          <Toggle
            id="toggle-sound"
            checked={soundEnabled}
            onChange={setSoundEnabled}
            label="Sound Effects"
            sub="Chime when session completes"
          />
          <Toggle
            id="toggle-notify"
            checked={notifyOnComplete}
            onChange={setNotifyOnComplete}
            label="Toast Notifications"
            sub="Show alerts for session events"
          />
        </div>

        <button className="save-btn" onClick={handleSave} id="settings-save-btn">
          Save Settings
        </button>
      </aside>
    </>
  );
};

export default SettingsDrawer;
