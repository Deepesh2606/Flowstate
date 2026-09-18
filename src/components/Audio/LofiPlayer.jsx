import React, { useEffect } from 'react';
import { useAudio } from '../../contexts/AudioContext';

/**
 * Persistent YouTube iframe container.
 * When in visual mode (inside the drawer), it renders the interactive video frame.
 * When the drawer is closed, it stays alive in a hidden/minimized container so playback continues.
 */
const LofiPlayer = ({ inDrawer = false }) => {
  const { lofiPlaying, currentVideoId, showAudioDrawer, handleStreamError } = useAudio();

  // Listen for YouTube iframe errors
  useEffect(() => {
    const onMessage = (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        // YouTube API error event codes: 100, 101, 150
        if (data?.event === 'onError' || data?.info === 100 || data?.info === 101 || data?.info === 150) {
          handleStreamError(currentVideoId);
        }
      } catch {
        // Not a JSON message
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [currentVideoId, handleStreamError]);

  // If this is the background instance but the drawer is open, don't render to prevent double playback!
  if (!inDrawer && showAudioDrawer) {
    return null;
  }

  if (!lofiPlaying || !currentVideoId) {
    return null;
  }

  const embedUrl = `https://www.youtube-nocookie.com/embed/${currentVideoId}?autoplay=1&enablejsapi=1&rel=0`;

  if (inDrawer) {
    return (
      <div className="lofi-embed-wrapper">
        <iframe
          key={currentVideoId}
          src={embedUrl}
          title="Lofi Radio Stream"
          className="lofi-iframe"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // Background playback container when drawer is closed
  return (
    <div
      style={{
        position: 'fixed',
        width: '1px',
        height: '1px',
        top: '-100px',
        left: '-100px',
        opacity: 0.01,
        pointerEvents: 'none',
        zIndex: -999,
      }}
      aria-hidden="true"
    >
      <iframe
        key={currentVideoId}
        src={embedUrl}
        title="Lofi Radio Background Stream"
        width="1"
        height="1"
        allow="autoplay; encrypted-media"
      />
    </div>
  );
};

export default LofiPlayer;
