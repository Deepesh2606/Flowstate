import React, { useState, useRef, useEffect, Suspense, lazy } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWallpaper } from '../../contexts/WallpaperContext';
import TabBar from './TabBar';
import TimerTab from '../Timer/TimerTab';
import { useSettings } from '../../hooks/useSettings';
import { IconTasks, IconImage, IconSettings, IconUser } from '../Icons';

const StatsTab = lazy(() => import('../Stats/StatsTab'));
const HistoryTab = lazy(() => import('../History/HistoryTab'));
const WallpaperPicker = lazy(() => import('../WallpaperPicker'));
const SettingsDrawer = lazy(() => import('../Settings/SettingsDrawer'));
const TasksDrawer = lazy(() => import('../Tasks/TasksDrawer'));

const FallbackLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'rgba(255,255,255,0.5)' }}>
    Loading...
  </div>
);

const AppShell = () => {
  const { currentUser, signOut } = useAuth();
  const { wallpaper, showPicker, setShowPicker } = useWallpaper();
  const { settings, updateSettings } = useSettings();

  const [activeTab, setActiveTab] = useState('timer');
  const [prevTab, setPrevTab] = useState(null);
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
    setPrevTab(activeTab);
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
          {/* Horizontal group for Wallpaper, Settings, and User */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
                  setShowPicker(true);
                  setShowUserMenu(false);
                }}
                role="menuitem"
                id="menu-change-wallpaper"
              >
                <IconImage size={14} style={{ marginRight: 8 }} /> Change Wallpaper
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

        {/* Bottom Tab Bar */}
        <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      {/* Modals & Drawers */}
      <Suspense fallback={null}>
        {showPicker && <WallpaperPicker />}
        {showSettings && (
          <SettingsDrawer
            settings={settings}
            onSave={updateSettings}
            onClose={() => setShowSettings(false)}
          />
        )}
        {showTasks && <TasksDrawer onClose={() => setShowTasks(false)} />}
      </Suspense>

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
