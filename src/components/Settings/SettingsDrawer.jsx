import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../Toast/ToastProvider';
import { useWallpaper } from '../../contexts/WallpaperContext';
import { useAuth } from '../../contexts/AuthContext';
import { getWallpaperContrast } from '../../utils/imageUtils';
import {
  IconSun,
  IconMoon,
  IconTrash,
  IconClock,
  IconTimer,
  IconStats,
  IconQuotes,
  IconStar,
  IconUser,
  IconHelpCircle,
  IconRocket,
  IconZap,
  IconX,
  IconCoffee,
} from '../Icons';
import { IconShield, IconFileText, IconRefreshCcw } from '../Legal/LegalModal';
import { playChimeStyle } from '../../hooks/useTimer';

const BUY_ME_A_COFFEE_URL = import.meta.env.VITE_BUY_ME_A_COFFEE_URL || 'https://buymeacoffee.com/deepesh2606';

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

const FONT_OPTIONS = [
  { id: "'Inter', system-ui, sans-serif", label: 'Inter (Default)' },
  { id: "'Space Grotesk', sans-serif", label: 'Space Grotesk' },
  { id: "'Outfit', sans-serif", label: 'Outfit' },
  { id: "'Roboto', sans-serif", label: 'Roboto' },
  { id: "'JetBrains Mono', monospace", label: 'JetBrains Mono' },
  { id: "'Playfair Display', serif", label: 'Playfair Display' },
  { id: "'DM Mono', monospace", label: 'DM Mono' },
];

const Toggle = ({ id, checked, onChange, label, sub, badge }) => (
  <div className="setting-toggle-row" id={`row-${id}`}>
    <div style={{ flex: 1, paddingRight: '12px' }}>
      <div className="setting-toggle-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>{label}</span>
        {badge && <span className="settings-badge-plus">{badge}</span>}
      </div>
      {sub && <div className="setting-toggle-sub">{sub}</div>}
    </div>
    <button
      id={id}
      className={`toggle-switch ${checked ? 'on' : ''}`}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      type="button"
    >
      <span className="toggle-thumb" />
    </button>
  </div>
);

const SettingsDrawer = ({ settings, onSave, onClose, onOpenInstall, onOpenLegal }) => {
  const { toast } = useToast();
  const { wallpaper } = useWallpaper();
  const { currentUser, signOut, openAuthModal } = useAuth();
  const d = settings?.durations || {};

  // Active side menu category
  const [activeTab, setActiveTab] = useState('timer'); // 'clock' | 'timer' | 'stats' | 'quotes' | 'extras' | 'account' | 'support' | 'whatsnew'
  const [showPlusModal, setShowPlusModal] = useState(false);

  // Timer durations
  const [pomodoro, setPomodoro]       = useState(Math.round((d.pomodoro   || 2700) / 60));
  const [shortBreak, setShortBreak]   = useState(Math.round((d.shortBreak || 300)  / 60));
  const [longBreak, setLongBreak]     = useState(Math.round((d.longBreak  || 900)  / 60));
  const [longBreakInterval, setLongBreakInterval] = useState(settings?.longBreakInterval || 4);

  // Gemini API key
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

  const [dailyGoal, setDailyGoal] = useState(settings?.dailyGoal || 8);

  // Behaviour toggles
  const [autoStartBreaks, setAutoStartBreaks]       = useState(settings?.autoStartBreaks ?? false);
  const [autoStartPomodoros, setAutoStartPomodoros] = useState(settings?.autoStartPomodoros ?? false);
  const [soundEnabled, setSoundEnabled]             = useState(settings?.soundEnabled ?? true);
  const [notifyOnComplete, setNotifyOnComplete]     = useState(settings?.notifyOnComplete ?? true);

  // Timer Styles & Toggles matching screenshot
  const [timerStyle, setTimerStyle]                 = useState(settings?.timerStyle || (settings?.clockStyle === 'flip' ? 'flip' : 'default'));
  const [showTimerProgressBar, setShowTimerProgressBar] = useState(settings?.showTimerProgressBar ?? true);
  const [showStreakCounter, setShowStreakCounter]   = useState(settings?.showStreakCounter ?? true);
  const [showTaskInPip, setShowTaskInPip]           = useState(settings?.showTaskInPip ?? true);
  const [showGhostPacer, setShowGhostPacer]         = useState(settings?.showGhostPacer ?? false);

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

  useEffect(() => {
    if (settings) {
      if (settings.timerStyle) setTimerStyle(settings.timerStyle);
      if (settings.showTimerProgressBar !== undefined) setShowTimerProgressBar(settings.showTimerProgressBar);
      if (settings.showStreakCounter !== undefined) setShowStreakCounter(settings.showStreakCounter);
      if (settings.showTaskInPip !== undefined) setShowTaskInPip(settings.showTaskInPip);
      if (settings.showGhostPacer !== undefined) setShowGhostPacer(settings.showGhostPacer);
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

  // Live Preview Effects for Wallpaper Contrast
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
    return () => { cancelled = true; };
  }, [clockColor, autoClockColor, wallpaper]);

  // Real-time update helper
  const applyRealtime = useCallback(
    (partialUpdates) => {
      onSave(partialUpdates);
    },
    [onSave]
  );

  const handleTimerStyleSelect = (style) => {
    setTimerStyle(style);
    applyRealtime({ timerStyle: style, clockStyle: style === 'flip' ? 'flip' : 'digital' });
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

  const handleSave = async () => {
    const finalTargets = targetsRaw.map(t => ({
      id: t.id,
      name: t.name,
      subjects: t.subjectsStr.split(',').map(s => s.trim()).filter(Boolean)
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
      timerStyle,
      showTimerProgressBar,
      showStreakCounter,
      showTaskInPip,
      showGhostPacer,
      clockStyle: timerStyle === 'flip' ? 'flip' : clockStyle,
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
    toast('Settings saved', 'success', 2000);
    onClose();
  };

  // Nav items matching user's screenshot
  const NAV_ITEMS = [
    { id: 'clock',     label: 'Clock',       icon: IconClock },
    { id: 'timer',     label: 'Focus Timer', icon: IconTimer },
    { id: 'stats',     label: 'Stats',       icon: IconStats },
    { id: 'quotes',    label: 'Quotes',      icon: IconQuotes },
    { id: 'extras',    label: 'Extras',      icon: IconStar },
    { id: 'account',   label: 'Account',     icon: IconUser, badgeDot: !currentUser },
    { id: 'support',   label: 'Support',     icon: IconHelpCircle },
    { id: 'whatsnew',  label: "What's New",  icon: IconRocket },
    { id: 'legal',     label: 'Legal & Policies', icon: IconShield },
  ];

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} aria-hidden="true" />

      {/* 2-Column Side Menu Modal */}
      <aside
        className="settings-modal-dialog"
        role="dialog"
        aria-label="Flowstate Settings"
        aria-modal="true"
      >
        {/* ═══ LEFT SIDEBAR NAVIGATION ═══ */}
        <div className="settings-side-nav">
          {/* Top Close Button */}
          <button
            type="button"
            className="settings-side-close-btn"
            onClick={onClose}
            aria-label="Close settings"
            title="Close (Esc)"
          >
            <IconX size={18} />
          </button>

          {/* Menu Items */}
          <nav className="settings-side-menu-list" role="tablist" aria-label="Settings categories">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`settings-side-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                  role="tab"
                  aria-selected={isActive}
                  id={`side-nav-${item.id}`}
                >
                  <Icon size={16} />
                  <span className="settings-side-nav-label">{item.label}</span>
                  {item.badgeDot && <span className="settings-nav-orange-dot" />}
                </button>
              );
            })}
          </nav>

          {/* Upgrade to Plus Gradient Button */}
          <button
            type="button"
            className="settings-upgrade-plus-btn"
            onClick={() => setShowPlusModal(true)}
            id="settings-upgrade-plus-btn"
          >
            <IconZap size={14} />
            <span>Upgrade to Plus</span>
          </button>

          {/* Buy Me a Coffee Button */}
          <a
            href={BUY_ME_A_COFFEE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="settings-coffee-btn"
            id="settings-coffee-btn"
            title="Buy Me a Coffee"
          >
            <span style={{ fontSize: '15px' }}>☕</span>
            <span>Buy Me a Coffee</span>
          </a>

          <div style={{ flex: 1 }} />

          {/* Bottom Auth Card (Signed Out vs Signed In) */}
          <div className="settings-sidebar-auth-card">
            {!currentUser ? (
              <>
                <div className="sidebar-auth-title">You're signed out!</div>
                <div className="sidebar-auth-desc">Keep your layout, stats, and more.</div>
                <button
                  type="button"
                  className="sidebar-auth-signup-btn"
                  onClick={() => {
                    openAuthModal('Sign up to sync your sessions and access all features.');
                  }}
                >
                  Sign up with email
                </button>
                <button
                  type="button"
                  className="sidebar-auth-signin-link"
                  onClick={() => openAuthModal('Sign in to access your cloud account.')}
                >
                  Already have an account? <u>Sign in</u>
                </button>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="sidebar-auth-avatar">
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="Avatar" />
                    ) : (
                      (currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div className="sidebar-auth-user-name">
                      {currentUser.displayName || 'Focus Explorer'}
                    </div>
                    <div className="sidebar-auth-user-email">
                      {currentUser.email}
                    </div>
                  </div>
                </div>
                <div className="sidebar-auth-sync-badge">
                  <span className="sync-pulse-dot" /> Cloud Sync Active
                </div>
                <button
                  type="button"
                  className="sidebar-auth-signout-btn"
                  onClick={signOut}
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>

        {/* ═══ RIGHT CONTENT PANE ═══ */}
        <div className="settings-content-pane">
          {/* Top Bar inside Content Pane */}
          <div className="settings-content-header">
            <div className="settings-content-header-title">
              {NAV_ITEMS.find(n => n.id === activeTab)?.label || 'Settings'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="drawer-theme-toggle"
                onClick={handleToggleTheme}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <IconSun size={14} /> : <IconMoon size={14} />}
                <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
              </button>
              <button
                type="button"
                className="settings-header-save-btn"
                onClick={handleSave}
              >
                Save
              </button>
            </div>
          </div>

          {/* ════════ 1. FOCUS TIMER (Screenshot match) ════════ */}
          {activeTab === 'timer' && (
            <div className="settings-tab-section">
              {/* Custom Timer Font Banner */}
              <div className="settings-card-banner">
                <div className="settings-card-banner-header">
                  <span className="settings-card-banner-title">Custom Timer Font</span>
                  <span className="settings-badge-plus">⚡ PLUS</span>
                </div>
                <p className="settings-card-banner-sub">
                  Go to{' '}
                  <button
                    type="button"
                    className="settings-text-link"
                    onClick={() => setActiveTab('clock')}
                  >
                    Clock settings
                  </button>{' '}
                  to customize your timer and clock style.
                </p>
              </div>

              {/* Timer Style Section */}
              <div className="settings-section-block">
                <div className="settings-section-header-row">
                  <div className="settings-section-header-title">Timer Style</div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span className="settings-badge-plus">⚡ PLUS</span>
                    <span className="settings-badge-new">NEW</span>
                  </div>
                </div>
                <p className="settings-section-subtitle">
                  Choose how the time remaining is displayed.
                </p>

                {/* 6 Visual Timer Style Cards */}
                <div className="timer-styles-grid">
                  {/* 1. Default */}
                  <div
                    className={`timer-style-card ${timerStyle === 'default' ? 'active' : ''}`}
                    onClick={() => handleTimerStyleSelect('default')}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="timer-style-preview">
                      <div className="preview-digits-default">25:00</div>
                    </div>
                    <div className="timer-style-name">Default</div>
                  </div>

                  {/* 2. Flip Clock */}
                  <div
                    className={`timer-style-card ${timerStyle === 'flip' ? 'active' : ''}`}
                    onClick={() => handleTimerStyleSelect('flip')}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="timer-style-preview">
                      <div className="preview-flip-wrapper">
                        <div className="preview-flip-tile">2</div>
                        <div className="preview-flip-tile">5</div>
                      </div>
                    </div>
                    <div className="timer-style-name">Flip Clock</div>
                  </div>

                  {/* 3. Progress Bar */}
                  <div
                    className={`timer-style-card ${timerStyle === 'progress' ? 'active' : ''}`}
                    onClick={() => handleTimerStyleSelect('progress')}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="timer-style-preview">
                      <div className="preview-progressbar-wrap">
                        <span className="preview-mini-time">25:00</span>
                        <div className="preview-progress-track">
                          <div className="preview-progress-fill" style={{ width: '60%' }} />
                        </div>
                      </div>
                    </div>
                    <div className="timer-style-name">Progress Bar</div>
                  </div>

                  {/* 4. Gauge */}
                  <div
                    className={`timer-style-card ${timerStyle === 'gauge' ? 'active' : ''}`}
                    onClick={() => handleTimerStyleSelect('gauge')}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="timer-style-preview">
                      <div className="preview-gauge-wrap">
                        <svg viewBox="0 0 36 36" width="34" height="34">
                          <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                          <circle cx="18" cy="18" r="14" fill="none" stroke="var(--accent, #06b6d4)" strokeWidth="3" strokeDasharray="88" strokeDashoffset="28" transform="rotate(-90 18 18)" />
                        </svg>
                        <span className="preview-gauge-subtext">25:00</span>
                      </div>
                    </div>
                    <div className="timer-style-name">Gauge</div>
                  </div>

                  {/* 5. Dot Matrix */}
                  <div
                    className={`timer-style-card ${timerStyle === 'dotmatrix' ? 'active' : ''}`}
                    onClick={() => handleTimerStyleSelect('dotmatrix')}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="timer-style-preview">
                      <div className="preview-dotmatrix-wrap">
                        <div className="preview-dotmatrix-grid">
                          {Array.from({ length: 12 }).map((_, idx) => (
                            <span key={idx} className={`preview-dot ${idx < 8 ? 'active' : ''}`} />
                          ))}
                        </div>
                        <span className="preview-dot-subtext">25:00</span>
                      </div>
                    </div>
                    <div className="timer-style-name">Dot Matrix</div>
                  </div>

                  {/* 6. Pie */}
                  <div
                    className={`timer-style-card ${timerStyle === 'pie' ? 'active' : ''}`}
                    onClick={() => handleTimerStyleSelect('pie')}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="timer-style-preview">
                      <div className="preview-pie-wrap">
                        <svg viewBox="0 0 32 32" width="32" height="32">
                          <circle cx="16" cy="16" r="14" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                          <circle cx="16" cy="16" r="7" fill="none" stroke="var(--accent, #06b6d4)" strokeWidth="14" strokeDasharray={2 * Math.PI * 7} strokeDashoffset={2 * Math.PI * 7 * 0.35} transform="rotate(-90 16 16)" />
                        </svg>
                        <span className="preview-pie-subtext">25:00</span>
                      </div>
                    </div>
                    <div className="timer-style-name">Pie</div>
                  </div>
                </div>
              </div>

              {/* Toggles matching screenshot */}
              <div className="settings-section-block">
                <Toggle
                  id="toggle-timer-progress-bar"
                  checked={showTimerProgressBar}
                  onChange={(val) => handleToggleChange('showTimerProgressBar', setShowTimerProgressBar, val)}
                  label="Show timer progress bar"
                  sub="Display a visual progress bar beneath the timer."
                  badge="⚡ PLUS"
                />

                <Toggle
                  id="toggle-notify-on-complete"
                  checked={notifyOnComplete}
                  onChange={(val) => handleToggleChange('notifyOnComplete', setNotifyOnComplete, val)}
                  label="Show notification"
                  sub="Beta feature: Show a browser notification when the timer ends."
                  badge="⚡ PLUS"
                />

                <Toggle
                  id="toggle-auto-start"
                  checked={autoStartPomodoros}
                  onChange={(val) => {
                    setAutoStartPomodoros(val);
                    setAutoStartBreaks(val);
                    applyRealtime({ autoStartPomodoros: val, autoStartBreaks: val });
                  }}
                  label="Auto start timer on segment end"
                  sub="This will run through the full focus sequence automatically. For Countdown, this will auto restart your timer upon completion."
                />

                <Toggle
                  id="toggle-streak-counter"
                  checked={showStreakCounter}
                  onChange={(val) => handleToggleChange('showStreakCounter', setShowStreakCounter, val)}
                  label="Show in-dashboard streak counter"
                  sub="Display your active study streak and flame in the timer dashboard."
                />

                <Toggle
                  id="toggle-task-pip"
                  checked={showTaskInPip}
                  onChange={(val) => handleToggleChange('showTaskInPip', setShowTaskInPip, val)}
                  label="Show task in picture-in-picture"
                  sub="Display your current focus topic or linked task in the floating mini window."
                  badge="⚡ PLUS"
                />

                <Toggle
                  id="toggle-ghost-pacer"
                  checked={showGhostPacer}
                  onChange={(val) => handleToggleChange('showGhostPacer', setShowGhostPacer, val)}
                  label="Ghost Pacer"
                  sub="Race against yesterday's focus time with a pacing bar."
                />
              </div>

              {/* Durations & Presets */}
              <div className="settings-section-block">
                <div className="settings-section-header-title">Durations</div>
                <div className="setting-item">
                  <label className="setting-label" htmlFor="setting-pomodoro">Focus Time (minutes)</label>
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
                </div>

                <div className="setting-item">
                  <label className="setting-label" htmlFor="setting-long-break-interval">Long Break Interval (sessions)</label>
                  <div className="setting-input-row">
                    <button className="setting-stepper" onClick={() => setLongBreakInterval(prev => Math.max(1, Number(prev) - 1))}>−</button>
                    <input
                      id="setting-long-break-interval"
                      className="setting-input setting-input-center"
                      type="number" min="1" max="12"
                      value={longBreakInterval}
                      onChange={(e) => setLongBreakInterval(Math.max(1, Number(e.target.value)))}
                    />
                    <button className="setting-stepper" onClick={() => setLongBreakInterval(prev => Math.min(12, Number(prev) + 1))}>+</button>
                  </div>
                </div>

                <div className="setting-item" style={{ marginTop: '12px' }}>
                  <label className="setting-label">Quick Presets</label>
                  <div className="setting-preset-pills">
                    {presets.map(p => (
                      <button
                        key={p.name}
                        type="button"
                        className="setting-preset-pill"
                        onClick={() => handlePresetApply(p)}
                      >
                        {p.name} ({p.pomodoro}/{p.shortBreak})
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════ 2. CLOCK SETTINGS ════════ */}
          {activeTab === 'clock' && (
            <div className="settings-tab-section">
              <div className="settings-section-block">
                <div className="settings-section-header-title">Clock Typography</div>
                <div className="setting-item">
                  <label className="setting-label" htmlFor="setting-clock-font">Font Family</label>
                  <select
                    id="setting-clock-font"
                    className="setting-input"
                    value={clockFont}
                    onChange={(e) => handleClockFontChange(e.target.value)}
                    style={{ fontFamily: clockFont }}
                  >
                    {FONT_OPTIONS.map(f => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </select>
                </div>

                <div className="setting-item">
                  <label className="setting-label">Time Format</label>
                  <div className="setting-segmented-group">
                    <button
                      type="button"
                      className={`setting-segmented-btn ${clockFormat === '12h' ? 'active' : ''}`}
                      onClick={() => handleClockFormatChange('12h')}
                    >
                      12-Hour (AM/PM)
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

                <Toggle
                  id="toggle-show-seconds-clock"
                  checked={showSeconds}
                  onChange={handleShowSecondsChange}
                  label="Show Seconds"
                  sub="Display seconds countdown on the timer and clock"
                />
              </div>

              {/* Clock Color & Wallpaper Contrast */}
              <div className="settings-section-block">
                <div className="settings-section-header-title">Clock Color</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Color Mode</span>
                  <div className="setting-segmented-group" style={{ width: '160px' }}>
                    <button
                      type="button"
                      className={`setting-segmented-btn ${autoClockColor ? 'active' : ''}`}
                      onClick={() => handleAutoClockColorChange(true)}
                    >
                      Auto Contrast
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
                    <span>Calculates optimal readable contrast dynamically from wallpaper</span>
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
                        style={{ width: '34px', height: '34px', padding: 0, border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'none' }}
                      />
                      <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                        {clockColor.toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* App Themes */}
              <div className="settings-section-block">
                <div className="settings-section-header-title">App Accent Theme</div>
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
            </div>
          )}

          {/* ════════ 3. STATS & TARGETS ════════ */}
          {activeTab === 'stats' && (
            <div className="settings-tab-section">
              <div className="settings-section-block">
                <div className="settings-section-header-title">Daily Study Goal</div>
                <div className="setting-item">
                  <label className="setting-label" htmlFor="setting-goal">Target Sessions per Day</label>
                  <div className="setting-input-row">
                    <button className="setting-stepper" onClick={() => setDailyGoal(Math.max(1, dailyGoal - 1))}>−</button>
                    <input
                      id="setting-goal"
                      className="setting-input setting-input-center"
                      type="number" min="1" max="24"
                      value={dailyGoal}
                      onChange={(e) => setDailyGoal(Number(e.target.value))}
                    />
                    <button className="setting-stepper" onClick={() => setDailyGoal(Math.min(24, dailyGoal + 1))}>+</button>
                  </div>
                </div>
              </div>

              <div className="settings-section-block">
                <div className="settings-section-header-title">Study Targets & Subjects</div>
                <p className="settings-section-subtitle">
                  Configure your target exams or degrees and the subjects you want to study.
                </p>

                {targetsRaw.length === 0 ? (
                  <div className="settings-empty-targets">
                    <div className="settings-empty-icon">🎯</div>
                    <div className="settings-empty-title">No Study Targets Yet</div>
                    <div className="settings-empty-desc">
                      Add your study goals (e.g. MCAT, USMLE, Finals, CFA) and tag subjects to track progress.
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
                                placeholder="Target Name (e.g. Finals)"
                                aria-label="Target Name"
                              />
                            </div>
                            <button
                              type="button"
                              className="settings-target-remove-btn"
                              onClick={() => handleRemoveTarget(i)}
                              aria-label="Delete target"
                              title="Delete target"
                            >
                              <IconTrash size={14} />
                            </button>
                          </div>

                          <div className="settings-target-subjects-block">
                            <div className="settings-subject-chips">
                              {subjectList.map((subj) => (
                                <span key={subj} className="settings-subject-chip">
                                  <span>{subj}</span>
                                  <button
                                    type="button"
                                    className="settings-subject-chip-del"
                                    onClick={() => handleRemoveSubjectFromTarget(i, subj)}
                                    title={`Remove ${subj}`}
                                  >
                                    ✕
                                  </button>
                                </span>
                              ))}
                            </div>

                            <div className="settings-add-subject-row">
                              <input
                                className="settings-add-subject-input"
                                placeholder="Add subject (press Enter)..."
                                value={currentInput}
                                onChange={(e) => setNewSubjectInputs(prev => ({ ...prev, [i]: e.target.value }))}
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
                >
                  + Add Target
                </button>
              </div>
            </div>
          )}

          {/* ════════ 4. QUOTES ════════ */}
          {activeTab === 'quotes' && (
            <div className="settings-tab-section">
              <div className="settings-section-block">
                <div className="settings-section-header-title">Daily Quotes</div>
                <Toggle
                  id="toggle-quotes"
                  checked={showQuotes}
                  onChange={(val) => { setShowQuotes(val); applyRealtime({ showQuotes: val }); }}
                  label="Show Motivational Quotes"
                  sub="Display an inspiring study quote before and during your focus sessions."
                />
              </div>
            </div>
          )}

          {/* ════════ 5. EXTRAS ════════ */}
          {activeTab === 'extras' && (
            <div className="settings-tab-section">
              {/* Chime Sound */}
              <div className="settings-section-block">
                <Toggle
                  id="toggle-sound-enabled"
                  checked={soundEnabled}
                  onChange={(val) => handleToggleChange('soundEnabled', setSoundEnabled, val)}
                  label="Timer Chime Sound"
                  sub="Play sound chime when your session or break completes."
                />
                <div className="settings-section-header-title" style={{ marginTop: '16px' }}>Timer Chime Style</div>
                <p className="settings-section-subtitle">Chime plays gently when your session completes.</p>
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
              </div>

              {/* Gemini AI Key */}
              <div className="settings-section-block">
                <div className="settings-section-header-title">Gemini AI Studio Key</div>
                <p className="settings-section-subtitle">
                  Power Active Recall Flashcards and AI Study Assistant with your personal Gemini key.{' '}
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
                    Get a free API key →
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
                        background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0
                      }}
                      aria-label={showGeminiKey ? 'Hide key' : 'Show key'}
                    >
                      {showGeminiKey ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveGeminiKey}
                    className="btn btn-primary"
                    style={{ padding: '8px 14px', fontSize: '12px', flexShrink: 0 }}
                  >
                    {geminiSaved ? '✓ Saved' : 'Save Key'}
                  </button>
                </div>
                {geminiKey && (
                  <button
                    type="button"
                    onClick={handleClearGeminiKey}
                    style={{ fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, marginTop: '4px' }}
                  >
                    × Clear saved key
                  </button>
                )}
              </div>

              {/* Mac Dock Install */}
              <div className="settings-section-block">
                <div className="settings-section-header-title">
                  <IconMac size={16} /> Desktop & Mac Dock
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    if (onOpenInstall) onOpenInstall();
                    onClose();
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '8px', padding: '10px 14px', fontSize: '13px', fontWeight: 600,
                    width: '100%', borderRadius: '10px', border: '1px solid rgba(6, 182, 212, 0.3)',
                    background: 'rgba(6, 182, 212, 0.08)'
                  }}
                >
                  <img src="/favicon.svg" alt="Flowstate Icon" style={{ width: 18, height: 18, borderRadius: 4 }} /> Add FLOWSTATE to Mac Dock
                </button>
              </div>
            </div>
          )}

          {/* ════════ 6. ACCOUNT ════════ */}
          {activeTab === 'account' && (
            <div className="settings-tab-section">
              <div className="settings-section-block">
                <div className="settings-section-header-title">Account Profile</div>
                {currentUser ? (
                  <div className="settings-account-profile-card">
                    <div className="settings-account-avatar-large">
                      {currentUser.photoURL ? (
                        <img src={currentUser.photoURL} alt="Avatar" />
                      ) : (
                        (currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="settings-account-details">
                      <div className="settings-account-name">{currentUser.displayName || 'Focus Student'}</div>
                      <div className="settings-account-email">{currentUser.email}</div>
                      <div className="settings-account-pill">Pro Member • Cloud Synced</div>
                    </div>
                    <button
                      type="button"
                      className="settings-account-signout-btn"
                      onClick={signOut}
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="settings-account-guest-card">
                    <div className="settings-account-guest-icon">👤</div>
                    <div className="settings-account-guest-title">Guest Profile</div>
                    <div className="settings-account-guest-desc">
                      You are currently using Flowstate in local guest mode. Sign in to save your session history, streak, and community leaderboard rank across all your devices.
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ padding: '10px 20px', borderRadius: '12px', fontWeight: 600 }}
                      onClick={() => openAuthModal('Sign in with Google to sync your study history.')}
                    >
                      Sign In with Google
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════ 7. SUPPORT ════════ */}
          {activeTab === 'support' && (
            <div className="settings-tab-section">
              {/* Keyboard Shortcuts */}
              <div className="settings-section-block">
                <div className="settings-section-header-title">Keyboard Shortcuts</div>
                <div className="settings-shortcuts-list">
                  {[
                    { key: 'Space', desc: 'Start / Pause Timer' },
                    { key: 'R',     desc: 'Reset Timer (with Save option)' },
                    { key: 'S',     desc: 'Skip to Next Break / Focus' },
                    { key: 'F',     desc: 'Toggle Fullscreen Mode' },
                    { key: 'M',     desc: 'Open Audio & Music Studio' },
                  ].map(s => (
                    <div key={s.key} className="settings-shortcut-row">
                      <kbd className="settings-kbd">{s.key}</kbd>
                      <span className="settings-shortcut-desc">{s.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQ */}
              <div className="settings-section-block">
                <div className="settings-section-header-title">Frequently Asked Questions</div>
                <div className="settings-faq-item">
                  <div className="settings-faq-q">How do Video Backgrounds work?</div>
                  <div className="settings-faq-a">Click the Wallpaper button in the top bar to choose between 4 curated ambient video loops, paste direct MP4/WebM URLs, or upload your own videos up to 50MB.</div>
                </div>
                <div className="settings-faq-item">
                  <div className="settings-faq-q">What is the Mario Kart "Ghost Pacer"?</div>
                  <div className="settings-faq-a">The Ghost Pacer tracks how much you studied yesterday at this exact minute of the day and shows whether you are ahead (⚡ Ahead of Ghost) or behind yesterday's pace.</div>
                </div>
                <div className="settings-faq-item">
                  <div className="settings-faq-q">How does Active Recall Flashcards work?</div>
                  <div className="settings-faq-a">Take quick notes in the floating scratchpad during your session. When the timer finishes, Gemini AI automatically generates 3 interactive 3D flip-cards from your notes to lock in your learning.</div>
                </div>
              </div>

              {/* Community & Feedback */}
              <div className="settings-section-block">
                <div className="settings-section-header-title">Feedback & GitHub</div>
                <p className="settings-section-subtitle">
                  Built with ❤️ for focused students and builders worldwide.
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <a
                    href="https://github.com/Deepesh2606/Flowstate"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', textDecoration: 'none' }}
                  >
                    ⭐ Star on GitHub
                  </a>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px' }}
                    onClick={() => onOpenLegal && onOpenLegal('privacy')}
                  >
                    <IconShield size={15} />
                    <span>Legal & Privacy</span>
                  </button>
                </div>
              </div>

              {/* Support the Creator */}
              <div className="settings-section-block">
                <div className="settings-section-header-title">☕ Support Flowstate</div>
                <p className="settings-section-subtitle">
                  Flowstate is 100% free to use. If it helps you stay focused, beat procrastination, or ace your exams, consider buying me a coffee to support development and server costs!
                </p>
                <div>
                  <a
                    href={BUY_ME_A_COFFEE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-coffee"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: '#ffffff',
                      fontWeight: '600',
                      textDecoration: 'none',
                      boxShadow: '0 4px 16px rgba(245, 158, 11, 0.28)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <IconCoffee size={18} />
                    <span>Buy Me a Coffee</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ════════ 8. WHAT'S NEW ════════ */}
          {activeTab === 'whatsnew' && (
            <div className="settings-tab-section">
              <div className="settings-section-block">
                <div className="settings-section-header-title">What's New in Flowstate</div>
                <div className="whatsnew-timeline">
                  {/* Item 1 */}
                  <div className="whatsnew-card">
                    <div className="whatsnew-card-badge">LATEST</div>
                    <div className="whatsnew-card-title">🎨 6 Distinct Timer Display Styles</div>
                    <div className="whatsnew-card-desc">
                      Customize how time is displayed: Choose between <strong>Default</strong>, <strong>Flip Clock</strong>, <strong>Progress Bar</strong>, <strong>Gauge</strong>, <strong>Dot Matrix</strong>, and <strong>Pie</strong> in Focus Timer settings.
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="whatsnew-card">
                    <div className="whatsnew-card-badge">NEW</div>
                    <div className="whatsnew-card-title">🎬 4K Video Backgrounds & Custom Uploads</div>
                    <div className="whatsnew-card-desc">
                      Immerse yourself in cinematic looping video wallpapers: Rain, Fireplace, Ocean Waves, and Starry Night. Plus upload your own MP4/WebM videos via Cloudinary.
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div className="whatsnew-card">
                    <div className="whatsnew-card-badge">FEATURE</div>
                    <div className="whatsnew-card-title">👻 The "Mario Kart" Ghost Pacer</div>
                    <div className="whatsnew-card-desc">
                      Race against yourself! The Ghost Pacer dynamically compares today's study minutes against your exact progress at this same minute yesterday.
                    </div>
                  </div>

                  {/* Item 4 */}
                  <div className="whatsnew-card">
                    <div className="whatsnew-card-badge">AI</div>
                    <div className="whatsnew-card-title">⚡ Instant Active Recall Flashcards</div>
                    <div className="whatsnew-card-desc">
                      Jot notes in the Session Scratchpad. At session end, Gemini AI synthesizes your notes into 3 interactive 3D flip-cards for rapid retention testing.
                    </div>
                  </div>

                  {/* Item 5 */}
                  <div className="whatsnew-card">
                    <div className="whatsnew-card-badge">COMMUNITY</div>
                    <div className="whatsnew-card-title">🏆 Real-Time Community Leaderboard</div>
                    <div className="whatsnew-card-desc">
                      Compete with focusers worldwide on the podium! Filter by Today, This Week, or All-Time with live overtaking pace alerts.
                    </div>
                  </div>

                  {/* Item 6 */}
                  <div className="whatsnew-card">
                    <div className="whatsnew-card-badge">POLISH</div>
                    <div className="whatsnew-card-title">↺ Redesigned Reset & Safety UI</div>
                    <div className="whatsnew-card-desc">
                      Accidental resets are a thing of the past. Choose "Save & Reset" to log partial study minutes directly to your stats and streak before starting over.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════ 9. LEGAL & POLICIES ════════ */}
          {activeTab === 'legal' && (
            <div className="settings-tab-section">
              <div className="settings-section-block">
                <div className="settings-section-header-title">Legal & Policies</div>
                <p className="settings-section-subtitle">
                  Review our legal commitments, privacy protections, and user agreements.
                </p>

                <div className="settings-legal-cards-grid">
                  {/* Privacy Policy Card */}
                  <div className="settings-legal-card">
                    <div className="settings-legal-card-header">
                      <IconShield size={20} style={{ color: '#38bdf8' }} />
                      <h4>Privacy Policy</h4>
                    </div>
                    <p>How we handle and protect your Google account, study logs, cloud sync, and AI interactions.</p>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ width: '100%', justifyContent: 'center', fontSize: '13px', padding: '8px 12px' }}
                      onClick={() => onOpenLegal && onOpenLegal('privacy')}
                    >
                      View Privacy Policy
                    </button>
                  </div>

                  {/* Terms of Service Card */}
                  <div className="settings-legal-card">
                    <div className="settings-legal-card-header">
                      <IconFileText size={20} style={{ color: '#818cf8' }} />
                      <h4>Terms of Service</h4>
                    </div>
                    <p>The terms and conditions governing the use of FLOWSTATE and acceptable conduct.</p>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ width: '100%', justifyContent: 'center', fontSize: '13px', padding: '8px 12px' }}
                      onClick={() => onOpenLegal && onOpenLegal('terms')}
                    >
                      View Terms of Service
                    </button>
                  </div>

                  {/* Refund Policy Card */}
                  <div className="settings-legal-card">
                    <div className="settings-legal-card-header">
                      <IconRefreshCcw size={20} style={{ color: '#34d399' }} />
                      <h4>Refund & Cancellation Policy</h4>
                    </div>
                    <p>Our 14-day money-back guarantee, refund process, and subscription cancellation terms.</p>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ width: '100%', justifyContent: 'center', fontSize: '13px', padding: '8px 12px' }}
                      onClick={() => onOpenLegal && onOpenLegal('refund')}
                    >
                      View Refund Policy
                    </button>
                  </div>
                </div>
              </div>

              <div className="settings-section-block">
                <div className="settings-section-header-title">Contact & Support</div>
                <p className="settings-section-subtitle">
                  Questions about our policies or need data assistance? We are here to help.
                </p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <a
                    href="mailto:support@flowstate.study"
                    className="btn btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', textDecoration: 'none' }}
                  >
                    ✉️ Contact Support
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ═══ PLUS PERKS MODAL ═══ */}
      {showPlusModal && (
        <div
          className="reset-modal-overlay"
          style={{ zIndex: 1300 }}
          onClick={() => setShowPlusModal(false)}
        >
          <div
            className="reset-modal-card"
            style={{ maxWidth: '440px', padding: '32px 28px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="reset-modal-close-btn"
              onClick={() => setShowPlusModal(false)}
            >
              <IconX size={16} />
            </button>

            <div className="reset-modal-icon-ring" style={{ background: 'rgba(99, 102, 241, 0.15)', borderColor: '#6366f1', color: '#818cf8' }}>
              <IconZap size={26} />
            </div>

            <h3 className="reset-modal-title" style={{ fontSize: '1.4rem' }}>
              Flowstate Plus ⚡
            </h3>

            <p className="reset-modal-desc" style={{ maxWidth: '360px' }}>
              Unlock all premium features to supercharge your daily focus and productivity:
            </p>

            <div className="plus-perks-list">
              <div className="plus-perk-item">✓ All 6 Timer Styles (Gauge, Dot Matrix, Flip, Pie, Bar)</div>
              <div className="plus-perk-item">✓ 12+ Pro Typography & Clock Fonts</div>
              <div className="plus-perk-item">✓ Unlimited 4K Video Wallpapers & MP4 Uploads</div>
              <div className="plus-perk-item">✓ Unlimited Gemini Active Recall AI Flashcards</div>
              <div className="plus-perk-item">✓ Verified Leaderboard Pro Badge & Rank</div>
              <div className="plus-perk-item">✓ Unlimited Multi-Device Cloud Sync</div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', borderRadius: '14px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', marginTop: '8px' }}
              onClick={() => {
                toast('⚡ Lifetime Plus Access Active (Beta)! Enjoy all features.', 'success', 3500);
                setShowPlusModal(false);
              }}
            >
              Active Lifetime Beta Access
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SettingsDrawer;
