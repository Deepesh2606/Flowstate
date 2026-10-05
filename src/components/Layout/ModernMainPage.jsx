import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWallpaper } from '../../contexts/WallpaperContext';
import { useAudio } from '../../contexts/AudioContext';
import { useSettings } from '../../hooks/useSettings';
import { useTimer } from '../../hooks/useTimer';
import { useToast } from '../Toast/ToastProvider';
import { subscribeLiveRooms } from '../../firebase/firestore';

const WALLPAPER_FALLBACK = '/defaultpreset.png';

const ModernMainPage = () => {
  const { currentUser, openAuthModal } = useAuth();
  const { wallpaper } = useWallpaper();
  const { settings, updateSettings } = useSettings();
  const { showAudioDrawer, setShowAudioDrawer } = useAudio();
  const { toast } = useToast();
  const [realOnlineCount, setRealOnlineCount] = useState(0);

  const {
    mode, timeLeft, isRunning, sessionCount, totalDuration,
    play, pause, reset, skip, switchMode,
  } = useTimer(settings, toast, {});

  useEffect(() => {
    const unsub = subscribeLiveRooms((rooms) => {
      if (!rooms) return;
      const total = rooms.reduce((acc, room) => acc + (room.onlineCount || 0), 0);
      setRealOnlineCount(total);
    });
    return () => unsub();
  }, []);

  const renderedWallpaper = wallpaper || WALLPAPER_FALLBACK;

  const formatTime = (seconds) => {
    const m = Math.floor(Math.abs(seconds) / 60);
    const s = Math.abs(seconds) % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handlePlayPause = () => isRunning ? pause() : play();
  const handleReset = () => reset();
  const handleSkip = () => skip();
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const timerProgress = totalDuration > 0 ? ((totalDuration - timeLeft) / totalDuration) * 100 : 0;
  
  // Set the CSS classes for body and html if needed, but Tailwind is already there.

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased h-screen w-screen overflow-hidden text-white relative">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40 pointer-events-none z-0"
        style={{ backgroundImage: `url('${renderedWallpaper}')` }}
      />
      {/* Top Header */}
      <header className="fixed top-0 w-full z-50 bg-obsidian/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-20 max-w-7xl mx-auto px-gutter flex items-center justify-between">
          <div className="flex items-center space-x-space-lg">
            <span className="font-headline-sm text-primary tracking-wider font-bold text-2xl">FLOWSTATE</span>
            <div className="flex items-center space-x-space-sm bg-surface-container-high px-space-md py-space-xs rounded-full">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
              <span className="text-label-md text-on-surface-variant">{realOnlineCount} active rooms</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center space-x-space-md">
            <a href="#" className="px-space-md py-space-sm transition-colors bg-primary-container text-on-primary-container font-bold rounded-full">Explore</a>
            <a href="#" className="text-label-lg px-space-md py-space-sm text-on-surface-variant hover:text-on-surface transition-colors">Rooms</a>
            <a href="#" className="text-label-lg px-space-md py-space-sm text-on-surface-variant hover:text-on-surface transition-colors">Analytics</a>
          </nav>
          <div className="flex items-center space-x-space-md">
            {!currentUser ? (
              <button onClick={() => openAuthModal()} className="px-space-md py-space-sm bg-surface-container-highest hover:bg-surface-bright text-on-surface text-label-lg rounded-full transition-all">Sign In</button>
            ) : (
              <img alt="Profile" className="w-8 h-8 rounded-full object-cover" src={currentUser.photoURL || 'https://via.placeholder.com/32'} />
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full pt-20 pb-24 h-full relative z-10">
        <div className="flex flex-col w-full items-center justify-center h-full px-gutter relative">
          
          {/* Mode Switcher */}
          <div className="flex items-center space-x-space-sm bg-surface-container-high/80 backdrop-blur-xl p-1.5 rounded-full shadow-lg mb-space-lg">
            <button onClick={() => switchMode('pomodoro')} className={`px-space-lg py-space-xs rounded-full text-label-lg font-bold transition-all ${mode === 'pomodoro' ? 'bg-primary text-on-primary shadow-[0_0_15px_rgba(0,225,255,0.4)]' : 'text-on-surface-variant hover:text-on-surface font-medium'}`}>FOCUS</button>
            <button onClick={() => switchMode('shortBreak')} className={`px-space-lg py-space-xs rounded-full text-label-lg font-bold transition-all ${mode === 'shortBreak' ? 'bg-primary text-on-primary shadow-[0_0_15px_rgba(0,225,255,0.4)]' : 'text-on-surface-variant hover:text-on-surface font-medium'}`}>SHORT BREAK</button>
            <button onClick={() => switchMode('longBreak')} className={`px-space-lg py-space-xs rounded-full text-label-lg font-bold transition-all ${mode === 'longBreak' ? 'bg-primary text-on-primary shadow-[0_0_15px_rgba(0,225,255,0.4)]' : 'text-on-surface-variant hover:text-on-surface font-medium'}`}>LONG BREAK</button>
            <button onClick={() => switchMode('stopwatch')} className={`px-space-lg py-space-xs rounded-full text-label-lg font-bold transition-all ${mode === 'stopwatch' ? 'bg-primary text-on-primary shadow-[0_0_15px_rgba(0,225,255,0.4)]' : 'text-on-surface-variant hover:text-on-surface font-medium'}`}>STOPWATCH</button>
          </div>

          {/* Durations */}
          {mode === 'pomodoro' && (
            <div className="flex items-center space-x-space-sm mb-space-lg">
              {[15, 25, 45, 50, 60].map(mins => {
                const isSelected = settings?.durations?.pomodoro === mins * 60;
                return (
                  <button 
                    key={mins}
                    onClick={() => {
                      if (updateSettings) {
                        updateSettings({ durations: { ...settings?.durations, pomodoro: mins * 60 } });
                        if (settings?.durations?.pomodoro === mins * 60) reset();
                      }
                    }}
                    className={`px-space-md py-1 rounded-full text-label-md transition-all ${isSelected ? 'bg-primary/20 text-primary font-bold border border-primary/40 shadow-[0_0_10px_rgba(0,225,255,0.2)]' : 'bg-surface-container-high/60 text-on-surface-variant hover:text-on-surface'}`}
                  >
                    {mins}m
                  </button>
                )
              })}
            </div>
          )}

          {/* Daily Focus Indicator */}
          <div className="flex items-center space-x-space-md bg-surface-container-high/40 backdrop-blur-md px-space-lg py-2 rounded-full mb-space-xl border border-outline-variant/10">
            <button className="flex items-center space-x-space-sm text-on-surface text-label-lg font-bold hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-primary text-sm">add_circle</span>
              <span>Daily Focus</span>
            </button>
            <div className="w-px h-4 bg-outline-variant/30"></div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(0,225,255,0.6)]"></span>
              <span className="text-label-md text-on-surface font-medium mr-space-sm">Daily Focus</span>
              <div className="flex items-center space-x-1">
                {Array.from({ length: 8 }).map((_, i) => (
                  <span key={i} className={`w-2.5 h-2.5 rounded-full ${i < sessionCount ? 'bg-primary' : 'bg-surface-container-highest'}`}></span>
                ))}
              </div>
              <span className="text-label-sm text-on-surface-variant ml-space-sm">{sessionCount}/8</span>
            </div>
          </div>

          {/* Huge Timer */}
          <div className="relative my-space-md flex flex-col items-center">
            <h1 className="text-[120px] md:text-[180px] font-headline-lg tracking-tight text-white drop-shadow-[0_0_35px_rgba(0,225,255,0.25)] select-none leading-none">
              {formatTime(timeLeft)}
            </h1>
          </div>

          {/* Progress Bar */}
          <div className="w-72 md:w-96 h-1.5 bg-surface-container-highest rounded-full relative mb-space-xl overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-primary-fixed-dim to-primary rounded-full shadow-[0_0_12px_rgba(0,225,255,0.6)]" style={{ width: `${Math.min(100, Math.max(0, timerProgress))}%` }}></div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-space-md bg-surface-card/60 backdrop-blur-2xl p-3 rounded-full border border-outline-variant/20 shadow-2xl">
            <button onClick={handlePlayPause} className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-primary hover:text-on-primary transition-all shadow-md group">
              <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>
                {isRunning ? 'pause' : 'play_arrow'}
              </span>
            </button>
            <button onClick={handleReset} className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-primary hover:text-on-primary transition-all shadow-md group">
              <span className="material-symbols-outlined text-xl group-hover:rotate-180 transition-transform duration-500">restart_alt</span>
            </button>
            <button onClick={handleSkip} className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-primary hover:text-on-primary transition-all shadow-md group">
              <span className="material-symbols-outlined text-xl group-hover:translate-x-0.5 transition-transform">skip_next</span>
            </button>
            <button onClick={toggleFullscreen} className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-primary hover:text-on-primary transition-all shadow-md group">
              <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">fullscreen</span>
            </button>
          </div>

          <div className="flex items-center space-x-space-xl mt-space-lg text-label-sm text-on-surface-variant">
            <span className="flex items-center space-x-1"><span className="font-bold text-on-surface">Space</span><span>· play/pause</span></span>
            <span className="flex items-center space-x-1"><span className="font-bold text-on-surface">R</span><span>· reset</span></span>
            <span className="flex items-center space-x-1"><span className="font-bold text-on-surface">S</span><span>· skip</span></span>
            <span className="flex items-center space-x-1"><span className="font-bold text-on-surface">F</span><span>· fullscreen</span></span>
          </div>

        </div>
      </main>

      {/* Right Side Nav */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 hidden xl:flex flex-col items-center space-y-space-md bg-surface-card/80 backdrop-blur-xl p-2 rounded-full border border-outline-variant/20 shadow-2xl z-20">
        <button onClick={() => switchMode('pomodoro')} className={`w-12 h-12 rounded-full flex flex-col items-center justify-center transition-all ${mode === 'pomodoro' ? 'bg-primary text-on-primary shadow-[0_0_15px_rgba(0,225,255,0.4)]' : 'hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface'}`}>
          <span className="material-symbols-outlined text-lg">timer</span>
          <span className="text-[9px] font-bold tracking-tighter">FOCUS</span>
        </button>
        <button onClick={() => switchMode('shortBreak')} className={`w-10 h-10 rounded-full flex flex-col items-center justify-center transition-all ${mode === 'shortBreak' ? 'bg-primary text-on-primary shadow-[0_0_15px_rgba(0,225,255,0.4)]' : 'hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface'}`}>
          <span className="material-symbols-outlined text-base">hourglass_top</span>
          <span className="text-[8px] tracking-tight">BREAK</span>
        </button>
        <button onClick={() => switchMode('longBreak')} className={`w-10 h-10 rounded-full flex flex-col items-center justify-center transition-all ${mode === 'longBreak' ? 'bg-primary text-on-primary shadow-[0_0_15px_rgba(0,225,255,0.4)]' : 'hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface'}`}>
          <span className="material-symbols-outlined text-base">hourglass_bottom</span>
          <span className="text-[8px] tracking-tight">LONG</span>
        </button>
        <button onClick={() => switchMode('stopwatch')} className={`w-10 h-10 rounded-full flex flex-col items-center justify-center transition-all ${mode === 'stopwatch' ? 'bg-primary text-on-primary shadow-[0_0_15px_rgba(0,225,255,0.4)]' : 'hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface'}`}>
          <span className="material-symbols-outlined text-base">alarm</span>
          <span className="text-[8px] tracking-tight">STOP</span>
        </button>
      </div>

      {/* Bottom Audio Engine */}
      <aside className="fixed bottom-0 left-0 right-0 z-40 bg-obsidian/90 backdrop-blur-xl border-t border-outline-variant/20 px-gutter py-space-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-space-md">
          <div className="flex items-center space-x-space-md">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container cursor-pointer" onClick={() => setShowAudioDrawer(!showAudioDrawer)}>
              <span className="material-symbols-outlined">headphones</span>
            </div>
            <div>
              <p className="text-label-lg text-on-surface font-bold">Ambient Audio Engine</p>
              <p className="text-label-sm text-on-surface-variant">Playing: Focus Flow</p>
            </div>
          </div>
          <div className="flex items-center space-x-space-sm">
            <button className="px-space-md py-space-xs rounded-full bg-surface-container-high text-on-surface text-label-md hover:bg-primary hover:text-on-primary transition-all">Rain</button>
            <button className="px-space-md py-space-xs rounded-full bg-surface-container-high text-on-surface text-label-md hover:bg-primary hover:text-on-primary transition-all">Cafe</button>
            <button className="px-space-md py-space-xs rounded-full bg-surface-container-high text-on-surface text-label-md hover:bg-primary hover:text-on-primary transition-all">White Noise</button>
          </div>
          <div className="flex items-center space-x-space-md w-full md:w-48">
            <span className="material-symbols-outlined text-on-surface-variant text-sm">volume_down</span>
            <div className="flex-1 h-1 bg-surface-container-highest rounded-full relative">
              <div className="absolute left-0 top-0 bottom-0 w-2/3 bg-primary rounded-full"></div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-sm">volume_up</span>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default ModernMainPage;
