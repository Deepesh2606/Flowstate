import React, { useState, useRef, useEffect, Suspense, lazy } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWallpaper } from '../../contexts/WallpaperContext';
import { useAudio } from '../../contexts/AudioContext';
import TabBar from './TabBar';
import TimerTab from '../Timer/TimerTab';
import ClockTab from '../Timer/ClockTab';
import { useSettings } from '../../hooks/useSettings';
import { IconImage, IconSettings, IconUser, IconHeadphones, IconChat, IconMic, IconEdit, IconMusicNote, IconDockTasks } from '../Icons';
import { getWallpaperContrast, isVideoUrl, getOptimizedWallpaperUrl } from '../../utils/imageUtils';
import FloatingAudioWidget from '../Audio/FloatingAudioWidget';
import WallpaperPicker from '../WallpaperPicker';
import InstallModal from '../InstallModal';
import GeminiCompanionDrawer from '../Chat/GeminiCompanionDrawer';
import AudioDrawer from '../Audio/AudioDrawer';
import Notepad from '../Notepad/Notepad';
import LiveRoomsModal from '../Rooms/LiveRoomsModal';
import CommandPalette from './CommandPalette';
import { useToast } from '../Toast/ToastProvider';

const StatsTab = lazy(() => import('../Stats/StatsTab'));
const HistoryTab = lazy(() => import('../History/HistoryTab'));
const SettingsDrawer = lazy(() => import('../Settings/SettingsDrawer'));
const TasksDrawer = lazy(() => import('../Tasks/TasksDrawer'));

import GoogleSignInButton from '../Auth/GoogleSignInButton';
import LegalModal, { IconShield } from '../Legal/LegalModal';

const BUY_ME_A_COFFEE_URL = import.meta.env.VITE_BUY_ME_A_COFFEE_URL || 'https://buymeacoffee.com/deepesh2606';
const WALLPAPER_FALLBACK = '/defaultpreset.jpg';

const FallbackLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'rgba(255,255,255,0.5)' }}>
    Loading...
  </div>
);

const AppShell = () => {
  const { currentUser, signOut, openAuthModal } = useAuth();
  const { wallpaper, showPicker, setShowPicker } = useWallpaper();
  // Keep a known local image on screen until a cached/remote wallpaper has
  // completely loaded. This avoids the blank flash that can happen on first
  // paint while Firestore or Cloudinary assets are still arriving.
  const [renderedWallpaper, setRenderedWallpaper] = useState(() => {
    const raw = wallpaper || WALLPAPER_FALLBACK;
    return getOptimizedWallpaperUrl(raw);
  });
  const [isWallpaperLoading, setIsWallpaperLoading] = useState(false);
  const { settings, updateSettings } = useSettings();
  const { showAudioDrawer, setShowAudioDrawer, isAnyPlaying, isPlaybackPaused, openMusicPlayer, openAudioDrawerWithTab } = useAudio();
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [installModalTab, setInstallModalTab] = useState('extension');
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  const openInstallWithTab = (tab = 'extension') => {
    setInstallModalTab(tab);
    setShowInstallModal(true);
  };

  // Global hotkeys (Cmd+K)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);
  const { toast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showGeminiDrawer, setShowGeminiDrawer] = useState(false);
  const [geminiDrawerMode, setGeminiDrawerMode] = useState('chat'); // 'chat' | 'voice'
  const [showLiveRooms, setShowLiveRooms] = useState(false);
  const [realOnlineCount, setRealOnlineCount] = useState(0);
  const timerActionsRef = useRef(null); // ref to expose timer play/pause/reset/skip/syncToRoom
  const contentAreaRef = useRef(null);
  const [activeTab, setActiveTab] = useState('timer');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const [showNotepad, setShowNotepad] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState('privacy');
  const [pendingSwitchMode, setPendingSwitchMode] = useState(null);
  const menuRef = useRef(null);

  const openGeminiMode = (targetMode) => {
    if (showGeminiDrawer && geminiDrawerMode === targetMode) {
      setShowGeminiDrawer(false);
    } else {
      setGeminiDrawerMode(targetMode);
      setShowGeminiDrawer(true);
    }
  };

  useEffect(() => {
    const rawWallpaper = wallpaper || WALLPAPER_FALLBACK;
    const nextWallpaper = getOptimizedWallpaperUrl(rawWallpaper);
    if (nextWallpaper === renderedWallpaper) {
      setIsWallpaperLoading(false);
      return undefined;
    }

    let cancelled = false;

    const applyWhenReady = () => {
      if (cancelled) return;
      setRenderedWallpaper(nextWallpaper);
      setIsWallpaperLoading(false);
    };

    if (isVideoUrl(nextWallpaper)) {
      let activeVideo = null;
      const loadVideo = (targetUrl, canRetryRaw) => {
        const video = document.createElement('video');
        activeVideo = video;
        video.preload = 'auto';
        video.muted = true;
        video.playsInline = true;
        video.addEventListener('loadeddata', () => {
          if (cancelled) return;
          setRenderedWallpaper(targetUrl);
          setIsWallpaperLoading(false);
        }, { once: true });
        video.addEventListener('error', () => {
          if (cancelled) return;
          if (canRetryRaw && rawWallpaper && rawWallpaper !== targetUrl) {
            loadVideo(rawWallpaper, false);
            return;
          }
          setIsWallpaperLoading(false);
          if (targetUrl !== WALLPAPER_FALLBACK) setRenderedWallpaper(WALLPAPER_FALLBACK);
        }, { once: true });
        video.src = targetUrl;
        video.load();
      };

      loadVideo(nextWallpaper, nextWallpaper !== rawWallpaper);
      return () => {
        cancelled = true;
        if (activeVideo) {
          activeVideo.removeAttribute('src');
          activeVideo.load();
        }
      };
    }

    const loadImage = (targetUrl, canRetryRaw) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => {
        if (cancelled) return;
        setRenderedWallpaper(targetUrl);
        setIsWallpaperLoading(false);
      };
      image.onerror = () => {
        if (cancelled) return;
        if (canRetryRaw && rawWallpaper && rawWallpaper !== targetUrl) {
          loadImage(rawWallpaper, false);
          return;
        }
        setIsWallpaperLoading(false);
        if (targetUrl !== WALLPAPER_FALLBACK) setRenderedWallpaper(WALLPAPER_FALLBACK);
      };
      image.src = targetUrl;
      return image;
    };

    const image = loadImage(nextWallpaper, nextWallpaper !== rawWallpaper);
    return () => {
      cancelled = true;
      image.onload = null;
      image.onerror = null;
    };
  }, [wallpaper, renderedWallpaper]);

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

  // Fetch real online count for Live Rooms from Express server
  useEffect(() => {
    let active = true;
    const fetchRoomsCount = async () => {
      try {
        const res = await fetch('/api/rooms');
        if (!res.ok) return;
        const data = await res.json();
        if (active && typeof data.totalOnline === 'number') {
          setRealOnlineCount(data.totalOnline);
        }
      } catch {
        // ignore transient errors
      }
    };
    fetchRoomsCount();
    const intervalId = setInterval(fetchRoomsCount, 15000);
    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [showLiveRooms]);

  // Reset scroll position cleanly when switching tabs
  useEffect(() => {
    if (contentAreaRef.current) {
      contentAreaRef.current.scrollTop = 0;
    }
  }, [activeTab]);

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
      if (e.key === 'Escape') {
        setShowSettings(false);
        setShowTasks(false);
        setShowAudioDrawer(false);
        setShowUserMenu(false);
        setShowNotepad(false);
        setShowGeminiDrawer(false);
        if (document.activeElement && typeof document.activeElement.blur === 'function') {
          document.activeElement.blur();
        }
        return;
      }

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

      // Block all shortcuts if ANY modifier key is held (Shift, Ctrl, Meta/Cmd, Alt)
      // e.g. Shift + S (typing capital S) should never trigger skip
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      const key = e.key.toLowerCase();

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        timerActionsRef.current?.togglePlay?.();
      } else if (key === 'c') {
        e.preventDefault();
        setGeminiDrawerMode('chat');
        setShowGeminiDrawer((v) => !v);
      } else if (key === 'v') {
        e.preventDefault();
        setGeminiDrawerMode('voice');
        setShowGeminiDrawer((v) => !v);
      } else if (key === 'r') {
        timerActionsRef.current?.reset?.();
      } else if (key === 's') {
        timerActionsRef.current?.skip?.();
      } else if (key === 't') {
        e.preventDefault();
        setShowTasks((v) => !v);
      } else if (key === 'n') {
        e.preventDefault();
        setShowNotepad((v) => !v);
      } else if (key === 'm') {
        e.preventDefault();
        setShowAudioDrawer((v) => !v);
      } else if (key === 'f') {
        e.preventDefault();
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
          const docEl = document.documentElement;
          const req = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
          if (req) {
            const promise = req.call(docEl);
            if (promise !== undefined && promise.catch) {
              promise.catch((err) => {
                console.warn('Error attempting to enable fullscreen:', err);
              });
            }
          }
        } else {
          const exit = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
          if (exit) {
            const promise = exit.call(document);
            if (promise !== undefined && promise.catch) {
              promise.catch((err) => {
                console.warn('Error attempting to exit fullscreen:', err);
              });
            }
          }
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

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
      document.documentElement.style.setProperty('--clock-font-family', "'Plus Jakarta Sans', system-ui, sans-serif");
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



  const handleSyncRoomTimer = ({ roomName, focusMinutes, breakMinutes, phase, remainingSec, isRunning }) => {
    updateSettings({
      durations: {
        ...settings?.durations,
        pomodoro: Math.max(5, Number(focusMinutes) || 45) * 60,
        shortBreak: Math.max(1, Number(breakMinutes) || 5) * 60,
      },
    });
    timerActionsRef.current?.syncToRoom?.({
      phase,
      remainingSec,
      isRunning,
      roomName,
    });
    setActiveTab('timer');
    setShowLiveRooms(false);
    toast?.(`Synced timer with ${roomName}`, 'success', 3000);
  };

  return (
    <div className={`app-layout${showGeminiDrawer ? ' app-layout--chat-open' : ''}`}>
      {/* Wallpaper Background (Video or Image) */}
      {isVideoUrl(renderedWallpaper) ? (
        <video
          key={renderedWallpaper}
          className="wallpaper-video-bg"
          src={renderedWallpaper}
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
        />
      ) : (
        <div
          className="wallpaper-bg"
          style={{ backgroundImage: `url("${renderedWallpaper}")` }}
          aria-hidden="true"
        />
      )}
      <div className={`wallpaper-overlay${isWallpaperLoading ? ' is-wallpaper-loading' : ''}`} aria-hidden="true" />
      <div id="clock-backdrop-host" aria-hidden="true" />

      {/* App Shell */}
      <div className="app-shell">
        {/* Top Bar — Clean 3-Zone Header */}
        <header className="topbar">
          <button
            type="button"
            className="topbar-logo"
            onClick={() => handleTabChange('timer')}
            aria-label="FLOWSTATE Home"
          >
            FLOWSTATE
          </button>

          <button
            type="button"
            className="topbar-cmd-btn"
            onClick={() => setShowCommandPalette(true)}
            aria-label="Open quick command palette"
            title="Quick Jump (Cmd/Ctrl + K)"
          >
            <span>Quick Jump</span>
            <kbd className="topbar-cmd-kbd">⌘K</kbd>
          </button>

          <div className="topbar-actions" ref={menuRef}>
            <button
              type="button"
              className="topbar-action-btn"
              onClick={() => openInstallWithTab('extension')}
              title="Download FLOWSTATE Chrome Extension"
              aria-label="Chrome Extension"
              data-testid="topbar-extension-btn"
            >
              <span>Extension</span>
            </button>

            <button
              type="button"
              className="topbar-action-btn topbar-rooms-btn"
              onClick={() => setShowLiveRooms(true)}
              title="Join Live Study Rooms"
              aria-label="Live Rooms"
            >
              <span>Live Rooms</span>
              {realOnlineCount > 0 && (
                <span className="rooms-dock-badge">{realOnlineCount}</span>
              )}
            </button>

            {/* Mobile-only quick tools so Audio, Wallpaper & Settings are 1 tap away on phones */}
            <button
              type="button"
              className="topbar-mobile-icon-btn"
              onClick={() => setShowAudioDrawer((v) => !v)}
              aria-label="Music Player & Ambience"
              title="Music & Ambience"
            >
              <IconHeadphones size={16} />
              {(isAnyPlaying || isPlaybackPaused) && <span className="audio-badge-active" />}
            </button>
            <button
              type="button"
              className="topbar-mobile-icon-btn"
              onClick={() => setShowPicker(true)}
              aria-label="Wallpapers"
              title="Wallpapers"
            >
              <IconImage size={16} />
            </button>
            <button
              type="button"
              className="topbar-mobile-icon-btn"
              onClick={() => setShowSettings(true)}
              aria-label="Settings"
              title="Settings"
            >
              <IconSettings size={16} />
            </button>

            {currentUser ? (
              currentUser.photoURL ? (
                <button
                  type="button"
                  className="topbar-avatar-btn"
                  onClick={() => setShowUserMenu((v) => !v)}
                  aria-label="Account menu"
                  aria-expanded={showUserMenu}
                  id="user-avatar"
                >
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="user-avatar"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ) : (
                <button
                  type="button"
                  className="topbar-icon-btn"
                  onClick={() => setShowUserMenu((v) => !v)}
                  aria-label="Account menu"
                  aria-expanded={showUserMenu}
                  id="user-avatar-fallback"
                >
                  <IconUser size={16} />
                </button>
              )
            ) : (
              <button
                type="button"
                className="topbar-signin-btn"
                onClick={() => openAuthModal('Sign in with Google to sync your study data')}
                id="topbar-signin-btn"
                title="Sign in with Google"
              >
                Sign In
              </button>
            )}

            {/* Account dropdown menu (anchored cleanly under top-right account trigger) */}
            {showUserMenu && (
              <div className="user-menu user-menu--top" role="menu">
                {currentUser ? (
                  <>
                    <div className="user-menu-info">
                      <div className="user-menu-name">{currentUser.displayName || 'User'}</div>
                      <div className="user-menu-email">{currentUser.email}</div>
                    </div>
                    <button
                      type="button"
                      className="user-menu-item"
                      onClick={() => {
                        openMusicPlayer('spotify');
                        setShowUserMenu(false);
                      }}
                      role="menuitem"
                      id="menu-open-music"
                    >
                      <IconHeadphones size={14} style={{ marginRight: 8 }} /> Music Player
                    </button>
                    <button
                      type="button"
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
                      type="button"
                      className="user-menu-item"
                      onClick={() => {
                        setShowPicker(true);
                        setShowUserMenu(false);
                      }}
                      role="menuitem"
                      id="menu-change-wallpaper"
                    >
                      <IconImage size={14} style={{ marginRight: 8 }} /> Wallpapers
                    </button>
                    <button
                      type="button"
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
                      type="button"
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
                      <span style={{ marginRight: 8, fontSize: '14px' }}>☕</span> Buy Me a Coffee
                    </a>
                    <button
                      type="button"
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
                  </>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Bottom Right Controls (Desktop — Wallpapers & Settings only, zero duplicates) */}
        <div className="floating-controls" role="group" aria-label="Appearance and settings">
          <button
            type="button"
            className={`bottom-dock-btn${showPicker ? ' active' : ''}`}
            onClick={() => setShowPicker(true)}
            aria-label="Change wallpaper"
            id="wallpaper-change-btn"
            title="Wallpapers"
          >
            <IconImage size={18} />
          </button>

          <button
            type="button"
            className={`bottom-dock-btn${showSettings ? ' active' : ''}`}
            onClick={() => setShowSettings(true)}
            aria-label="Open settings"
            id="settings-btn"
            title="Settings"
          >
            <IconSettings size={18} />
          </button>
        </div>

        {/* Floating Notepad */}
        {showNotepad && (
          <div className="bottom-left-notepad-floating">
            <Notepad onClose={() => setShowNotepad(false)} />
          </div>
        )}

        {/* Bottom Left Dock (Tasks, Audio, Notepad, Gemini Chat, Live Voice) */}
        <div className="bottom-left-dock" role="group" aria-label="Workspace tools">
          <button
            type="button"
            className={`bottom-dock-btn${showTasks ? ' active' : ''}`}
            onClick={() => setShowTasks((v) => !v)}
            title="Tasks & Todos (T)"
            aria-label="Tasks & Todos (T)"
            id="dock-tasks-btn"
          >
            <IconDockTasks size={18} />
          </button>

          <button
            type="button"
            className={`bottom-dock-btn${showAudioDrawer ? ' active' : ''}`}
            onClick={() => setShowAudioDrawer((v) => !v)}
            title="Music Player & Ambience (M)"
            aria-label="Music Player & Ambience (M)"
            id="dock-music-btn"
            style={{ position: 'relative' }}
          >
            <IconMusicNote size={18} />
            {(isAnyPlaying || isPlaybackPaused) && <span className="audio-badge-active" />}
          </button>

          <button
            type="button"
            className={`bottom-dock-btn${showNotepad ? ' active' : ''}`}
            onClick={() => setShowNotepad((v) => !v)}
            title="Notepad (N)"
            aria-label="Notepad (N)"
            id="dock-notepad-btn"
          >
            <IconEdit size={18} />
          </button>

          <button
            type="button"
            className={`bottom-dock-btn gemini-dock-btn${showGeminiDrawer && geminiDrawerMode === 'chat' ? ' active gemini-dock-btn--active' : ''}`}
            onClick={() => openGeminiMode('chat')}
            id="dock-gemini-chat-btn"
            data-testid="dock-gemini-chat-btn"
            title="Gemini Chat (C)"
            aria-label="Gemini Chat (C)"
            aria-expanded={showGeminiDrawer && geminiDrawerMode === 'chat'}
          >
            <IconChat size={17} />
          </button>

          <button
            type="button"
            className={`bottom-dock-btn gemini-dock-btn gemini-voice-dock-btn${showGeminiDrawer && geminiDrawerMode === 'voice' ? ' active gemini-dock-btn--active' : ''}`}
            onClick={() => openGeminiMode('voice')}
            id="dock-live-voice-btn"
            data-testid="dock-live-voice-btn"
            title="Live Voice Conversation (V)"
            aria-label="Live Voice Conversation (V)"
            aria-expanded={showGeminiDrawer && geminiDrawerMode === 'voice'}
          >
            <IconMic size={17} />
          </button>
        </div>

        {/* Tab Content */}
        <main className="content-area" id={`panel-${activeTab}`} ref={contentAreaRef}>
          <div
            className="tab-content fs-snap-section"
            style={{ display: activeTab === 'timer' ? 'block' : 'none', animation: activeTab === 'timer' ? 'tabFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards' : 'none' }}
          >
            <TimerTab
              settings={settings}
              onUpdateSettings={updateSettings}
              onOpenSettings={() => setShowSettings(true)}
              hasWallpaper={!!wallpaper}
              onTabChange={handleTabChange}
              initialMode={pendingSwitchMode}
              onInitialModeConsumed={() => setPendingSwitchMode(null)}
              timerActionsRef={timerActionsRef}
            />
          </div>
          <div
            className="tab-content fs-snap-section"
            style={{ display: activeTab === 'clock' ? 'block' : 'none', animation: activeTab === 'clock' ? 'tabFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards' : 'none' }}
          >
            <ClockTab
              settings={settings}
              onUpdateSettings={updateSettings}
              hasWallpaper={!!wallpaper}
              onTabChange={handleTabChange}
              onOpenSettings={() => setShowSettings(true)}
              isActive={activeTab === 'clock'}
            />
          </div>
          <div
            className="tab-content fs-normal-section"
            style={{ display: activeTab === 'stats' ? 'block' : 'none', animation: activeTab === 'stats' ? 'tabFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards' : 'none' }}
          >
            <Suspense fallback={<FallbackLoader />}>
              <StatsTab
                initialSubTab={pendingSwitchMode === 'leaderboard' ? 'leaderboard' : 'stats'}
                onSubTabConsumed={() => setPendingSwitchMode(null)}
                onOpenStudyGroups={() => setShowLiveRooms(true)}
              />
            </Suspense>
          </div>
          <div
            className="tab-content fs-normal-section"
            style={{ display: activeTab === 'history' ? 'block' : 'none', animation: activeTab === 'history' ? 'tabFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards' : 'none' }}
          >
            <Suspense fallback={<FallbackLoader />}>
              <HistoryTab onTabChange={handleTabChange} />
            </Suspense>
          </div>
        </main>

        {/* Floating Mini Player Pill (when soundscape/lofi is playing) */}
        <FloatingAudioWidget />

        {/* Bottom Tab Bar */}
        <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      {/* Gemini Chat & Live Voice — persistent sidebar */}
      {showGeminiDrawer && (
        <GeminiCompanionDrawer
          mode={geminiDrawerMode}
          onModeChange={setGeminiDrawerMode}
          onClose={() => setShowGeminiDrawer(false)}
        />
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
            onOpenInstall={(tab) => openInstallWithTab(tab || 'desktop')}
            onOpenLegal={handleOpenLegal}
          />
        )}
        {showTasks && <TasksDrawer onClose={() => setShowTasks(false)} />}
      </Suspense>

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onNavigate={(id) => {
          if (id === 'timer' || id === 'clock' || id === 'stats' || id === 'history') {
            setActiveTab(id);
          } else if (id === 'wallpaper') {
            setShowPicker(true);
          } else if (id === 'audio') {
            setShowAudioDrawer(true);
          } else if (id === 'tasks') {
            setShowTasks(true);
          } else if (id === 'notepad') {
            setShowNotepad(true);
          } else if (id === 'chat') {
            setGeminiDrawerMode('chat');
            setShowGeminiDrawer(true);
          } else if (id === 'voice') {
            setGeminiDrawerMode('voice');
            setShowGeminiDrawer(true);
          } else if (id === 'rooms') {
            setShowLiveRooms(true);
          } else if (id === 'extension') {
            openInstallWithTab('extension');
          } else {
            setShowSettings(true);
          }
        }}
      />

      <InstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        deferredPrompt={deferredPrompt}
        onInstalled={() => setDeferredPrompt(null)}
        initialTab={installModalTab}
      />

      <LegalModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        initialTab={legalModalTab}
      />

      {/* Live Study Rooms Modal */}
      {showLiveRooms && (
        <LiveRoomsModal
          onClose={() => setShowLiveRooms(false)}
          onSyncTimer={handleSyncRoomTimer}
          currentUser={currentUser}
        />
      )}

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
