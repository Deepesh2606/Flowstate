import React, { useState, useRef, useEffect, Suspense, lazy } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWallpaper } from '../../contexts/WallpaperContext';
import { useAudio } from '../../contexts/AudioContext';
import TabBar from './TabBar';
import RightSideNav from './RightSideNav';
import TimerTab from '../Timer/TimerTab';
import ClockTab from '../Timer/ClockTab';
import { useSettings } from '../../hooks/useSettings';
import { IconTasks, IconImage, IconSettings, IconUser, IconHeadphones, IconChat, IconEdit, IconMusicNote, IconDockTasks } from '../Icons';
import { getWallpaperContrast, isVideoUrl } from '../../utils/imageUtils';
import FloatingAudioWidget from '../Audio/FloatingAudioWidget';
import WallpaperPicker from '../WallpaperPicker';
import InstallModal from '../InstallModal';
import AIChatSidebar from '../Chat/AIChatSidebar';
import AudioDrawer from '../Audio/AudioDrawer';
import Notepad from '../Notepad/Notepad';

const StatsTab = lazy(() => import('../Stats/StatsTab'));
const HistoryTab = lazy(() => import('../History/HistoryTab'));
const SettingsDrawer = lazy(() => import('../Settings/SettingsDrawer'));
const TasksDrawer = lazy(() => import('../Tasks/TasksDrawer'));

import GoogleSignInButton from '../Auth/GoogleSignInButton';
import LegalModal, { IconShield } from '../Legal/LegalModal';

const BUY_ME_A_COFFEE_URL = import.meta.env.VITE_BUY_ME_A_COFFEE_URL || 'https://buymeacoffee.com/deepesh2606';

const FallbackLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'rgba(255,255,255,0.5)' }}>
    Loading...
  </div>
);

const AppShell = () => {
  const { currentUser, signOut, openAuthModal } = useAuth();
  const { wallpaper, showPicker, setShowPicker } = useWallpaper();
  const { settings, updateSettings } = useSettings();
  const { showAudioDrawer, setShowAudioDrawer, isAnyPlaying, isPlaybackPaused, openMusicPlayer, openAudioDrawerWithTab } = useAudio();
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const timerActionsRef = useRef(null); // ref to expose timer play/pause/reset/skip
  const [activeTab, setActiveTab] = useState('timer');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const [showNotepad, setShowNotepad] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState('privacy');
  const [pendingSwitchMode, setPendingSwitchMode] = useState(null);
  const [currentTimerMode, setCurrentTimerMode] = useState('pomodoro');
  const menuRef = useRef(null);

  const handleOpenLegal = (tab = 'privacy') => {
    setLegalModalTab(tab);
    setShowLegalModal(true);
  };

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // Sync fullscreen state attributes on document element & body
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      if (isFs) {
        document.documentElement.setAttribute('data-fullscreen', 'true');
        document.body.classList.add('is-fullscreen');
      } else {
        document.documentElement.removeAttribute('data-fullscreen');
        document.body.classList.remove('is-fullscreen');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Request notification permission once (non-intrusively)
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      // Defer request by 5s so it doesn't interrupt initial load
      const t = setTimeout(() => {
        Notification.requestPermission().catch(() => {});
      }, 5000);
      return () => clearTimeout(t);
    }
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      // Don't trigger if user is interacting with an input, textarea, select, or contenteditable
      const target = e.target;
      const targetTag = target?.tagName?.toLowerCase();
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isInput =
        targetTag === 'input' ||
        targetTag === 'textarea' ||
        targetTag === 'select' ||
        Boolean(target?.isContentEditable) ||
        Boolean(target?.closest?.('input, textarea, select, [contenteditable="true"]')) ||
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        activeTag === 'select' ||
        Boolean(document.activeElement?.isContentEditable) ||
        Boolean(document.activeElement?.closest?.('input, textarea, select, [contenteditable="true"]'));

      if (isInput) return;

      if (e.key === 'Escape') {
        setShowSettings(false);
        setShowTasks(false);
        setShowAudioDrawer(false);
        setShowUserMenu(false);
        setShowNotepad(false);
        setShowAIChat(false);
        return;
      }

      // Block all shortcuts if ANY modifier key is held (Shift, Ctrl, Meta/Cmd, Alt)
      // e.g. Shift + S (typing capital S) should never trigger skip
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      const key = e.key.toLowerCase();

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        timerActionsRef.current?.togglePlay?.();
      } else if (key === 'c') {
        e.preventDefault();
        setShowAIChat((v) => !v);
      } else if (key === 'r') {
        timerActionsRef.current?.reset?.();
      } else if (key === 's') {
        timerActionsRef.current?.skip?.();
      } else if (key === 't') {
        e.preventDefault();
        setActiveTab('timer');
        setPendingSwitchMode('pomodoro');
        setCurrentTimerMode('pomodoro');
      } else if (key === 'f') {
        e.preventDefault();
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
          const docEl = document.documentElement;
          const req = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
          if (req) {
            req.call(docEl).catch((err) => {
              console.warn('Error attempting to enable fullscreen:', err);
            });
          }
        } else {
          const exit = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
          if (exit) {
            exit.call(document).catch((err) => {
              console.warn('Error attempting to exit fullscreen:', err);
            });
          }
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setShowAudioDrawer]);

  useEffect(() => {
    const currentTheme = settings?.theme || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [settings?.theme]);

  useEffect(() => {
    let cancelled = false;

    const applyClockColor = async () => {
      const autoColor = settings?.autoClockColor ?? true;
      const customColor = settings?.clockColor || settings?.textColor || '#ffffff';

      if (autoColor && wallpaper) {
        const contrast = await getWallpaperContrast(wallpaper);
        if (!cancelled) {
          document.documentElement.style.setProperty('--clock-text-color', contrast.color);
          document.documentElement.style.setProperty('--clock-text-shadow', contrast.shadow);
          document.documentElement.style.setProperty('--clock-text-shadow-active', contrast.shadow);
          document.documentElement.style.setProperty('--clock-is-light', contrast.isLight ? '1' : '0');
        }
      } else {
        if (!cancelled) {
          document.documentElement.style.setProperty('--clock-text-color', customColor);
          document.documentElement.style.setProperty(
            '--clock-text-shadow',
            `0 0 40px color-mix(in srgb, ${customColor} 25%, transparent), 0 2px 24px rgba(0, 0, 0, 0.75)`
          );
          document.documentElement.style.setProperty(
            '--clock-text-shadow-active',
            `0 0 60px color-mix(in srgb, ${customColor} 35%, transparent), 0 2px 30px rgba(0, 0, 0, 0.85)`
          );
          document.documentElement.style.setProperty('--clock-is-light', '0');
        }
      }
    };

    applyClockColor();

    if (settings?.clockFont) {
      document.documentElement.style.setProperty('--clock-font-family', settings.clockFont);
    } else {
      document.documentElement.style.setProperty('--clock-font-family', "'Inter', system-ui, sans-serif");
    }

    if (settings?.clockFontWeight) {
      document.documentElement.style.setProperty('--clock-font-weight', settings.clockFontWeight);
    } else {
      document.documentElement.style.setProperty('--clock-font-weight', '800');
    }

    if (settings?.clockLetterSpacing) {
      document.documentElement.style.setProperty('--clock-letter-spacing', settings.clockLetterSpacing);
    } else {
      document.documentElement.style.setProperty('--clock-letter-spacing', '-0.04em');
    }

    return () => {
      cancelled = true;
    };
  }, [settings?.clockColor, settings?.textColor, settings?.autoClockColor, settings?.clockFont, settings?.clockFontWeight, settings?.clockLetterSpacing, wallpaper]);


  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);


  const handleTabChange = (tab, subMode = null) => {
    setActiveTab(tab);
    if (subMode) setPendingSwitchMode(subMode);
  };

  // RightSideNav requests a mode switch
  const handleRightNavModeSwitch = (modeId) => {
    setPendingSwitchMode(modeId);
    setCurrentTimerMode(modeId);
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'timer':
        return (
        <TimerTab
            settings={settings}
            onUpdateSettings={updateSettings}
            onOpenSettings={() => setShowSettings(true)}
            hasWallpaper={!!wallpaper}
            onTabChange={handleTabChange}
            initialMode={pendingSwitchMode}
            onInitialModeConsumed={() => setPendingSwitchMode(null)}
            timerActionsRef={timerActionsRef}
            onModeChange={setCurrentTimerMode}
          />
        );
      case 'clock':
        return (
          <ClockTab
            settings={settings}
            onUpdateSettings={updateSettings}
            hasWallpaper={!!wallpaper}
            onTabChange={handleTabChange}
            onOpenSettings={() => setShowSettings(true)}
          />
        );
      case 'stats':
        return (
          <Suspense fallback={<FallbackLoader />}>
            <StatsTab
              initialSubTab={pendingSwitchMode === 'leaderboard' ? 'leaderboard' : 'stats'}
              onSubTabConsumed={() => setPendingSwitchMode(null)}
            />
          </Suspense>
        );
      case 'history':
        return (
          <Suspense fallback={<FallbackLoader />}>
            <HistoryTab onTabChange={handleTabChange} />
          </Suspense>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`app-layout${showAIChat ? ' app-layout--chat-open' : ''}`}>
      {/* Wallpaper Background (Video or Image) */}
      {isVideoUrl(wallpaper) ? (
        <video
          key={wallpaper}
          className="wallpaper-video-bg"
          src={wallpaper}
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
        />
      ) : (
        <div
          className="wallpaper-bg"
          style={{ backgroundImage: wallpaper ? `url(${wallpaper})` : undefined }}
          aria-hidden="true"
        />
      )}
      <div className="wallpaper-overlay" aria-hidden="true" />

      {/* App Shell */}
      <div className="app-shell">
        {/* Top Bar */}
        <header className="topbar">
          <span className="topbar-logo" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <img src="/favicon.svg" alt="Flowstate" style={{ width: 18, height: 18, borderRadius: 4 }} />
            FLOWSTATE
          </span>
        </header>

        {/* Top Right Controls (Notes/Tasks + Sign In) */}
        <div className="top-right-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!currentUser && (
            <button
              className="topbar-signin-btn"
              onClick={() => openAuthModal('Sign in with Google to sync your study data')}
              id="topbar-signin-btn"
              title="Sign in with Google"
            >
              Sign In
            </button>
          )}
          <button
            className="floating-icon-btn"
            onClick={() => setShowTasks(true)}
            aria-label="Open tasks"
            id="tasks-btn"
            title="Tasks & Notes"
          >
            <IconTasks size={18} />
          </button>
        </div>

        {/* Bottom Right Floating Controls */}
        <div className="floating-controls" ref={menuRef}>
          {/* Horizontal group for Audio, Wallpaper, Settings, and User */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* Audio & Ambience button */}
            <button
              className="floating-icon-btn"
              onClick={() => setShowAudioDrawer(true)}
              aria-label="Music Player & Ambience (Spotify, Apple Music, YT Music, Lofi)"
              id="audio-drawer-btn"
              title="Music Player & Ambience (Spotify, Apple Music, YT Music, Lofi)"
              style={{ position: 'relative' }}
            >
              <IconHeadphones size={18} />
              {(isAnyPlaying || isPlaybackPaused) && <span className="audio-badge-active" />}
            </button>

            {/* Wallpaper change button */}
            <button
              className="floating-icon-btn"
              onClick={() => setShowPicker(true)}
              aria-label="Change wallpaper"
              id="wallpaper-change-btn"
              title="Change wallpaper"
            >
              <IconImage size={18} />
            </button>

            {/* Settings button */}
            <button
              className="floating-icon-btn"
              onClick={() => setShowSettings(true)}
              aria-label="Open settings"
              id="settings-btn"
              title="Settings"
            >
              <IconSettings size={18} />
            </button>

            {/* User avatar */}
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || 'User'}
                className="user-avatar"
                onClick={() => setShowUserMenu((v) => !v)}
                id="user-avatar"
              />
            ) : (
              <button
                className="floating-icon-btn"
                onClick={() => setShowUserMenu((v) => !v)}
                id="user-avatar-fallback"
                title={currentUser ? 'User Menu' : 'Guest / Sign In'}
              >
                <IconUser size={18} />
              </button>
            )}
          </div>

          {/* User dropdown menu */}
          {showUserMenu && (
            <div className="user-menu" role="menu">
              {currentUser ? (
                <>
                  <div className="user-menu-info">
                    <div className="user-menu-name">{currentUser.displayName || 'User'}</div>
                    <div className="user-menu-email">{currentUser.email}</div>
                  </div>
                  <button
                    className="user-menu-item"
                    onClick={() => {
                      openMusicPlayer('spotify');
                      setShowUserMenu(false);
                    }}
                    role="menuitem"
                    id="menu-open-music"
                  >
                    <IconHeadphones size={14} style={{ marginRight: 8 }} /> Music Player (Spotify · Apple · YT)
                  </button>
                  <button
                    className="user-menu-item"
                    onClick={() => {
                      openAudioDrawerWithTab('ambient');
                      setShowUserMenu(false);
                    }}
                    role="menuitem"
                    id="menu-open-ambience"
                  >
                    <IconHeadphones size={14} style={{ marginRight: 8 }} /> Ambience & Sounds
                  </button>
                  <button
                    className="user-menu-item"
                    onClick={() => {
                      setShowPicker(true);
                      setShowUserMenu(false);
                    }}
                    role="menuitem"
                    id="menu-change-wallpaper"
                  >
                    <IconImage size={14} style={{ marginRight: 8 }} /> Change Wallpaper
                  </button>
                  <button
                    className="user-menu-item"
                    onClick={() => {
                      setShowSettings(true);
                      setShowUserMenu(false);
                    }}
                    role="menuitem"
                    id="menu-open-settings"
                  >
                    <IconSettings size={14} style={{ marginRight: 8 }} /> Settings
                  </button>
                  <button
                    className="user-menu-item"
                    onClick={() => {
                      handleOpenLegal('privacy');
                      setShowUserMenu(false);
                    }}
                    role="menuitem"
                    id="menu-legal-auth"
                  >
                    <IconShield size={14} style={{ marginRight: 8 }} /> Legal &amp; Policies
                  </button>
                  <a
                    href={BUY_ME_A_COFFEE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="user-menu-item coffee-item"
                    onClick={() => setShowUserMenu(false)}
                    role="menuitem"
                    id="menu-coffee-auth"
                  >
                    <span style={{ marginRight: 8, fontSize: '15px' }}>☕</span> Buy Me a Coffee
                  </a>
                  <button
                    className="user-menu-item danger"
                    onClick={() => {
                      signOut();
                      setShowUserMenu(false);
                    }}
                    role="menuitem"
                    id="menu-sign-out"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <div className="user-menu-info">
                    <div className="user-menu-name">Guest Mode</div>
                    <div className="user-menu-email">Data stored locally</div>
                  </div>
                  <div style={{ padding: '6px 8px 10px' }}>
                    <GoogleSignInButton
                      size="sm"
                      onClick={() => {
                        setShowUserMenu(false);
                        openAuthModal('Sign in with Google to sync your study data across devices');
                      }}
                    />
                  </div>
                  <button
                    className="user-menu-item"
                    onClick={() => {
                      openMusicPlayer('spotify');
                      setShowUserMenu(false);
                    }}
                    role="menuitem"
                    id="menu-open-music-guest"
                  >
                    <IconHeadphones size={14} style={{ marginRight: 8 }} /> Music Player (Spotify · Apple · YT)
                  </button>
                  <button
                    className="user-menu-item"
                    onClick={() => {
                      openAudioDrawerWithTab('ambient');
                      setShowUserMenu(false);
                    }}
                    role="menuitem"
                    id="menu-open-ambience"
                  >
                    <IconHeadphones size={14} style={{ marginRight: 8 }} /> Ambience & Sounds
                  </button>
                  <button
                    className="user-menu-item"
                    onClick={() => {
                      setShowPicker(true);
                      setShowUserMenu(false);
                    }}
                    role="menuitem"
                    id="menu-change-wallpaper"
                  >
                    <IconImage size={14} style={{ marginRight: 8 }} /> Change Wallpaper
                  </button>
                  <button
                    className="user-menu-item"
                    onClick={() => {
                      setShowSettings(true);
                      setShowUserMenu(false);
                    }}
                    role="menuitem"
                    id="menu-open-settings"
                  >
                    <IconSettings size={14} style={{ marginRight: 8 }} /> Settings
                  </button>
                  <button
                    className="user-menu-item"
                    onClick={() => {
                      handleOpenLegal('privacy');
                      setShowUserMenu(false);
                    }}
                    role="menuitem"
                    id="menu-legal-guest"
                  >
                    <IconShield size={14} style={{ marginRight: 8 }} /> Legal &amp; Policies
                  </button>
                  <a
                    href={BUY_ME_A_COFFEE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="user-menu-item coffee-item"
                    onClick={() => setShowUserMenu(false)}
                    role="menuitem"
                    id="menu-coffee-guest"
                  >
                    <span style={{ marginRight: 8, fontSize: '15px' }}>☕</span> Buy Me a Coffee
                  </a>
                </>
              )}
            </div>
          )}
        </div>

        {/* Floating Notepad (Matching Screenshot) */}
        {showNotepad && (
          <div className="bottom-left-notepad-floating">
            <Notepad onClose={() => setShowNotepad(false)} />
          </div>
        )}

        {/* Bottom Left Dock (Tasks, Music, Notepad, Ask AI) */}
        <div className="bottom-left-dock">
          <button
            type="button"
            className={`bottom-dock-btn${showTasks ? ' active' : ''}`}
            onClick={() => setShowTasks((v) => !v)}
            title="Tasks & Todos"
            aria-label="Tasks & Todos"
            id="dock-tasks-btn"
          >
            <IconDockTasks size={18} />
          </button>

          <button
            type="button"
            className={`bottom-dock-btn${showAudioDrawer ? ' active' : ''}`}
            onClick={() => setShowAudioDrawer((v) => !v)}
            title="Music Player & Ambience"
            aria-label="Music Player & Ambience"
            id="dock-music-btn"
          >
            <IconMusicNote size={18} />
          </button>

          <button
            type="button"
            className={`bottom-dock-btn${showNotepad ? ' active' : ''}`}
            onClick={() => setShowNotepad((v) => !v)}
            title="Notepad"
            aria-label="Notepad"
            id="dock-notepad-btn"
          >
            <IconEdit size={18} />
          </button>

          <button
            type="button"
            className={`ai-chat-btn${showAIChat ? ' ai-chat-btn--active' : ''}`}
            onClick={() => setShowAIChat((v) => !v)}
            id="chatgpt-btn-bottom"
            title="Ask AI (C)"
            aria-label="Ask AI (C)"
            aria-expanded={showAIChat}
          >
            <IconChat size={18} />
            <span className="ai-chat-btn-text">Ask AI</span>
          </button>
        </div>

        {/* Tab Content */}
        <main className="content-area" id={`panel-${activeTab}`}>
          <div
            className="tab-content"
            key={activeTab}
            style={{
              animation: 'tabFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
            }}
          >
            {renderTab()}
          </div>
        </main>

        {/* Floating Mini Player Pill (when soundscape/lofi is playing) */}
        <FloatingAudioWidget />

        {/* Bottom Tab Bar */}
        <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      {/* Right Side Mode Nav */}
      <RightSideNav
        activeTab={activeTab}
        timerMode={currentTimerMode}
        onSwitchMode={handleRightNavModeSwitch}
        onTabChange={handleTabChange}
      />

      {/* AI Chat — persistent left sidebar (push layout, no overlay) */}
      {showAIChat && (
        <AIChatSidebar onClose={() => setShowAIChat(false)} />
      )}

      {/* Persistent Audio & Music Drawer */}
      <AudioDrawer isOpen={showAudioDrawer} onClose={() => setShowAudioDrawer(false)} />

      {/* Modals & Drawers */}
      {showPicker && <WallpaperPicker />}
      <Suspense fallback={null}>
        {showSettings && (
          <SettingsDrawer
            settings={settings}
            onSave={updateSettings}
            onClose={() => setShowSettings(false)}
            onOpenInstall={() => setShowInstallModal(true)}
            onOpenLegal={handleOpenLegal}
          />
        )}
        {showTasks && <TasksDrawer onClose={() => setShowTasks(false)} />}
      </Suspense>

      <InstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        deferredPrompt={deferredPrompt}
        onInstalled={() => setDeferredPrompt(null)}
      />

      <LegalModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        initialTab={legalModalTab}
      />

      <style>{`
        @keyframes tabFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AppShell;
