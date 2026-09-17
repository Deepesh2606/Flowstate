import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWallpaper } from '../../contexts/WallpaperContext';
import TabBar from './TabBar';
import TimerTab from '../Timer/TimerTab';
import StatsTab from '../Stats/StatsTab';
import HistoryTab from '../History/HistoryTab';
import WallpaperPicker from '../WallpaperPicker';
import SettingsDrawer from '../Settings/SettingsDrawer';
import { useSettings } from '../../hooks/useSettings';

const AppShell = () => {
  const { currentUser, signOut } = useAuth();
  const { wallpaper, showPicker, setShowPicker } = useWallpaper();
  const { settings, updateSettings } = useSettings();

  const [activeTab, setActiveTab] = useState('timer');
  const [prevTab, setPrevTab] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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
        return <TimerTab settings={settings} onOpenSettings={() => setShowSettings(true)} />;
      case 'stats':
        return <StatsTab />;
      case 'history':
        return <HistoryTab />;
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
      <div className="wallpaper-overlay" aria-hidden="true" />

      {/* App Shell */}
      <div className="app-shell">
        {/* Top Bar */}
        <header className="topbar">
          <span className="topbar-logo">FLOWSTATE</span>
          <div className="topbar-right" ref={menuRef}>
            {/* Wallpaper change button */}
            <button
              className="topbar-icon-btn"
              onClick={() => setShowPicker(true)}
              aria-label="Change wallpaper"
              id="wallpaper-change-btn"
              title="Change wallpaper"
            >
              🖼
            </button>

            {/* Settings button */}
            <button
              className="topbar-icon-btn"
              onClick={() => setShowSettings(true)}
              aria-label="Open settings"
              id="settings-btn"
              title="Settings"
            >
              ⚙
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
                className="topbar-icon-btn"
                onClick={() => setShowUserMenu((v) => !v)}
                id="user-avatar-fallback"
              >
                👤
              </button>
            )}

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
                  🖼 Change Wallpaper
                </button>
                <button
                  className="user-menu-item danger"
                  onClick={signOut}
                  role="menuitem"
                  id="menu-sign-out"
                >
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

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
      {showPicker && <WallpaperPicker />}
      {showSettings && (
        <SettingsDrawer
          settings={settings}
          onSave={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

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
