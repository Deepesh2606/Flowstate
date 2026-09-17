import React, { useState } from 'react';
import { useToast } from '../Toast/ToastProvider';
import { IconSettings, IconFocus, IconInfo, IconBook } from '../Icons';

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
  
  // Customization
  const [autoClockColor, setAutoClockColor]         = useState(settings?.autoClockColor ?? true);
  const [textColor, setTextColor]                   = useState(settings?.textColor || '#ffffff');
  const [subjectColor, setSubjectColor]             = useState(settings?.subjectColor || '#06b6d4');
  const [clockFont, setClockFont]                   = useState(settings?.clockFont || 'Inter, system-ui, sans-serif');

  // Study Targets
  const defaultTargets = [{ id: '1', name: 'SSC CGL', subjects: ['Quant', 'English', 'GK', 'Reasoning'] }];
  const [targetsRaw, setTargetsRaw] = useState((settings?.targets || defaultTargets).map(t => ({
    ...t,
    subjectsStr: t.subjects.join(', ')
  })));

  const handleUpdateTarget = (index, field, value) => {
    const newTargets = [...targetsRaw];
    newTargets[index][field] = value;
    setTargetsRaw(newTargets);
  };

  const handleAddTarget = () => {
    setTargetsRaw([...targetsRaw, { id: Date.now().toString(), name: 'New Target', subjectsStr: '' }]);
  };

  const handleRemoveTarget = (index) => {
    const newTargets = [...targetsRaw];
    newTargets.splice(index, 1);
    setTargetsRaw(newTargets);
  };

  const handleSave = async () => {
    const finalTargets = targetsRaw.map(t => ({
      id: t.id,
      name: t.name,
      subjects: t.subjectsStr.split(',').map(s => s.trim()).filter(s => s)
    }));

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
      autoClockColor,
      textColor,
      subjectColor,
      clockFont,
      targets: finalTargets,
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

        {/* ── Study Targets ── */}
        <div className="settings-section">
          <div className="settings-section-title"><IconBook size={14} /> Study Targets</div>
          {targetsRaw.map((t, i) => (
            <div key={t.id} className="setting-item" style={{ background: 'var(--glass-bg-strong)', padding: '12px', borderRadius: '8px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <input
                  className="setting-input"
                  style={{ flex: 1, marginRight: '8px', fontWeight: 'bold' }}
                  value={t.name}
                  onChange={e => handleUpdateTarget(i, 'name', e.target.value)}
                  placeholder="Target Name (e.g. UPSC)"
                />
                <button className="drawer-close" style={{ position: 'static' }} onClick={() => handleRemoveTarget(i)} aria-label="Remove Target">✕</button>
              </div>
              <input
                className="setting-input"
                style={{ width: '100%' }}
                value={t.subjectsStr}
                onChange={e => handleUpdateTarget(i, 'subjectsStr', e.target.value)}
                placeholder="Subjects (comma separated)"
              />
            </div>
          ))}
          <button className="pill" style={{ width: '100%', marginTop: '4px' }} onClick={handleAddTarget}>
            + Add Target
          </button>
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

        {/* ── Customization ── */}
        <div className="settings-section">
          <div className="settings-section-title"><IconSettings size={14} /> Customization</div>

          <Toggle
            id="toggle-auto-clock-color"
            checked={autoClockColor}
            onChange={setAutoClockColor}
            label="Auto-adjust Clock Color"
            sub="Change clock color based on wallpaper brightness"
          />

          {!autoClockColor && (
            <div className="setting-item" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <label className="setting-label" htmlFor="setting-text-color" style={{ marginBottom: 0 }}>
                Main Clock Text Color
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  id="setting-text-color"
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  style={{ 
                    width: '32px', height: '32px', padding: '0', 
                    border: 'none', borderRadius: '4px', cursor: 'pointer',
                    background: 'none'
                  }}
                />
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                  {textColor.toUpperCase()}
                </span>
              </div>
            </div>
          )}

          <div className="setting-item" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <label className="setting-label" htmlFor="setting-subject-color" style={{ marginBottom: 0 }}>
              Subject Highlight Color
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                id="setting-subject-color"
                type="color"
                value={subjectColor}
                onChange={(e) => setSubjectColor(e.target.value)}
                style={{ 
                  width: '32px', height: '32px', padding: '0', 
                  border: 'none', borderRadius: '4px', cursor: 'pointer',
                  background: 'none'
                }}
              />
              <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                {subjectColor.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="setting-item" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <label className="setting-label" htmlFor="setting-clock-font" style={{ marginBottom: 0 }}>
              Clock Font
            </label>
            <select
              id="setting-clock-font"
              className="setting-input"
              style={{ width: '150px', padding: '6px' }}
              value={clockFont}
              onChange={(e) => setClockFont(e.target.value)}
            >
              <option value="'Inter', system-ui, sans-serif">Inter (Default)</option>
              <option value="'Space Grotesk', sans-serif">Space Grotesk</option>
              <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
              <option value="'Playfair Display', serif">Playfair Display</option>
            </select>
          </div>
        </div>

        <button className="save-btn" onClick={handleSave} id="settings-save-btn">
          Save Settings
        </button>
      </aside>
    </>
  );
};

export default SettingsDrawer;
