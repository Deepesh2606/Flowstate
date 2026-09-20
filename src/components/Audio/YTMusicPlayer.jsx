import React, { useState } from 'react';
import { useAudio } from '../../contexts/AudioContext';
import { IconYTMusic } from '../Icons';

const YTMusicPlayer = ({ inDrawer = true }) => {
  const {
    ytMusicActive,
    selectedYtMusicId,
    ytMusicType = 'playlist',
    ytMusicVideoId,
    YT_MUSIC_PLAYLISTS,
    showAudioDrawer,
  } = useAudio();

  const [isExpanded, setIsExpanded] = useState(false);

  // If this is the background instance but the drawer is open, don't render to prevent double playback!
  if (!inDrawer && showAudioDrawer) {
    return null;
  }

  if (!ytMusicActive || !selectedYtMusicId) {
    return null;
  }

  // Find playlist title if matching curated presets
  const currentPreset = YT_MUSIC_PLAYLISTS?.find((p) => p.id === selectedYtMusicId);
  const title = currentPreset?.title || (ytMusicType === 'playlist' ? 'YouTube Music Playlist' : 'YouTube Music Track');

  // Formulate iframe embed URL
  let embedUrl = '';
  let webUrl = '';

  if (ytMusicType === 'video' || (!selectedYtMusicId.startsWith('PL') && !selectedYtMusicId.startsWith('RD') && !selectedYtMusicId.startsWith('OLAK') && selectedYtMusicId.length === 11)) {
    const vid = ytMusicVideoId || selectedYtMusicId;
    embedUrl = `https://www.youtube-nocookie.com/embed/${vid}?autoplay=1&enablejsapi=1&rel=0`;
    webUrl = `https://music.youtube.com/watch?v=${vid}`;
  } else {
    embedUrl = `https://www.youtube-nocookie.com/embed/videoseries?list=${selectedYtMusicId}&autoplay=1&enablejsapi=1&rel=0`;
    webUrl = `https://music.youtube.com/playlist?list=${selectedYtMusicId}`;
  }

  if (!inDrawer) {
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
          key={`bg-${ytMusicType}-${selectedYtMusicId}-${ytMusicVideoId}`}
          src={embedUrl}
          title="YouTube Music Background Stream"
          width="1"
          height="1"
          allow="autoplay; encrypted-media"
        />
      </div>
    );
  }

  return (
    <div className="music-player-container ytmusic-player-container">
      {/* Header bar */}
      <div className="music-player-bar ytmusic-player-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconYTMusic size={18} color="#FF0000" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            YouTube Music Player
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="music-player-btn ytmusic-expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Compact player' : 'Expand player'}
          >
            {isExpanded ? 'Compact' : 'Expand'}
          </button>
          <a
            href={webUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="music-open-link ytmusic-open-link"
            title="Open in YouTube Music app or website"
          >
            Open in YT Music ↗
          </a>
        </div>
      </div>

      {/* Responsive Iframe */}
      <div
        className="music-iframe-wrapper ytmusic-iframe-wrapper"
        style={{ height: isExpanded ? '280px' : '152px', transition: 'height 0.3s ease' }}
      >
        <iframe
          key={`${ytMusicType}-${selectedYtMusicId}-${ytMusicVideoId}`}
          src={embedUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          title="YouTube Music Player"
          style={{ borderRadius: '12px', border: 'none', background: '#000' }}
        />
      </div>

      <div className="music-hint-text ytmusic-hint-text">
        <span>💡 Playing: <strong>{title}</strong>. Paste any YouTube Music link or playlist below!</span>
      </div>
    </div>
  );
};

export default YTMusicPlayer;
