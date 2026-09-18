import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '../Toast/ToastProvider';
import { useWallpaper } from '../../contexts/WallpaperContext';
import { getWallpaperContrast } from '../../utils/imageUtils';
import { IconSettings, IconFocus, IconInfo, IconBook, IconMac, IconSun, IconMoon } from '../Icons';

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

const SettingsDrawer = ({ settings, onSave, onClose, onOpenInstall }) => {
  const { toast } = useToast();
  const { wallpaper } = useWallpaper();
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
  const [clockStyle, setClockStyle]                 = useState(settings?.clockStyle || 'digital');
  const [showSeconds, setShowSeconds]               = useState(settings?.showSeconds ?? true);
  const [autoClockColor, setAutoClockColor]         = useState(settings?.autoClockColor ?? true);
  const [clockColor, setClockColor]                 = useState(settings?.clockColor || settings?.textColor || '#ffffff');
  const [clockFont, setClockFont]                   = useState(settings?.clockFont || "'Inter', system-ui, sans-serif");
  const [theme, setTheme]                           = useState(settings?.theme || 'dark');
  
  // Track original settings for cleanup if cancelled
  const originalSettingsRef = useRef({
    clockColor: settings?.clockColor || settings?.textColor || '#ffffff',
    clockFont: settings?.clockFont || "'Inter', system-ui, sans-serif",
    autoClockColor: settings?.autoClockColor ?? true,
    clockStyle: settings?.clockStyle || 'digital',
    showSeconds: settings?.showSeconds ?? true,
  });

  useEffect(() => {
    if (settings) {
      if (settings.autoClockColor !== undefined) setAutoClockColor(settings.autoClockColor);
      if (settings.clockStyle) setClockStyle(settings.clockStyle);
      if (settings.showSeconds !== undefined) setShowSeconds(settings.showSeconds);
      if (settings.clockColor || settings.textColor) setClockColor(settings.clockColor || settings.textColor);
      if (settings.clockFont) setClockFont(settings.clockFont);
      if (settings.theme) setTheme(settings.theme);
    }
  }, [settings]);

  // Study Targets
  const initialTargets = (settings?.targets || []).filter(t => t.name !== 'SSC CGL');
  const [targetsRaw, setTargetsRaw] = useState(initialTargets.map(t => ({
    ...t,
    subjectsStr: (t.subjects || []).join(', ')
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

  // Live Preview Effects
  useEffect(() => {
    let cancelled = false;

    const previewColor = async () => {
      if (autoClockColor && wallpaper) {
        const contrast = await getWallpaperContrast(wallpaper);
        if (!cancelled) {
          document.documentElement.style.setProperty('--clock-text-color', contrast.color);
          document.documentElement.style.setProperty('--clock-text-shadow', contrast.shadow);
        }
      } else {
        if (!cancelled) {
          document.documentElement.style.setProperty('--clock-text-color', clockColor);
          document.documentElement.style.setProperty(
            '--clock-text-shadow',
            `0 0 40px color-mix(in srgb, ${clockColor} 25%, transparent), 0 2px 24px rgba(0, 0, 0, 0.75)`
          );
        }
      }
    };

    previewColor();

    return () => {
      cancelled = true;
    };
  }, [clockColor, autoClockColor, wallpaper]);

  // Real-time update helper to immediately reflect changes in UI & background
  const applyRealtime = useCallback(
    (partialUpdates) => {
      onSave(partialUpdates);
    },
    [onSave]
  );

  const handleClockStyleChange = (style) => {
    setClockStyle(style);
    applyRealtime({ clockStyle: style });
  };

  const handleShowSecondsChange = (val) => {
    setShowSeconds(val);
    applyRealtime({ showSeconds: val });
  };

  const handleAutoClockColorChange = (val) => {
    setAutoClockColor(val);
    applyRealtime({ autoClockColor: val });
  };

  const handleClockColorChange = (col) => {
    setClockColor(col);
    setAutoClockColor(false);
    applyRealtime({ autoClockColor: false, clockColor: col, textColor: col });
  };

  const handleClockFontChange = (fontFamily) => {
    setClockFont(fontFamily);
    applyRealtime({ clockFont: fontFamily });
  };

  const handleDurationsChange = (type, minutes) => {
    const val = Math.max(1, Number(minutes));
    if (type === 'pomodoro') setPomodoro(val);
    else if (type === 'shortBreak') setShortBreak(val);
    else if (type === 'longBreak') setLongBreak(val);

    applyRealtime({
      durations: {
        pomodoro: (type === 'pomodoro' ? val : Number(pomodoro)) * 60,
        shortBreak: (type === 'shortBreak' ? val : Number(shortBreak)) * 60,
        longBreak: (type === 'longBreak' ? val : Number(longBreak)) * 60,
      },
    });
  };

  const handleToggleChange = (field, setter, val) => {
    setter(val);
    applyRealtime({ [field]: val });
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    onSave({ theme: nextTheme });
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
      clockStyle,
      showSeconds,
      autoClockColor,
      clockColor,
      textColor: clockColor,
      clockFont,
      theme,
      targets: finalTargets,
    });
    toast('Settings updated', 'success', 2200);
    onClose();
  };

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} aria-hidden="true" />
      <aside className="drawer" role="dialog" aria-label="Settings" aria-modal="true">

        <div className="drawer-header">
          <h2 className="drawer-title">Settings</h2>
          <div className="drawer-header-actions">
            <button
              type="button"
              className="drawer-theme-toggle"
              onClick={handleToggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              id="settings-theme-toggle-btn"
            >
              {theme === 'dark' ? <IconSun size={15} /> : <IconMoon size={15} />}
              <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
            <button className="drawer-close" onClick={onClose} aria-label="Close settings">✕</button>
          </div>
        </div>

        {/* ── Timer Durations ── */}
        <div className="settings-section">
          <div className="settings-section-title"><IconSettings size={14} /> Timer Durations</div>

          <div className="setting-item">
            <label className="setting-label" htmlFor="setting-pomodoro">Focus (minutes)</label>
            <div className="setting-input-row">
              <button className="setting-stepper" onClick={() => handleDurationsChange('pomodoro', pomodoro - 1)}>−</button>
              <input
                id="setting-pomodoro"
                className="setting-input setting-input-center"
                type="number" min="1" max="90"
                value={pomodoro}
                onChange={(e) => handleDurationsChange('pomodoro', e.target.value)}
              />
              <button className="setting-stepper" onClick={() => handleDurationsChange('pomodoro', pomodoro + 1)}>+</button>
            </div>
            {/* Quick preset pills */}
            <div className="setting-preset-pills">
              {[25, 45, 50, 60].map(mins => (
                <button
                  key={mins}
                  type="button"
                  className={`setting-preset-pill ${pomodoro === mins ? 'active' : ''}`}
                  onClick={() => handleDurationsChange('pomodoro', mins)}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          <div className="setting-item">
            <label className="setting-label" htmlFor="setting-short-break">Short Break (minutes)</label>
            <div className="setting-input-row">
              <button className="setting-stepper" onClick={() => handleDurationsChange('shortBreak', shortBreak - 1)}>−</button>
              <input
                id="setting-short-break"
                className="setting-input setting-input-center"
                type="number" min="1" max="30"
                value={shortBreak}
                onChange={(e) => handleDurationsChange('shortBreak', e.target.value)}
              />
              <button className="setting-stepper" onClick={() => handleDurationsChange('shortBreak', shortBreak + 1)}>+</button>
            </div>
            {/* Quick preset pills */}
            <div className="setting-preset-pills">
              {[5, 10, 15].map(mins => (
                <button
                  key={mins}
                  type="button"
                  className={`setting-preset-pill ${shortBreak === mins ? 'active' : ''}`}
                  onClick={() => handleDurationsChange('shortBreak', mins)}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          <div className="setting-item">
            <label className="setting-label" htmlFor="setting-long-break">Long Break (minutes)</label>
            <div className="setting-input-row">
              <button className="setting-stepper" onClick={() => handleDurationsChange('longBreak', longBreak - 1)}>−</button>
              <input
                id="setting-long-break"
                className="setting-input setting-input-center"
                type="number" min="1" max="60"
                value={longBreak}
                onChange={(e) => handleDurationsChange('longBreak', e.target.value)}
              />
              <button className="setting-stepper" onClick={() => handleDurationsChange('longBreak', longBreak + 1)}>+</button>
            </div>
            {/* Quick preset pills */}
            <div className="setting-preset-pills">
              {[15, 20, 30].map(mins => (
                <button
                  key={mins}
                  type="button"
                  className={`setting-preset-pill ${longBreak === mins ? 'active' : ''}`}
                  onClick={() => handleDurationsChange('longBreak', mins)}
                >
                  {mins}m
                </button>
              ))}
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
            <div className="setting-preset-pills">
              {[2, 4, 6].map(num => (
                <button
                  key={num}
                  type="button"
                  className={`setting-preset-pill ${longBreakInterval === num ? 'active' : ''}`}
                  onClick={() => setLongBreakInterval(num)}
                >
                  {num} sess
                </button>
              ))}
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
            onChange={(val) => handleToggleChange('autoStartBreaks', setAutoStartBreaks, val)}
            label="Auto-start Breaks"
            sub="Breaks begin automatically after focus ends"
          />
          <Toggle
            id="toggle-auto-pomodoros"
            checked={autoStartPomodoros}
            onChange={(val) => handleToggleChange('autoStartPomodoros', setAutoStartPomodoros, val)}
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
            onChange={(val) => handleToggleChange('soundEnabled', setSoundEnabled, val)}
            label="Sound Effects"
            sub="Chime when session completes"
          />
          <Toggle
            id="toggle-notify"
            checked={notifyOnComplete}
            onChange={(val) => handleToggleChange('notifyOnComplete', setNotifyOnComplete, val)}
            label="Toast Notifications"
            sub="Show alerts for session events"
          />
        </div>

        {/* ── Customization ── */}
        <div className="settings-section">
          <div className="settings-section-title"><IconSettings size={14} /> Customization</div>

          {/* Clock Style (Digital vs Flip Clock) */}
          <div className="setting-item" style={{ marginBottom: '14px' }}>
            <label className="setting-label" style={{ marginBottom: '6px' }}>Clock Style</label>
            <div className="setting-segmented-group">
              <button
                type="button"
                className={`setting-segmented-btn ${clockStyle === 'digital' ? 'active' : ''}`}
                onClick={() => handleClockStyleChange('digital')}
              >
                Digital
              </button>
              <button
                type="button"
                className={`setting-segmented-btn ${clockStyle === 'flip' ? 'active' : ''}`}
                onClick={() => handleClockStyleChange('flip')}
              >
                Flip Clock
              </button>
            </div>
          </div>

          {/* Seconds Toggle */}
          <Toggle
            id="toggle-show-seconds"
            checked={showSeconds}
            onChange={handleShowSecondsChange}
            label="Show Seconds"
            sub="Display seconds countdown on the main clock"
          />

          {/* Clock Color Mode (Auto Wallpaper Contrast vs Custom Color) */}
          <div className="setting-item" style={{ marginTop: '12px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label className="setting-label" style={{ marginBottom: 0 }}>Clock Color</label>
              <div className="setting-segmented-group" style={{ width: '150px' }}>
                <button
                  type="button"
                  className={`setting-segmented-btn ${autoClockColor ? 'active' : ''}`}
                  onClick={() => handleAutoClockColorChange(true)}
                >
                  Auto
                </button>
                <button
                  type="button"
                  className={`setting-segmented-btn ${!autoClockColor ? 'active' : ''}`}
                  onClick={() => handleAutoClockColorChange(false)}
                >
                  Custom
                </button>
              </div>
            </div>

            {autoClockColor ? (
              <div className="auto-color-badge">
                <span className="auto-color-indicator" />
                <span>Auto-adjusts contrast and color to match wallpaper</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Pick Custom Color</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    id="setting-clock-color"
                    type="color"
                    value={clockColor}
                    onChange={(e) => handleClockColorChange(e.target.value)}
                    style={{ 
                      width: '32px', height: '32px', padding: '0', 
                      border: 'none', borderRadius: '4px', cursor: 'pointer',
                      background: 'none'
                    }}
                  />
                  <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {clockColor.toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Clock Font */}
          <div className="setting-item" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <label className="setting-label" htmlFor="setting-clock-font" style={{ marginBottom: 0 }}>
              Clock Font
            </label>
            <select
              id="setting-clock-font"
              className="setting-input"
              style={{ width: '150px', padding: '6px' }}
              value={clockFont}
              onChange={(e) => handleClockFontChange(e.target.value)}
            >
              <option value="'Inter', system-ui, sans-serif">Inter (Default)</option>
              <option value="'Space Grotesk', sans-serif">Space Grotesk</option>
              <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
              <option value="'Playfair Display', serif">Playfair Display</option>
            </select>
          </div>
        </div>

        {/* Desktop & Mac Dock Section */}
        <div className="settings-section">
          <div className="settings-section-title">
            <IconMac size={16} /> Desktop & Mac Dock
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                if (onOpenInstall) onOpenInstall();
                onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 14px',
                fontSize: '13px',
                fontWeight: 600,
                width: '100%',
                borderRadius: '8px',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                background: 'rgba(6, 182, 212, 0.08)'
              }}
              id="settings-install-dock-btn"
            >
              <img src="/favicon.svg" alt="Flowstate Icon" style={{ width: 18, height: 18, borderRadius: 4 }} /> Add FLOWSTATE to Mac Dock
            </button>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center' }}>
              Pin to your Mac Dock & launch as a native standalone app
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
          <button className="save-btn" onClick={handleSave} id="settings-save-btn">
            Save & Close
          </button>
          <span style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-secondary)' }}>
            ✓ Changes are applied in real-time
          </span>
        </div>
      </aside>
    </>
  );
};

export default SettingsDrawer;

