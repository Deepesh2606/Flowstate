import React, { useState, useEffect, useRef } from 'react';
import FlipCard from './FlipCard';
import { IconMaximize, IconMinimize, IconPip, IconSettings } from '../Icons';

const ClockTab = ({ settings, onUpdateSettings, hasWallpaper, onTabChange, onOpenSettings }) => {
  const [time, setTime] = useState(() => new Date());
  const [is12Hour, setIs12Hour] = useState(() => {
    return (settings?.clockFormat || '12h') === '12h';
  });
  const [showSeconds, setShowSeconds] = useState(() => {
    return settings?.showSeconds ?? true;
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);
  const [showEditColor, setShowEditColor] = useState(false);
  const pipVideoRef = useRef(null);
  const pipCanvasRef = useRef(null);
  const hoverTimerRef = useRef(null);

  const handleMouseEnter = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setShowEditColor(true);
    }, 4000);
  };

  const handleMouseLeave = () => {
    setShowEditColor(false);
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
  };

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  // Sync with settings prop changes
  useEffect(() => {
    if (settings?.clockFormat) {
      setIs12Hour(settings.clockFormat === '12h');
    }
  }, [settings?.clockFormat]);

  useEffect(() => {
    if (settings?.showSeconds !== undefined) {
      setShowSeconds(settings.showSeconds);
    }
  }, [settings?.showSeconds]);

  // Keep live real time updated every second
  useEffect(() => {
    const updateTime = () => setTime(new Date());
    updateTime();

    // Calculate delay until next whole second to synchronize perfectly
    const now = new Date();
    const delay = 1000 - now.getMilliseconds();
    let intervalId;

    const timeoutId = setTimeout(() => {
      updateTime();
      intervalId = setInterval(updateTime, 1000);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleToggleFormat = () => {
    const nextFormat = !is12Hour;
    setIs12Hour(nextFormat);
    if (onUpdateSettings) {
      onUpdateSettings({ clockFormat: nextFormat ? '12h' : '24h' });
    }
  };

  const handleToggleSeconds = () => {
    const nextSec = !showSeconds;
    setShowSeconds(nextSec);
    if (onUpdateSettings) {
      onUpdateSettings({ showSeconds: nextSec });
    }
  };

  // Compute hours, minutes, seconds, ampm
  const rawHours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  const ampm = rawHours >= 12 ? 'PM' : 'AM';

  let displayHours = rawHours;
  if (is12Hour) {
    displayHours = rawHours % 12;
    if (displayHours === 0) displayHours = 12;
  }

  // Date formatting
  const dayName = time.toLocaleDateString(undefined, { weekday: 'long' });
  const monthName = time.toLocaleDateString(undefined, { month: 'long' });
  const dayOfMonth = time.getDate();
  const year = time.getFullYear();

  // Timezone representation
  const timeZoneName = (() => {
    try {
      const match = time.toTimeString().match(/\((.+)\)$/);
      if (match && match[1]) return match[1];
      const offset = -time.getTimezoneOffset();
      const sign = offset >= 0 ? '+' : '-';
      const absOffset = Math.abs(offset);
      const h = String(Math.floor(absOffset / 60)).padStart(2, '0');
      const m = String(absOffset % 60).padStart(2, '0');
      return `GMT${sign}${h}:${m}`;
    } catch {
      return '';
    }
  })();

  // Floating PiP support via Canvas & Video element
  const togglePip = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPipActive(false);
        return;
      }

      if (!pipCanvasRef.current || !pipVideoRef.current) return;
      const canvas = pipCanvasRef.current;
      const video = pipVideoRef.current;

      const drawFrame = () => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Header Date
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '600 24px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${dayName.toUpperCase()} · ${dayOfMonth} ${monthName.toUpperCase()} ${year}`, canvas.width / 2, 60);

        // Main Clock
        const hrStr = String(displayHours).padStart(2, '0');
        const minStr = String(minutes).padStart(2, '0');
        const secStr = String(seconds).padStart(2, '0');
        const mainTimeStr = showSeconds ? `${hrStr}:${minStr}:${secStr}` : `${hrStr}:${minStr}`;

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 82px system-ui, -apple-system, sans-serif';
        ctx.fillText(mainTimeStr, canvas.width / 2, 160);

        if (is12Hour) {
          ctx.fillStyle = '#38bdf8';
          ctx.font = '700 24px system-ui, -apple-system, sans-serif';
          ctx.fillText(ampm, canvas.width / 2, 210);
        }
      };

      drawFrame();
      const stream = canvas.captureStream(10);
      video.srcObject = stream;
      await video.play();
      await video.requestPictureInPicture();
      setIsPipActive(true);

      const animInterval = setInterval(drawFrame, 1000);

      video.addEventListener('leavepictureinpicture', () => {
        setIsPipActive(false);
        clearInterval(animInterval);
      }, { once: true });
    } catch (err) {
      console.warn('PiP not available or permission denied:', err);
    }
  };

  return (
    <div className="live-clock-tab-wrapper">
      {!hasWallpaper && <div className="liquid-orb" />}

      {/* Top Header Mode Pills for Live Clock — Timer | Stopwatch | Clock */}
      <div className="liquid-pills-wrapper" role="group" aria-label="Clock mode navigation">
        <div className="liquid-pill-track">
          {onTabChange && (
            <button
              type="button"
              className="liquid-pill-btn"
              onClick={() => onTabChange('timer', 'pomodoro')}
              title="Switch to Timer (T)"
            >
              <span className="liquid-pill-label">TIMER</span>
            </button>
          )}
          {onTabChange && (
            <button
              type="button"
              className="liquid-pill-btn"
              onClick={() => onTabChange('timer', 'stopwatch')}
              title="Switch to Stopwatch"
            >
              <span className="liquid-pill-label">STOPWATCH</span>
            </button>
          )}
          <button
            type="button"
            className="liquid-pill-btn active"
            aria-pressed="true"
          >
            <span className="liquid-pill-glaze" aria-hidden="true" />
            <span className="liquid-pill-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span className="live-pulse-dot" aria-hidden="true" />
              CLOCK
            </span>
          </button>
        </div>
      </div>

      {/* Main 3D Flip Clock Area */}
      <div 
        className="flocus-timer-wrapper" 
        style={{ position: 'relative' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {settings?.clockStyle === 'flip' ? (
          <div
            className="flip-clock-container live-flip-clock-container active"
            aria-live="polite"
            aria-atomic="true"
          >
            {/* Hours Card */}
            <FlipCard value={displayHours} label="HOURS" />

            <div className="flip-clock-colon">:</div>

            {/* Minutes Card */}
            <FlipCard value={minutes} label="MINUTES" />

            {/* Optional Seconds Card */}
            {showSeconds && (
              <>
                <div className="flip-clock-colon">:</div>
                <FlipCard value={seconds} label="SECONDS" />
              </>
            )}

            {/* 12-Hour AM/PM Flip Indicator */}
            {is12Hour && (
              <div className="flip-card-unit flip-card-ampm-unit">
                <FlipCard
                  value={ampm}
                  label="FORMAT"
                  pad={false}
                  wrapperClassName="flip-ampm-wrapper"
                />
              </div>
            )}
          </div>
        ) : (
          <div
            className="digital-clock-container active"
            aria-live="polite"
            aria-atomic="true"
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            <div
              className="flocus-timer-digits"
              style={{
                fontFamily: 'var(--clock-font-family, "Inter", sans-serif)',
                fontWeight: 'var(--clock-font-weight, 800)',
                letterSpacing: 'var(--clock-letter-spacing, -0.04em)',
              }}
            >
              <span>{String(displayHours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}</span>
              {showSeconds && (
                <span style={{ fontSize: '0.45em', opacity: 0.8, marginLeft: '12px', alignSelf: 'center' }}>
                  :{String(seconds).padStart(2, '0')}
                </span>
              )}
              {is12Hour && (
                <span style={{ fontSize: '0.22em', opacity: 0.65, marginLeft: '16px', textTransform: 'uppercase', alignSelf: 'flex-start', paddingTop: '12px' }}>
                  {ampm}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Hover Edit Color Button */}
        <div style={{
          position: 'absolute',
          bottom: '-48px',
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: showEditColor ? 1 : 0,
          pointerEvents: showEditColor ? 'auto' : 'none',
          transition: 'opacity 0.4s ease-in-out',
          zIndex: 10
        }}>
          <button
            type="button"
            className="flocus-ctrl-btn"
            onClick={onOpenSettings}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 16px',
              fontSize: '12px',
              borderRadius: '20px',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}
          >
            <IconSettings size={14} />
            Edit Color
          </button>
        </div>
      </div>

      {/* Minimal Date Strip */}
      <div className="live-date-capsule-container">
        <div className="live-date-capsule live-date-capsule--minimal">
          <span className="live-status-pulse" />
          <span className="live-day-text">{dayName}</span>
          <span className="live-date-sep">·</span>
          <span className="live-full-date-text">
            {time.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Controls Bar: Format, Seconds, Fullscreen & PiP */}
      <div className="flocus-controls live-clock-controls">
        {/* 12h / 24h Toggle */}
        <button
          type="button"
          className={`flocus-ctrl-btn clock-format-toggle-btn ${is12Hour ? 'active-mode' : ''}`}
          onClick={handleToggleFormat}
          aria-label={`Switch to ${is12Hour ? '24-hour' : '12-hour'} format`}
          title={`Currently ${is12Hour ? '12-Hour (AM/PM)' : '24-Hour'} format. Click to toggle.`}
        >
          {is12Hour ? '12H' : '24H'}
        </button>

        {/* Seconds Toggle */}
        <button
          type="button"
          className={`flocus-ctrl-btn clock-seconds-toggle-btn ${showSeconds ? 'active-mode' : ''}`}
          onClick={handleToggleSeconds}
          aria-label={showSeconds ? 'Hide seconds' : 'Show seconds'}
          title={showSeconds ? 'Hide seconds' : 'Show seconds'}
        >
          SEC
        </button>

        {/* Fullscreen desk clock */}
        <button
          type="button"
          className="flocus-ctrl-btn"
          onClick={toggleFullscreen}
          aria-label="Toggle Fullscreen"
          title={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen desk mode (F)"}
          style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {isFullscreen ? <IconMinimize size={20} /> : <IconMaximize size={20} />}
        </button>

        {/* Floating PiP window */}
        <button
          type="button"
          className={`flocus-ctrl-btn ${isPipActive ? 'active' : ''}`}
          onClick={togglePip}
          aria-label="Picture-in-Picture"
          title="Floating mini live clock (PiP)"
          style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <IconPip size={18} />
        </button>
      </div>

      {/* Keyboard shortcut hint */}
      <div className="keyboard-hints" style={{ marginTop: '14px' }}>
        <span>T <span className="keyboard-hint-sep">·</span> timer</span>
        <span>F <span className="keyboard-hint-sep">·</span> fullscreen</span>
      </div>

      {/* Hidden canvas & video elements for Picture-in-Picture fallback */}
      <canvas
        ref={pipCanvasRef}
        width={400}
        height={240}
        style={{ display: 'none' }}
      />
      <video
        ref={pipVideoRef}
        muted
        playsInline
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default ClockTab;
