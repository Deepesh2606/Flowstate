import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * PictureInPicture component for Flowstate timer.
 * Supports:
 * 1. Document Picture-in-Picture API (Chrome/Edge/Arc - rich interactive DOM window)
 * 2. Canvas-to-Video Stream PiP fallback (Safari on macOS / Firefox / other browsers)
 */
export const usePictureInPicture = ({
  timeLeft,
  stopwatchMs = 0,
  mode,
  isRunning,
  progress = 0,
  subject,
  sessionCount = 0,
  clockStyle = 'digital',
  play,
  pause,
  reset,
  skip,
  toast,
}) => {
  const [isPipActive, setIsPipActive] = useState(false);
  const [pipDoc, setPipDoc] = useState(null);
  const [showPipHelp, setShowPipHelp] = useState(false);
  const pipWindowRef = useRef(null);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);

  // Keep references to current values for callbacks/events
  const stateRef = useRef({
    timeLeft,
    stopwatchMs,
    mode,
    isRunning,
    progress,
    subject,
    sessionCount,
    clockStyle,
  });

  useEffect(() => {
    stateRef.current = {
      timeLeft,
      stopwatchMs,
      mode,
      isRunning,
      progress,
      subject,
      sessionCount,
      clockStyle,
    };
  }, [timeLeft, stopwatchMs, mode, isRunning, progress, subject, sessionCount, clockStyle]);

  // Format time display
  const isOverHour = timeLeft >= 3600;
  const hours = Math.floor(timeLeft / 3600);
  const minutes = isOverHour ? Math.floor((timeLeft % 3600) / 60) : Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeStr = isOverHour
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Draw to canvas for Video PiP fallback
  const renderCanvasFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    const { timeLeft: tLeft, mode: curMode, isRunning: curRunning, progress: curProg, subject: curSub } = stateRef.current;

    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#090e1a');
    bgGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Liquid ambient glow in center
    const radial = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width / 2);
    radial.addColorStop(0, 'rgba(6, 182, 212, 0.18)');
    radial.addColorStop(1, 'transparent');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);

    // Progress ring
    const centerX = width / 2;
    const centerY = height / 2 - 10;
    const radius = 170;

    ctx.lineWidth = 14;
    ctx.lineCap = 'round';

    // Track
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Progress Arc
    const progAngle = (curProg / 100) * (Math.PI * 2);
    ctx.strokeStyle = '#06b6d4';
    ctx.shadowColor = 'rgba(6, 182, 212, 0.6)';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + progAngle);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Mode Pill Badge
    const modeLabel = curMode === 'pomodoro' ? 'FOCUS' : curMode === 'shortBreak' ? 'SHORT BREAK' : curMode === 'longBreak' ? 'LONG BREAK' : 'STOPWATCH';
    ctx.fillStyle = '#06b6d4';
    ctx.font = '700 24px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(modeLabel, centerX, centerY - 65);

    // Timer Digits
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 88px "Space Grotesk", sans-serif';
    const hrs = Math.floor(tLeft / 3600);
    const mins = tLeft >= 3600 ? Math.floor((tLeft % 3600) / 60) : Math.floor(tLeft / 60);
    const secs = tLeft % 60;
    const str = tLeft >= 3600
      ? `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    ctx.fillText(str, centerX, centerY + 20);

    // Subject / Status at bottom
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.font = '600 24px "Inter", sans-serif';
    const subText = curSub ? `Focus: ${curSub}` : (curRunning ? 'In Progress' : 'Paused');
    ctx.fillText(subText, centerX, height - 60);
  };

  // Keep Canvas updated when Video PiP is active
  useEffect(() => {
    if (isPipActive && !pipDoc && canvasRef.current) {
      renderCanvasFrame();
    }
  }, [timeLeft, stopwatchMs, mode, isRunning, progress, subject, isPipActive, pipDoc]);

  // Set up native MediaSession handlers for macOS Video PiP controls
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => play());
      navigator.mediaSession.setActionHandler('pause', () => pause());
      navigator.mediaSession.setActionHandler('nexttrack', () => skip());
      navigator.mediaSession.setActionHandler('previoustrack', () => reset());
    }
  }, [play, pause, skip, reset]);

  const togglePip = async () => {
    // 1. If PiP is currently active, close it
    if (isPipActive) {
      if (pipWindowRef.current) {
        pipWindowRef.current.close();
        pipWindowRef.current = null;
      }
      if (document.pictureInPictureElement) {
        try {
          await document.exitPictureInPicture();
        } catch {
          // ignore
        }
      }
      setIsPipActive(false);
      setPipDoc(null);
      return;
    }

    // 2. Try Modern Document Picture-in-Picture API (Chrome, Arc, Edge, Opera)
    if ('documentPictureInPicture' in window) {
      try {
        const pipWindow = await window.documentPictureInPicture.requestWindow({
          width: 320,
          height: 200,
        });
        pipWindowRef.current = pipWindow;

        // Copy styles
        Array.from(document.styleSheets).forEach((styleSheet) => {
          try {
            if (styleSheet.cssRules) {
              const newStyle = pipWindow.document.createElement('style');
              Array.from(styleSheet.cssRules).forEach((rule) => {
                newStyle.appendChild(pipWindow.document.createTextNode(rule.cssText));
              });
              pipWindow.document.head.appendChild(newStyle);
            } else if (styleSheet.href) {
              const newLink = pipWindow.document.createElement('link');
              newLink.rel = 'stylesheet';
              newLink.href = styleSheet.href;
              pipWindow.document.head.appendChild(newLink);
            }
          } catch {
            // cross-origin stylesheets
            if (styleSheet.href) {
              const newLink = pipWindow.document.createElement('link');
              newLink.rel = 'stylesheet';
              newLink.href = styleSheet.href;
              pipWindow.document.head.appendChild(newLink);
            }
          }
        });

        // Set title and body styles
        pipWindow.document.title = 'DEEPLY Timer';
        pipWindow.document.body.style.margin = '0';
        pipWindow.document.body.style.background = '#090e1a';
        pipWindow.document.body.style.overflow = 'hidden';

        pipWindow.addEventListener('pagehide', () => {
          pipWindowRef.current = null;
          setPipDoc(null);
          setIsPipActive(false);
        });

        setPipDoc(pipWindow.document);
        setIsPipActive(true);
        if (toast) toast('Picture-in-Picture window opened', 'success', 2000);
        return;
      } catch (err) {
        console.warn('Document PiP failed or denied, trying Video PiP fallback:', err);
      }
    }

    // 3. Fallback to Canvas Stream Video PiP (Safari on Mac, Firefox, etc.)
    try {
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      if (!('documentPictureInPicture' in window) && isSafari) {
        // Document PiP is not supported in Safari. Show browser help modal
        setShowPipHelp(true);
        return;
      }

      if (!canvasRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        canvasRef.current = canvas;
      }
      renderCanvasFrame();

      let video = videoRef.current;
      if (!video) {
        video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.style.position = 'fixed';
        video.style.pointerEvents = 'none';
        video.style.opacity = '0';
        video.style.top = '-9999px';
        document.body.appendChild(video);
        videoRef.current = video;

        video.addEventListener('leavepictureinpicture', () => {
          setIsPipActive(false);
        });
      }

      const captureMethod = canvasRef.current.captureStream || canvasRef.current.webkitCaptureStream;
      if (!captureMethod) {
        setShowPipHelp(true);
        return;
      }

      const stream = captureMethod.call(canvasRef.current, 30);
      video.srcObject = stream;
      await video.play();

      if (video.requestPictureInPicture) {
        await video.requestPictureInPicture();
      } else if (video.webkitSetPresentationMode) {
        video.webkitSetPresentationMode('picture-in-picture');
      } else {
        setShowPipHelp(true);
        return;
      }

      setIsPipActive(true);
      if (toast) toast('Picture-in-Picture started', 'success', 2000);
    } catch (err) {
      console.warn('PiP could not be opened, displaying browser guidance:', err);
      setShowPipHelp(true);
    }
  };

  return {
    isPipActive,
    togglePip,
    pipDoc,
    timeStr,
    showPipHelp,
    setShowPipHelp,
  };
};

export const PiPWindowPortal = ({
  pipDoc,
  timeLeft,
  mode,
  isRunning,
  subject,
  sessionCount,
  onPlay,
  onPause,
  onReset,
  onSkip,
}) => {
  if (!pipDoc) return null;

  const isOverHour = timeLeft >= 3600;
  const hours = Math.floor(timeLeft / 3600);
  const minutes = isOverHour ? Math.floor((timeLeft % 3600) / 60) : Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = isOverHour
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const modeLabel = mode === 'pomodoro' ? 'Focus' : mode === 'shortBreak' ? 'Short Break' : mode === 'longBreak' ? 'Long Break' : 'Stopwatch';

  return createPortal(
    <div className="pip-window-body">
      {/* Top Bar: Brand & Mode */}
      <div className="pip-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <img src="/favicon.svg" alt="Logo" style={{ width: 15, height: 15, borderRadius: 3 }} />
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)' }}>
            DEEPLY
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="pip-mode-pill">{modeLabel}</span>
          {sessionCount > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 8 }}>
              #{sessionCount}
            </span>
          )}
        </div>
      </div>

      {/* Center: Live Digits */}
      <div className="pip-digits" style={{ textShadow: isRunning ? '0 0 24px rgba(6,182,212,0.5)' : 'none' }}>
        {timeFormatted}
      </div>

      {/* Bottom Bar: Focus Subject & Interactive Controls */}
      <div className="pip-bottom-bar">
        <div className="pip-subject" title={subject || 'No focus subject'}>
          {subject ? `✦ ${subject}` : 'Focus Mode'}
        </div>
        <div className="pip-controls">
          <button
            type="button"
            className="pip-btn"
            onClick={onReset}
            title="Reset"
          >
            ↺
          </button>
          <button
            type="button"
            className="pip-btn primary"
            onClick={isRunning ? onPause : onPlay}
            title={isRunning ? 'Pause' : 'Start'}
          >
            {isRunning ? '⏸' : '▶'}
          </button>
          {mode !== 'stopwatch' && (
            <button
              type="button"
              className="pip-btn"
              onClick={onSkip}
              title="Skip"
            >
              ⏭
            </button>
          )}
        </div>
      </div>
    </div>,
    pipDoc.body
  );
};
