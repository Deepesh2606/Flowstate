import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../Toast/ToastProvider';
import { useWallpaper } from '../../contexts/WallpaperContext';
import { useAuth } from '../../contexts/AuthContext';
import { getWallpaperContrast } from '../../utils/imageUtils';
import { subscribeRegisteredUsers, grantProStatus } from '../../firebase/firestore';
import {
  IconSun,
  IconMoon,
  IconTrash,
  IconClock,
  IconTimer,
  IconStats,
  IconUser,
  IconX,
} from '../Icons';
import { IconShield } from '../Legal/LegalModal';
import { playChimeStyle } from '../../hooks/useTimer';

const APP_THEMES = [
  { id: 'midnight', label: 'Indigo', accent: '#6366f1', orb: 'rgba(99,102,241,0.18)' },
  { id: 'ocean',    label: 'Sky',    accent: '#38bdf8', orb: 'rgba(56,189,248,0.18)' },
  { id: 'forest',   label: 'Sage',   accent: '#34d399', orb: 'rgba(52,211,153,0.18)' },
  { id: 'sunset',   label: 'Amber',  accent: '#f59e0b', orb: 'rgba(245,158,11,0.18)' },
  { id: 'rose',     label: 'Rose',   accent: '#f472b6', orb: 'rgba(244,114,182,0.18)' },
  { id: 'mono',     label: 'Slate',  accent: '#cbd5e1', orb: 'rgba(203,213,225,0.14)' },
];

const CHIME_OPTIONS = [
  { id: 'classic', label: 'Classic' },
  { id: 'bell',    label: 'Bell' },
  { id: 'soft',    label: 'Soft' },
];

const Toggle = ({ id, checked, onChange, label, sub }) => (
  <div className="setting-toggle-row" id={`row-${id}`}>
    <div style={{ flex: 1, paddingRight: '12px' }}>
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
      type="button"
    >
      <span className="toggle-thumb" />
    </button>
  </div>
);

const SettingsDrawer = ({ settings, onSave, onClose, onOpenInstall, onOpenLegal }) => {
  const { toast } = useToast();
  const {
    wallpaper,
    globalDefault,
    setAsGlobalDefault,
    canSetGlobalDefault,
    setShowPicker,
  } = useWallpaper();
  const { currentUser, signOut, openAuthModal } = useAuth();
  const d = settings?.durations || {};

  const [activeTab, setActiveTab] = useState('timer');

  // Timer durations
  const [pomodoro, setPomodoro] = useState(Math.round((d.pomodoro || 2700) / 60));
  const [shortBreak, setShortBreak] = useState(Math.round((d.shortBreak || 300) / 60));
  const [longBreak, setLongBreak] = useState(Math.round((d.longBreak || 900) / 60));
  const [longBreakInterval, setLongBreakInterval] = useState(settings?.longBreakInterval || 4);
  const [dailyGoal, setDailyGoal] = useState(settings?.dailyGoal || 8);

  // Core useful behavior toggles
  const [autoStartPomodoros, setAutoStartPomodoros] = useState(settings?.autoStartPomodoros ?? false);
  const [soundEnabled, setSoundEnabled] = useState(settings?.soundEnabled ?? true);
  const [chimeStyle, setChimeStyle] = useState(settings?.chimeStyle || 'classic');
  const [notifyOnComplete, setNotifyOnComplete] = useState(settings?.notifyOnComplete ?? true);
  const [strictMode, setStrictMode] = useState(settings?.strictMode ?? false);

  // Display & Clock
  const [timerStyle, setTimerStyle] = useState(settings?.timerStyle || 'default');
  const [clockStyle, setClockStyle] = useState(settings?.clockStyle || 'flip');
  const [showSeconds, setShowSeconds] = useState(settings?.showSeconds ?? true);
  const [clockFormat, setClockFormat] = useState(settings?.clockFormat || '12h');
  const [theme, setTheme] = useState(settings?.theme || 'dark');
  const [appTheme, setAppTheme] = useState(settings?.appTheme || 'midnight');
  const [showQuotes, setShowQuotes] = useState(settings?.showQuotes ?? true);
  const [showExamDeadline, setShowExamDeadline] = useState(settings?.showExamDeadline ?? true);

  // Study Targets
  const initialTargets = (settings?.targets || []).filter((t) => t.name !== 'SSC CGL');
  const [targetsRaw, setTargetsRaw] = useState(
    initialTargets.map((t) => ({
      ...t,
      subjectsStr: (t.subjects || []).join(', '),
    }))
  );
  const [newSubjectInputs, setNewSubjectInputs] = useState({});

  // Admin state
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminManualUid, setAdminManualUid] = useState('');
  const [adminDefaultWpUrl, setAdminDefaultWpUrl] = useState('');

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (settings?.autoClockColor && wallpaper) {
      let cancelled = false;
      getWallpaperContrast(wallpaper).then((contrast) => {
        if (!cancelled) {
          document.documentElement.style.setProperty('--clock-text-color', contrast.color);
          document.documentElement.style.setProperty('--clock-text-shadow', contrast.shadow);
        }
      });
      return () => {
        cancelled = true;
      };
    }
    return undefined;
  }, [settings?.autoClockColor, wallpaper]);

  useEffect(() => {
    if (activeTab === 'admin' && currentUser?.email === 'deepeshsingh2606@gmail.com') {
      const unsub = subscribeRegisteredUsers((list) => {
        const sorted = [...list].sort((a, b) =>
          (a.displayName || a.email || '').localeCompare(b.displayName || b.email || '')
        );
        setAdminUsers(sorted);
      });
      return () => unsub();
    }
    return undefined;
  }, [activeTab, currentUser]);

  const applyRealtime = useCallback(
    (partialUpdates) => {
      onSave(partialUpdates);
    },
    [onSave]
  );

  const handleDurationsChange = (type, minutes) => {
    const val = Math.max(1, Math.min(120, Number(minutes) || 1));
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

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    applyRealtime({ theme: nextTheme });
  };

  const handleAppThemeChange = (themeId) => {
    const t = APP_THEMES.find((x) => x.id === themeId) || APP_THEMES[0];
    setAppTheme(themeId);
    document.documentElement.style.setProperty('--accent', t.accent);
    document.documentElement.style.setProperty('--accent-dim', `${t.accent}22`);
    document.documentElement.style.setProperty('--theme-orb-color', t.orb);
    applyRealtime({ appTheme: themeId });
  };

  const handleTestNotification = async () => {
    if (typeof Notification === 'undefined') {
      toast('Notifications are not supported in this browser.', 'error', 2400);
      return;
    }
    const perm = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
    if (perm === 'granted') {
      new Notification('FLOWSTATE', {
        body: 'Focus timer notifications are enabled.',
        icon: '/favicon.svg',
      });
      toast('Test notification sent.', 'success', 2000);
    } else {
      toast('Notifications are blocked in your browser settings.', 'warning', 3000);
    }
  };

  const handleExportData = () => {
    try {
      const exportObj = {
        exportedAt: new Date().toISOString(),
        settings: settings || {},
        tasks: JSON.parse(localStorage.getItem('flowstate_tasks') || '[]'),
        sessions: JSON.parse(localStorage.getItem('flowstate_sessions') || '[]'),
        notes: localStorage.getItem('flowstate_scratchpad_notes') || '',
      };
      const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flowstate-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast('Study data exported.', 'success', 2200);
    } catch {
      toast('Failed to export data.', 'error', 2000);
    }
  };

  const handleUpdateTarget = (index, field, value) => {
    const next = [...targetsRaw];
    next[index] = { ...next[index], [field]: value };
    setTargetsRaw(next);
  };

  const handleAddTarget = () => {
    setTargetsRaw((prev) => [...prev, { id: Date.now().toString(), name: 'New Target', subjectsStr: '' }]);
  };

  const handleRemoveTarget = (index) => {
    setTargetsRaw((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddSubjectToTarget = (index, subject) => {
    const trimmed = (subject || '').trim();
    if (!trimmed) return;
    const next = [...targetsRaw];
    const subs = next[index].subjectsStr
      ? next[index].subjectsStr.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    if (!subs.includes(trimmed)) {
      subs.push(trimmed);
      next[index] = { ...next[index], subjectsStr: subs.join(', ') };
      setTargetsRaw(next);
    }
    setNewSubjectInputs((prev) => ({ ...prev, [index]: '' }));
  };

  const handleRemoveSubjectFromTarget = (index, subjectToRemove) => {
    const next = [...targetsRaw];
    const subs = next[index].subjectsStr
      ? next[index].subjectsStr.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    next[index] = { ...next[index], subjectsStr: subs.filter((s) => s !== subjectToRemove).join(', ') };
    setTargetsRaw(next);
  };

  const handleGrantPro = async (inputVal) => {
    const val = (inputVal || '').trim();
    if (!val) return;
    let targetUid = val;
    if (val.includes('@')) {
      const found = adminUsers.find((u) => u.email?.toLowerCase() === val.toLowerCase());
      if (!found) {
        toast('User not found by email. Enter their exact UID instead.', 'error', 3500);
        return;
      }
      targetUid = found.id;
    }
    try {
      await grantProStatus(targetUid);
      toast(`PRO status granted to ${targetUid}.`, 'success', 2800);
      setAdminManualUid('');
    } catch {
      toast('Failed to grant PRO status.', 'error', 2800);
    }
  };

  const handleSave = async () => {
    const finalTargets = targetsRaw.map((t) => ({
      id: t.id,
      name: t.name,
      subjects: t.subjectsStr.split(',').map((s) => s.trim()).filter(Boolean),
    }));

    await onSave({
      durations: {
        pomodoro: Math.max(1, Number(pomodoro)) * 60,
        shortBreak: Math.max(1, Number(shortBreak)) * 60,
        longBreak: Math.max(1, Number(longBreak)) * 60,
      },
      longBreakInterval: Math.max(1, Number(longBreakInterval)),
      dailyGoal: Math.max(1, Number(dailyGoal)),
      autoStartBreaks: autoStartPomodoros,
      autoStartPomodoros,
      soundEnabled,
      chimeStyle,
      notifyOnComplete,
      strictMode,
      timerStyle,
      clockStyle,
      showSeconds,
      clockFormat,
      theme,
      appTheme,
      showQuotes,
      showExamDeadline,
      targets: finalTargets,
    });
    toast('Settings saved.', 'success', 1800);
    onClose();
  };

  const NAV_ITEMS = [
    { id: 'timer', label: 'Timer', icon: IconTimer },
    { id: 'clock', label: 'Clock & Look', icon: IconClock },
    { id: 'study', label: 'Study & Data', icon: IconStats },
    { id: 'account', label: 'Account', icon: IconUser },
  ];

  if (canSetGlobalDefault) {
    NAV_ITEMS.push({ id: 'admin', label: 'Admin', icon: IconShield });
  }

  return (
    <>
      <div className="settings-modal-overlay" onClick={onClose} aria-hidden="true" />

      <aside
        className="settings-modal-dialog settings-modal-dialog--compact"
        role="dialog"
        aria-label="Flowstate Settings"
        aria-modal="true"
      >
        {/* Streamlined Left Navigation */}
        <div className="settings-side-nav">
          <div className="settings-side-top-row">
            <span className="settings-side-heading">Settings</span>
            <button
              type="button"
              className="settings-side-close-btn"
              onClick={onClose}
              aria-label="Close settings"
              title="Close (Esc)"
            >
              <IconX size={16} />
            </button>
          </div>

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
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Content Pane */}
        <div className="settings-content-pane">
          <div className="settings-content-header">
            <div className="settings-content-header-title">
              {NAV_ITEMS.find((n) => n.id === activeTab)?.label || 'Settings'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="drawer-theme-toggle"
                onClick={handleToggleTheme}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
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

          {/* 1. TIMER */}
          {activeTab === 'timer' && (
            <div className="settings-tab-section">
              <div className="settings-section-block">
                <div className="settings-section-header-title">Durations (minutes)</div>
                <div className="settings-durations-grid">
                  <div className="setting-item">
                    <label className="setting-label" htmlFor="setting-pomodoro">Focus</label>
                    <input
                      id="setting-pomodoro"
                      className="setting-input setting-input-center tabular-nums"
                      type="number"
                      min="1"
                      max="120"
                      value={pomodoro}
                      onChange={(e) => handleDurationsChange('pomodoro', e.target.value)}
                    />
                  </div>
                  <div className="setting-item">
                    <label className="setting-label" htmlFor="setting-short-break">Short Break</label>
                    <input
                      id="setting-short-break"
                      className="setting-input setting-input-center tabular-nums"
                      type="number"
                      min="1"
                      max="30"
                      value={shortBreak}
                      onChange={(e) => handleDurationsChange('shortBreak', e.target.value)}
                    />
                  </div>
                  <div className="setting-item">
                    <label className="setting-label" htmlFor="setting-long-break">Long Break</label>
                    <input
                      id="setting-long-break"
                      className="setting-input setting-input-center tabular-nums"
                      type="number"
                      min="1"
                      max="60"
                      value={longBreak}
                      onChange={(e) => handleDurationsChange('longBreak', e.target.value)}
                    />
                  </div>
                  <div className="setting-item">
                    <label className="setting-label" htmlFor="setting-long-break-interval">Long Break Every</label>
                    <input
                      id="setting-long-break-interval"
                      className="setting-input setting-input-center tabular-nums"
                      type="number"
                      min="1"
                      max="12"
                      value={longBreakInterval}
                      onChange={(e) => setLongBreakInterval(Math.max(1, Number(e.target.value) || 1))}
                    />
                  </div>
                </div>
              </div>

              <div className="settings-section-block">
                <div className="settings-section-header-title">Timer Display</div>
                <div className="setting-segmented-group">
                  {[
                    { id: 'default', label: 'Clean Digits' },
                    { id: 'flip', label: 'Flip Clock' },
                    { id: 'progress', label: 'Progress Bar' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`setting-segmented-btn ${timerStyle === opt.id ? 'active' : ''}`}
                      onClick={() => {
                        setTimerStyle(opt.id);
                        applyRealtime({ timerStyle: opt.id });
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="settings-section-block">
                <div className="settings-section-header-title">Behavior & Alerts</div>
                <Toggle
                  id="toggle-auto-start"
                  checked={autoStartPomodoros}
                  onChange={(val) => {
                    setAutoStartPomodoros(val);
                    applyRealtime({ autoStartPomodoros: val, autoStartBreaks: val });
                  }}
                  label="Auto-start next session"
                  sub="Automatically begin breaks and next focus blocks."
                />
                <Toggle
                  id="toggle-strict-mode"
                  checked={strictMode}
                  onChange={(val) => {
                    setStrictMode(val);
                    applyRealtime({ strictMode: val });
                  }}
                  label="Strict focus mode"
                  sub="Pause the timer if you switch away to another browser tab."
                />
                <Toggle
                  id="toggle-sound-enabled"
                  checked={soundEnabled}
                  onChange={(val) => {
                    setSoundEnabled(val);
                    applyRealtime({ soundEnabled: val });
                    if (val) playChimeStyle(chimeStyle, false);
                  }}
                  label="Completion chime"
                  sub="Play a gentle chime when a session finishes."
                />
                {soundEnabled && (
                  <div className="chime-options-row" style={{ marginTop: '4px', marginBottom: '10px' }}>
                    {CHIME_OPTIONS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className={`chime-option-btn ${chimeStyle === c.id ? 'active' : ''}`}
                        onClick={() => {
                          setChimeStyle(c.id);
                          playChimeStyle(c.id, false);
                          applyRealtime({ chimeStyle: c.id });
                        }}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}
                <Toggle
                  id="toggle-notify-on-complete"
                  checked={notifyOnComplete}
                  onChange={(val) => {
                    setNotifyOnComplete(val);
                    applyRealtime({ notifyOnComplete: val });
                  }}
                  label="Browser notifications"
                  sub="Send a desktop alert when your timer completes."
                />
                {notifyOnComplete && (
                  <button
                    type="button"
                    className="btn btn-secondary settings-inline-btn"
                    onClick={handleTestNotification}
                  >
                    Test Notification
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 2. CLOCK & APPEARANCE */}
          {activeTab === 'clock' && (
            <div className="settings-tab-section">
              <div className="settings-section-block">
                <div className="settings-section-header-title">Clock</div>
                <div className="setting-item">
                  <label className="setting-label">Clock Style</label>
                  <div className="setting-segmented-group">
                    <button
                      type="button"
                      className={`setting-segmented-btn ${clockStyle === 'flip' ? 'active' : ''}`}
                      onClick={() => {
                        setClockStyle('flip');
                        applyRealtime({ clockStyle: 'flip' });
                      }}
                    >
                      Flip Clock
                    </button>
                    <button
                      type="button"
                      className={`setting-segmented-btn ${clockStyle === 'digital' ? 'active' : ''}`}
                      onClick={() => {
                        setClockStyle('digital');
                        applyRealtime({ clockStyle: 'digital' });
                      }}
                    >
                      Minimal Digital
                    </button>
                  </div>
                </div>

                <div className="setting-item">
                  <label className="setting-label">Time Format</label>
                  <div className="setting-segmented-group">
                    <button
                      type="button"
                      className={`setting-segmented-btn ${clockFormat === '12h' ? 'active' : ''}`}
                      onClick={() => {
                        setClockFormat('12h');
                        applyRealtime({ clockFormat: '12h' });
                      }}
                    >
                      12-Hour (AM/PM)
                    </button>
                    <button
                      type="button"
                      className={`setting-segmented-btn ${clockFormat === '24h' ? 'active' : ''}`}
                      onClick={() => {
                        setClockFormat('24h');
                        applyRealtime({ clockFormat: '24h' });
                      }}
                    >
                      24-Hour
                    </button>
                  </div>
                </div>

                <Toggle
                  id="toggle-show-seconds-clock"
                  checked={showSeconds}
                  onChange={(val) => {
                    setShowSeconds(val);
                    applyRealtime({ showSeconds: val });
                  }}
                  label="Show seconds"
                  sub="Display the seconds card on the live clock."
                />
              </div>

              <div className="settings-section-block">
                <div className="settings-section-header-title">Appearance</div>
                <div className="theme-swatch-row">
                  {APP_THEMES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`theme-swatch ${appTheme === t.id ? 'active' : ''}`}
                      style={{ '--swatch-color': t.accent }}
                      onClick={() => handleAppThemeChange(t.id)}
                    >
                      <span className="theme-swatch-dot" style={{ background: t.accent }} />
                      <span className="theme-swatch-label">{t.label}</span>
                    </button>
                  ))}
                </div>

                <Toggle
                  id="toggle-quotes"
                  checked={showQuotes}
                  onChange={(val) => {
                    setShowQuotes(val);
                    applyRealtime({ showQuotes: val });
                  }}
                  label="Show focus quotes"
                  sub="Display a quiet quote below the focus timer."
                />
                <Toggle
                  id="toggle-show-exam-deadline"
                  checked={showExamDeadline}
                  onChange={(val) => {
                    setShowExamDeadline(val);
                    applyRealtime({ showExamDeadline: val });
                  }}
                  label="Show upcoming exam deadline"
                  sub="Display your next exam countdown beneath the clock."
                />
              </div>
            </div>
          )}

          {/* 3. STUDY & DATA */}
          {activeTab === 'study' && (
            <div className="settings-tab-section">
              <div className="settings-section-block">
                <div className="settings-section-header-title">Daily Session Target</div>
                <div className="setting-item">
                  <label className="setting-label" htmlFor="setting-goal">Sessions per day</label>
                  <div className="setting-input-row">
                    <button
                      type="button"
                      className="setting-stepper"
                      onClick={() => setDailyGoal((g) => Math.max(1, g - 1))}
                    >
                      −
                    </button>
                    <input
                      id="setting-goal"
                      className="setting-input setting-input-center tabular-nums"
                      type="number"
                      min="1"
                      max="24"
                      value={dailyGoal}
                      onChange={(e) => setDailyGoal(Math.max(1, Number(e.target.value) || 1))}
                    />
                    <button
                      type="button"
                      className="setting-stepper"
                      onClick={() => setDailyGoal((g) => Math.min(24, g + 1))}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="settings-section-block">
                <div className="settings-section-header-title">Study Subjects</div>
                {targetsRaw.length === 0 ? (
                  <p className="settings-section-subtitle">
                    Organize focus sessions by exam or project subjects.
                  </p>
                ) : (
                  <div className="settings-targets-list">
                    {targetsRaw.map((t, i) => {
                      const subjectList = t.subjectsStr
                        ? t.subjectsStr.split(',').map((s) => s.trim()).filter(Boolean)
                        : [];
                      const currentInput = newSubjectInputs[i] || '';
                      return (
                        <div key={t.id || i} className="settings-target-card">
                          <div className="settings-target-card-header">
                            <input
                              className="settings-target-name-input"
                              value={t.name}
                              onChange={(e) => handleUpdateTarget(i, 'name', e.target.value)}
                              placeholder="Target Name"
                              aria-label="Target Name"
                            />
                            <button
                              type="button"
                              className="settings-target-remove-btn"
                              onClick={() => handleRemoveTarget(i)}
                              aria-label="Delete target"
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
                                  >
                                    ✕
                                  </button>
                                </span>
                              ))}
                            </div>
                            <div className="settings-add-subject-row">
                              <input
                                className="settings-add-subject-input"
                                placeholder="Add subject..."
                                value={currentInput}
                                onChange={(e) =>
                                  setNewSubjectInputs((prev) => ({ ...prev, [i]: e.target.value }))
                                }
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
                                Add
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <button type="button" className="settings-add-target-btn" onClick={handleAddTarget}>
                  + Add Target
                </button>
              </div>

              <div className="settings-section-block">
                <div className="settings-section-header-title">Backup & Extension</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button type="button" className="btn btn-secondary settings-inline-btn" onClick={handleExportData}>
                    Export Backup (.json)
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary settings-inline-btn"
                    onClick={() => {
                      if (onOpenInstall) onOpenInstall('extension');
                      onClose();
                    }}
                  >
                    Chrome Extension (.zip)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. ACCOUNT & SHORTCUTS */}
          {activeTab === 'account' && (
            <div className="settings-tab-section">
              <div className="settings-section-block">
                <div className="settings-section-header-title">Account</div>
                {currentUser ? (
                  <div className="settings-account-profile-card">
                    <div className="settings-account-avatar-large">
                      {currentUser.photoURL ? (
                        <img src={currentUser.photoURL} alt="Avatar" referrerPolicy="no-referrer" />
                      ) : (
                        (currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="settings-account-details">
                      <div className="settings-account-name">{currentUser.displayName || 'Focus Scholar'}</div>
                      <div className="settings-account-email">{currentUser.email}</div>
                    </div>
                    <button type="button" className="settings-account-signout-btn" onClick={signOut}>
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="settings-account-guest-card">
                    <div className="settings-account-guest-title">Guest Mode</div>
                    <div className="settings-account-guest-desc">
                      Sign in with Google to sync sessions, streaks, and stats across devices.
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary settings-inline-btn"
                      onClick={() => openAuthModal('Sign in with Google to sync your study history.')}
                    >
                      Sign In with Google
                    </button>
                  </div>
                )}
              </div>

              <div className="settings-section-block">
                <div className="settings-section-header-title">Keyboard Shortcuts</div>
                <div className="settings-shortcuts-list">
                  {[
                    { key: 'Space', desc: 'Start / Pause Timer' },
                    { key: 'R', desc: 'Reset Timer' },
                    { key: 'S', desc: 'Skip Phase' },
                    { key: 'F', desc: 'Fullscreen' },
                    { key: 'T', desc: 'Tasks' },
                    { key: 'M', desc: 'Music' },
                    { key: 'N', desc: 'Notepad' },
                    { key: 'C / V', desc: 'Gemini Chat / Voice' },
                  ].map((s) => (
                    <div key={s.key} className="settings-shortcut-row">
                      <kbd className="settings-kbd">{s.key}</kbd>
                      <span className="settings-shortcut-desc">{s.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {onOpenLegal && (
                <div className="settings-legal-inline">
                  <button type="button" className="settings-text-link" onClick={() => onOpenLegal('privacy')}>
                    Privacy
                  </button>
                  <span aria-hidden="true">·</span>
                  <button type="button" className="settings-text-link" onClick={() => onOpenLegal('terms')}>
                    Terms
                  </button>
                  <span aria-hidden="true">·</span>
                  <button type="button" className="settings-text-link" onClick={() => onOpenLegal('refund')}>
                    Refund Policy
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 5. ADMIN (only visible to admin) */}
          {activeTab === 'admin' && canSetGlobalDefault && (
            <div className="settings-tab-section">
              <div className="settings-section-block">
                <div className="settings-section-header-title">Site Default Wallpaper</div>
                <p className="settings-section-subtitle">
                  Set the default background shown every time visitors enter Flowstate.
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px', padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <img
                    src={globalDefault || '/defaultpreset.jpg'}
                    alt="Current default wallpaper"
                    referrerPolicy="no-referrer"
                    style={{ width: '68px', height: '42px', borderRadius: '7px', objectFit: 'cover', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 600 }}>Active Default</div>
                    <div style={{ fontSize: '11.5px', opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {globalDefault || '/defaultpreset.jpg'}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary settings-inline-btn"
                    onClick={() => {
                      onClose();
                      setShowPicker(true);
                    }}
                  >
                    Gallery
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <input
                    type="text"
                    className="settings-input"
                    placeholder="Paste URL or /defaultpreset.jpg"
                    value={adminDefaultWpUrl}
                    onChange={(e) => setAdminDefaultWpUrl(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!adminDefaultWpUrl.trim()}
                    onClick={async () => {
                      try {
                        await setAsGlobalDefault(adminDefaultWpUrl.trim(), { forceForExisting: true });
                        toast('Default wallpaper updated for everyone.', 'success', 2600);
                        setAdminDefaultWpUrl('');
                      } catch (err) {
                        toast(err?.message || 'Could not update default wallpaper.', 'error', 2600);
                      }
                    }}
                  >
                    Set Default
                  </button>
                </div>
              </div>

              <div className="settings-section-block">
                <div className="settings-section-header-title">Grant PRO Access</div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <input
                    type="text"
                    className="settings-input"
                    placeholder="User email or UID"
                    value={adminManualUid}
                    onChange={(e) => setAdminManualUid(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleGrantPro(adminManualUid)}
                    disabled={!adminManualUid.trim()}
                  >
                    Grant
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default SettingsDrawer;
