import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '../Toast/ToastProvider';
import { useWallpaper } from '../../contexts/WallpaperContext';
import { getWallpaperContrast } from '../../utils/imageUtils';
import { IconSettings, IconFocus, IconInfo, IconBook, IconMac, IconSun, IconMoon, IconTrash } from '../Icons';
import { playChimeStyle } from '../../hooks/useTimer';

// ─── App Themes ───────────────────────────────────────────────────────────────
const APP_THEMES = [
  { id: 'midnight', label: 'Midnight', accent: '#06b6d4', orb: 'rgba(6,182,212,0.18)', grad: '#0f172a' },
  { id: 'ocean',    label: 'Ocean',    accent: '#38bdf8', orb: 'rgba(56,189,248,0.18)', grad: '#0c1a2e' },
  { id: 'forest',   label: 'Forest',   accent: '#34d399', orb: 'rgba(52,211,153,0.18)', grad: '#0a1f15' },
  { id: 'sunset',   label: 'Sunset',   accent: '#fb923c', orb: 'rgba(251,146,60,0.18)',  grad: '#1f0f08' },
  { id: 'rose',     label: 'Rose',     accent: '#f472b6', orb: 'rgba(244,114,182,0.18)', grad: '#1f0a14' },
  { id: 'mono',     label: 'Mono',     accent: '#94a3b8', orb: 'rgba(148,163,184,0.12)', grad: '#0f1117' },
];

const CHIME_OPTIONS = [
  { id: 'classic', label: 'Classic', icon: '🎵' },
  { id: 'bell',    label: 'Bell',    icon: '🔔' },
  { id: 'bowl',    label: 'Bowl',    icon: '🎶' },
  { id: 'ping',    label: 'Ping',    icon: '✨' },
  { id: 'soft',    label: 'Soft',    icon: '🌙' },
];

const DEFAULT_PRESETS = [
  { name: 'Deep Work', pomodoro: 50, shortBreak: 10, longBreak: 30 },
  { name: 'Pomodoro',  pomodoro: 25, shortBreak: 5,  longBreak: 15 },
  { name: 'Sprint',    pomodoro: 15, shortBreak: 3,  longBreak: 10 },
];

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

  // Gemini API key (stored in localStorage, overrides env var)
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('flowstate_gemini_key') || '');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [geminiSaved, setGeminiSaved] = useState(false);

  const handleSaveGeminiKey = () => {
    const trimmed = geminiKey.trim();
    if (trimmed) {
      localStorage.setItem('flowstate_gemini_key', trimmed);
    } else {
      localStorage.removeItem('flowstate_gemini_key');
    }
    setGeminiSaved(true);
    setTimeout(() => setGeminiSaved(false), 2000);
  };

  const handleClearGeminiKey = () => {
    setGeminiKey('');
    localStorage.removeItem('flowstate_gemini_key');
  };

  const [dailyGoal, setDailyGoal]     = useState(settings?.dailyGoal || 8);

  // Behaviour toggles
  const [autoStartBreaks, setAutoStartBreaks]       = useState(settings?.autoStartBreaks ?? false);
  const [autoStartPomodoros, setAutoStartPomodoros] = useState(settings?.autoStartPomodoros ?? false);
  const [soundEnabled, setSoundEnabled]             = useState(settings?.soundEnabled ?? true);
  const [notifyOnComplete, setNotifyOnComplete]     = useState(settings?.notifyOnComplete ?? true);
  
  // Customization
  const [clockStyle, setClockStyle]                 = useState(settings?.clockStyle || 'digital');
  const [showSeconds, setShowSeconds]               = useState(settings?.showSeconds ?? true);
  const [clockFormat, setClockFormat]               = useState(settings?.clockFormat || '12h');
  const [autoClockColor, setAutoClockColor]         = useState(settings?.autoClockColor ?? true);
  const [clockColor, setClockColor]                 = useState(settings?.clockColor || settings?.textColor || '#ffffff');
  const [clockFont, setClockFont]                   = useState(settings?.clockFont || "'Inter', system-ui, sans-serif");
  const [theme, setTheme]                           = useState(settings?.theme || 'dark');
  const [appTheme, setAppTheme]                     = useState(settings?.appTheme || 'midnight');
  const [chimeStyle, setChimeStyle]                 = useState(settings?.chimeStyle || 'classic');
  const [showQuotes, setShowQuotes]                 = useState(settings?.showQuotes ?? true);
  const [presets, setPresets]                       = useState(settings?.presets || DEFAULT_PRESETS);
  
  // Track original settings for cleanup if cancelled
  const originalSettingsRef = useRef({
    clockColor: settings?.clockColor || settings?.textColor || '#ffffff',
    clockFont: settings?.clockFont || "'Inter', system-ui, sans-serif",
    autoClockColor: settings?.autoClockColor ?? true,
    clockStyle: settings?.clockStyle || 'digital',
    showSeconds: settings?.showSeconds ?? true,
    clockFormat: settings?.clockFormat || '12h',
  });

  useEffect(() => {
    if (settings) {
      if (settings.autoClockColor !== undefined) setAutoClockColor(settings.autoClockColor);
      if (settings.clockStyle) setClockStyle(settings.clockStyle);
      if (settings.showSeconds !== undefined) setShowSeconds(settings.showSeconds);
      if (settings.clockFormat) setClockFormat(settings.clockFormat);
      if (settings.clockColor || settings.textColor) setClockColor(settings.clockColor || settings.textColor);
      if (settings.clockFont) setClockFont(settings.clockFont);
      if (settings.theme) setTheme(settings.theme);
      if (settings.appTheme) setAppTheme(settings.appTheme);
      if (settings.chimeStyle) setChimeStyle(settings.chimeStyle);
      if (settings.showQuotes !== undefined) setShowQuotes(settings.showQuotes);
      if (settings.presets) setPresets(settings.presets);
    }
  }, [settings]);

  // Settings Category Tab
  const [activeSettingsTab, setActiveSettingsTab] = useState('timer');

  // Study Targets
  const initialTargets = (settings?.targets || []).filter(t => t.name !== 'SSC CGL');
  const [targetsRaw, setTargetsRaw] = useState(initialTargets.map(t => ({
    ...t,
    subjectsStr: (t.subjects || []).join(', ')
  })));
  const [newSubjectInputs, setNewSubjectInputs] = useState({});

  const handleUpdateTarget = (index, field, value) => {
    const newTargets = [...targetsRaw];
    newTargets[index][field] = value;
    setTargetsRaw(newTargets);
  };

  const handleAddTarget = () => {
    const newTargets = [...targetsRaw, { id: Date.now().toString(), name: 'New Target', subjectsStr: '' }];
    setTargetsRaw(newTargets);
  };

  const handleRemoveTarget = (index) => {
    const newTargets = [...targetsRaw];
    newTargets.splice(index, 1);
    setTargetsRaw(newTargets);
  };

  const handleAddSubjectToTarget = (index, subject) => {
    const trimmed = (subject || '').trim();
    if (!trimmed) return;
    const newTargets = [...targetsRaw];
    const subs = newTargets[index].subjectsStr
      ? newTargets[index].subjectsStr.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    if (!subs.includes(trimmed)) {
      subs.push(trimmed);
      newTargets[index].subjectsStr = subs.join(', ');
      setTargetsRaw(newTargets);
    }
    setNewSubjectInputs(prev => ({ ...prev, [index]: '' }));
  };

  const handleRemoveSubjectFromTarget = (index, subjectToRemove) => {
    const newTargets = [...targetsRaw];
    const subs = newTargets[index].subjectsStr
      ? newTargets[index].subjectsStr.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    const filtered = subs.filter(s => s !== subjectToRemove);
    newTargets[index].subjectsStr = filtered.join(', ');
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

  const handleClockFormatChange = (format) => {
    setClockFormat(format);
    applyRealtime({ clockFormat: format });
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
      clockFormat,
      autoClockColor,
      clockColor,
      textColor: clockColor,
      clockFont,
      theme,
      appTheme,
      chimeStyle,
      showQuotes,
      presets,
      targets: finalTargets,
    });
    toast('Settings updated', 'success', 2200);
    onClose();
  };

  // Apply app theme CSS vars immediately on selection
  const applyAppTheme = (themeId) => {
    const t = APP_THEMES.find(x => x.id === themeId) || APP_THEMES[0];
    document.documentElement.style.setProperty('--accent', t.accent);
    document.documentElement.style.setProperty('--accent-dim', t.accent + '22');
    document.documentElement.style.setProperty('--theme-orb-color', t.orb);
  };

  const handleAppThemeChange = (themeId) => {
    setAppTheme(themeId);
    applyAppTheme(themeId);
    onSave({ appTheme: themeId });
  };

  const handleChimeChange = (id) => {
    setChimeStyle(id);
    playChimeStyle(id, !soundEnabled);
    onSave({ chimeStyle: id });
  };

  const handlePresetApply = (preset) => {
    setPomodoro(preset.pomodoro);
    setShortBreak(preset.shortBreak);
    setLongBreak(preset.longBreak);
    applyRealtime({
      durations: {
        pomodoro: preset.pomodoro * 60,
        shortBreak: preset.shortBreak * 60,
        longBreak: preset.longBreak * 60,
      },
    });
    toast(`Preset "${preset.name}" applied`, 'success', 2000);
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

        {/* ── Category Navigation Tabs ── */}
        <div className="settings-nav-tabs" role="tablist" aria-label="Settings categories">
          {[
            { id: 'timer', label: 'Timer', icon: '⏱️' },
            { id: 'targets', label: 'Targets', icon: '🎯' },
            { id: 'display', label: 'Display', icon: '🎨' },
            { id: 'system', label: 'System', icon: '⚙️' },
            { id: 'all', label: 'All', icon: '📋' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`settings-nav-tab ${activeSettingsTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveSettingsTab(tab.id)}
              role="tab"
              aria-selected={activeSettingsTab === tab.id}
              id={`tab-settings-${tab.id}`}
            >
              <span className="settings-nav-tab-icon">{tab.icon}</span>
              <span className="settings-nav-tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ══════════════════ 1. TIMER CATEGORY ══════════════════ */}
        {(activeSettingsTab === 'timer' || activeSettingsTab === 'all') && (
          <>
            {/* Timer Durations */}
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

            {/* Timer Presets */}
            <div className="settings-section">
              <div className="settings-section-title"><IconFocus size={14} /> Timer Presets</div>
              <div className="presets-grid">
                {presets.map((preset, i) => (
                  <div key={i} className="preset-card">
                    <div className="preset-name">{preset.name}</div>
                    <div className="preset-times">{preset.pomodoro}m / {preset.shortBreak}m / {preset.longBreak}m</div>
                    <button
                      type="button"
                      className="preset-apply-btn"
                      onClick={() => handlePresetApply(preset)}
                    >
                      Apply
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Behaviour */}
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
          </>
        )}

        {/* ══════════════════ 2. TARGETS CATEGORY ══════════════════ */}
        {(activeSettingsTab === 'targets' || activeSettingsTab === 'all') && (
          <div className="settings-section">
            <div className="settings-section-title"><IconBook size={14} /> Study Targets & Subjects</div>
            <p className="settings-section-sub">
              Create targets (exams, courses, goals) and add subjects to focus on during your study sessions.
            </p>

            {targetsRaw.length === 0 ? (
              <div className="settings-empty-targets">
                <div className="settings-empty-icon">🎯</div>
                <div className="settings-empty-title">No Study Targets Yet</div>
                <div className="settings-empty-desc">
                  Add your targets (e.g. UPSC, GATE, Finals) and list the subjects you want to study.
                </div>
              </div>
            ) : (
              <div className="settings-targets-list">
                {targetsRaw.map((t, i) => {
                  const subjectList = t.subjectsStr
                    ? t.subjectsStr.split(',').map(s => s.trim()).filter(Boolean)
                    : [];
                  const currentInput = newSubjectInputs[i] || '';

                  return (
                    <div key={t.id || i} className="settings-target-card">
                      <div className="settings-target-card-header">
                        <div className="settings-target-name-wrap">
                          <span className="settings-target-badge-icon">🎯</span>
                          <input
                            className="settings-target-name-input"
                            value={t.name}
                            onChange={(e) => handleUpdateTarget(i, 'name', e.target.value)}
                            placeholder="Target Name (e.g. UPSC)"
                            aria-label="Target Name"
                          />
                        </div>
                        <button
                          type="button"
                          className="settings-target-remove-btn"
                          onClick={() => handleRemoveTarget(i)}
                          aria-label={`Delete ${t.name || 'target'}`}
                          title="Delete target"
                        >
                          <IconTrash size={14} />
                        </button>
                      </div>

                      {/* Subjects List & Chips */}
                      <div className="settings-target-subjects-block">
                        <div className="settings-target-subjects-header">
                          <span className="settings-target-sub-label">SUBJECTS</span>
                          <span className="settings-target-count-badge">
                            {subjectList.length} {subjectList.length === 1 ? 'subject' : 'subjects'}
                          </span>
                        </div>

                        <div className="settings-subject-chips">
                          {subjectList.map((subj) => (
                            <span key={subj} className="settings-subject-chip">
                              <span className="settings-subject-chip-text">{subj}</span>
                              <button
                                type="button"
                                className="settings-subject-chip-del"
                                onClick={() => handleRemoveSubjectFromTarget(i, subj)}
                                title={`Remove ${subj}`}
                                aria-label={`Remove ${subj}`}
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>

                        {/* Add Subject Row */}
                        <div className="settings-add-subject-row">
                          <input
                            className="settings-add-subject-input"
                            placeholder="Add subject (press Enter)..."
                            value={currentInput}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val.includes(',')) {
                                const parts = val.split(',');
                                parts.slice(0, -1).forEach(p => handleAddSubjectToTarget(i, p));
                                setNewSubjectInputs(prev => ({ ...prev, [i]: parts[parts.length - 1] }));
                              } else {
                                setNewSubjectInputs(prev => ({ ...prev, [i]: val }));
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddSubjectToTarget(i, currentInput);
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="settings-add-subject-btn"
                            onClick={() => handleAddSubjectToTarget(i, currentInput)}
                            disabled={!currentInput.trim()}
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              className="settings-add-target-btn"
              onClick={handleAddTarget}
              id="settings-add-target-btn"
            >
              <span>+ Add Target</span>
            </button>
          </div>
        )}

        {/* ══════════════════ 3. DISPLAY CATEGORY ══════════════════ */}
        {(activeSettingsTab === 'display' || activeSettingsTab === 'all') && (
          <>
            {/* App Theme */}
            <div className="settings-section">
              <div className="settings-section-title"><IconSettings size={14} /> App Theme</div>
              <div className="theme-swatch-row">
                {APP_THEMES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    className={`theme-swatch ${appTheme === t.id ? 'active' : ''}`}
                    style={{ '--swatch-color': t.accent }}
                    onClick={() => handleAppThemeChange(t.id)}
                    title={t.label}
                  >
                    <span className="theme-swatch-dot" style={{ background: t.accent }} />
                    <span className="theme-swatch-label">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Customization */}
            <div className="settings-section">
              <div className="settings-section-title"><IconSettings size={14} /> Clock Customization</div>

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

              {/* Time Format (12h vs 24h) */}
              <div className="setting-item" style={{ marginBottom: '14px' }}>
                <label className="setting-label" style={{ marginBottom: '6px' }}>Time Format</label>
                <div className="setting-segmented-group">
                  <button
                    type="button"
                    className={`setting-segmented-btn ${clockFormat === '12h' ? 'active' : ''}`}
                    onClick={() => handleClockFormatChange('12h')}
                  >
                    12-Hour
                  </button>
                  <button
                    type="button"
                    className={`setting-segmented-btn ${clockFormat === '24h' ? 'active' : ''}`}
                    onClick={() => handleClockFormatChange('24h')}
                  >
                    24-Hour
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

            {/* Motivational Quotes */}
            <div className="settings-section">
              <div className="settings-section-title"><IconInfo size={14} /> Motivation</div>
              <Toggle
                id="toggle-show-quotes"
                checked={showQuotes}
                onChange={(val) => { setShowQuotes(val); applyRealtime({ showQuotes: val }); }}
                label="Motivational Quotes"
                sub="Show an inspiring quote before each focus session"
              />
            </div>
          </>
        )}

        {/* ══════════════════ 4. SYSTEM CATEGORY ══════════════════ */}
        {(activeSettingsTab === 'system' || activeSettingsTab === 'all') && (
          <>
            {/* Sound & Notifications */}
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

            {/* Timer Chime */}
            <div className="settings-section">
              <div className="settings-section-title"><IconInfo size={14} /> Timer Chime</div>
              <div className="chime-options-row">
                {CHIME_OPTIONS.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    className={`chime-option-btn ${chimeStyle === c.id ? 'active' : ''}`}
                    onClick={() => handleChimeChange(c.id)}
                    title={`Preview ${c.label} chime`}
                  >
                    <span>{c.icon}</span>
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Click to preview. Plays when your session completes.
              </div>
            </div>

            {/* Desktop & Mac Dock */}
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

            {/* Gemini AI Key */}
            <div className="settings-section">
              <div className="settings-section-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
                Gemini AI Key
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  Add your own key so the AI chat works for everyone using your deployment.{' '}
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                    Get a free key →
                  </a>
                </p>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      id="settings-gemini-key"
                      type={showGeminiKey ? 'text' : 'password'}
                      className="settings-input"
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      style={{ width: '100%', paddingRight: '36px', fontFamily: geminiKey ? 'monospace' : 'inherit', fontSize: '12px' }}
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <button
                      type="button"
                      onClick={() => setShowGeminiKey(v => !v)}
                      style={{
                        position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0,
                        display: 'flex', alignItems: 'center'
                      }}
                      aria-label={showGeminiKey ? 'Hide key' : 'Show key'}
                      title={showGeminiKey ? 'Hide' : 'Show'}
                    >
                      {showGeminiKey ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveGeminiKey}
                    style={{
                      padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                      background: geminiSaved ? 'rgba(16,185,129,0.15)' : 'rgba(6,182,212,0.12)',
                      border: geminiSaved ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(6,182,212,0.3)',
                      color: geminiSaved ? '#10b981' : 'var(--accent)',
                      cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0
                    }}
                    id="settings-save-gemini-key"
                  >
                    {geminiSaved ? '✓ Saved' : 'Save Key'}
                  </button>
                </div>
                {geminiKey && (
                  <button
                    type="button"
                    onClick={handleClearGeminiKey}
                    style={{ fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                    id="settings-clear-gemini-key"
                  >
                    × Clear saved key
                  </button>
                )}
              </div>
            </div>
          </>
        )}

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

