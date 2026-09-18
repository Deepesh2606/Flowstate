import React, { useState, useRef, useEffect, Suspense, lazy } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWallpaper } from '../../contexts/WallpaperContext';
import { useAudio } from '../../contexts/AudioContext';
import TabBar from './TabBar';
import TimerTab from '../Timer/TimerTab';
import { useSettings } from '../../hooks/useSettings';
import { IconTasks, IconImage, IconSettings, IconUser, IconHeadphones, IconMac } from '../Icons';
import { getWallpaperContrast } from '../../utils/imageUtils';
import FloatingAudioWidget from '../Audio/FloatingAudioWidget';
import LofiPlayer from '../Audio/LofiPlayer';
import WallpaperPicker from '../WallpaperPicker';
import InstallModal from '../InstallModal';

const StatsTab = lazy(() => import('../Stats/StatsTab'));
const HistoryTab = lazy(() => import('../History/HistoryTab'));
const SettingsDrawer = lazy(() => import('../Settings/SettingsDrawer'));
const TasksDrawer = lazy(() => import('../Tasks/TasksDrawer'));
const AudioDrawer = lazy(() => import('../Audio/AudioDrawer'));

const FallbackLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'rgba(255,255,255,0.5)' }}>
    Loading...
  </div>
);

const AppShell = () => {
  const { currentUser, signOut } = useAuth();
  const { wallpaper, showPicker, setShowPicker } = useWallpaper();
  const { settings, updateSettings } = useSettings();
  const { showAudioDrawer, setShowAudioDrawer, isAnyPlaying } = useAudio();
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

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

    return () => {
      cancelled = true;
    };
  }, [settings?.clockColor, settings?.textColor, settings?.autoClockColor, settings?.clockFont, wallpaper]);

  const [activeTab, setActiveTab] = useState('timer');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const menuRef = useRef(null);

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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'timer':
        return <TimerTab settings={settings} onOpenSettings={() => setShowSettings(true)} hasWallpaper={!!wallpaper} />;
      case 'stats':
        return (
          <Suspense fallback={<FallbackLoader />}>
            <StatsTab />
          </Suspense>
        );
      case 'history':
        return (
          <Suspense fallback={<FallbackLoader />}>
            <HistoryTab />
          </Suspense>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Wallpaper Background */}
      <div
        className="wallpaper-bg"
        style={{ backgroundImage: wallpaper ? `url(${wallpaper})` : undefined }}
        aria-hidden="true"
      />
      {!wallpaper && <div className="wallpaper-overlay" aria-hidden="true" />}

      {/* App Shell */}
      <div className="app-shell">
        {/* Top Bar */}
        <header className="topbar">
          <span className="topbar-logo">FLOWSTATE</span>
        </header>

        {/* Top Right Controls (Notes/Tasks) */}
        <div className="top-right-controls">
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
              aria-label="Ambience and Lofi Radio"
              id="audio-drawer-btn"
              title="Ambience & Lofi Radio"
              style={{ position: 'relative' }}
            >
              <IconHeadphones size={18} />
              {isAnyPlaying && <span className="audio-badge-active" />}
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

            {/* Add to Mac Dock / Install button */}
            <button
              className="floating-icon-btn"
              onClick={() => setShowInstallModal(true)}
              aria-label="Add to Mac Dock or Install App"
              id="mac-dock-btn"
              title="Add to Mac Dock / Install App"
            >
              <IconMac size={18} />
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
              >
                <IconUser size={18} />
              </button>
            )}
          </div>

          {/* User dropdown menu */}
          {showUserMenu && (
            <div className="user-menu" role="menu">
              <div className="user-menu-info">
                <div className="user-menu-name">{currentUser?.displayName || 'User'}</div>
                <div className="user-menu-email">{currentUser?.email}</div>
              </div>
              <button
                className="user-menu-item"
                onClick={() => {
                  setShowAudioDrawer(true);
                  setShowUserMenu(false);
                }}
                role="menuitem"
                id="menu-open-ambience"
              >
                <IconHeadphones size={14} style={{ marginRight: 8 }} /> Ambience & Music
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
                  setShowInstallModal(true);
                  setShowUserMenu(false);
                }}
                role="menuitem"
                id="menu-install-dock"
              >
                <IconMac size={14} style={{ marginRight: 8, color: 'var(--accent)' }} /> Add to Mac Dock / Install
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
                className="user-menu-item danger"
                onClick={signOut}
                role="menuitem"
                id="menu-sign-out"
              >
                Sign Out
              </button>
            </div>
          )}
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

        {/* Persistent Background Lofi Radio Player */}
        <LofiPlayer inDrawer={false} />

        {/* Bottom Tab Bar */}
        <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      {/* Modals & Drawers */}
      {showPicker && <WallpaperPicker />}
      <Suspense fallback={null}>
        {showSettings && (
          <SettingsDrawer
            settings={settings}
            onSave={updateSettings}
            onClose={() => setShowSettings(false)}
            onOpenInstall={() => setShowInstallModal(true)}
          />
        )}
        {showTasks && <TasksDrawer onClose={() => setShowTasks(false)} />}
        {showAudioDrawer && <AudioDrawer onClose={() => setShowAudioDrawer(false)} />}
      </Suspense>

      <InstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        deferredPrompt={deferredPrompt}
        onInstalled={() => setDeferredPrompt(null)}
      />

      <style>{`
        @keyframes tabFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

export default AppShell;
