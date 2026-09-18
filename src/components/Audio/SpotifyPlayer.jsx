import React, { useState } from 'react';
import { useAudio } from '../../contexts/AudioContext';
import { IconSpotify, IconPlay, IconPause } from '../Icons';

const SpotifyPlayer = () => {
  const {
    spotifyActive,
    setSpotifyActive,
    selectedSpotifyId,
    spotifyType = 'playlist',
  } = useAudio();

  const [isExpanded, setIsExpanded] = useState(false);

  if (!selectedSpotifyId) {
    return null;
  }

  const embedUrl = `https://open.spotify.com/embed/${spotifyType}/${selectedSpotifyId}?utm_source=generator&theme=0`;
  const webUrl = `https://open.spotify.com/${spotifyType}/${selectedSpotifyId}`;

  return (
    <div className="spotify-player-container">
      {/* Header bar */}
      <div className="spotify-player-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconSpotify size={18} color="#1DB954" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Spotify Focus Player
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="spotify-expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse tracklist' : 'Expand tracklist'}
          >
            {isExpanded ? 'Compact' : 'Tracks'}
          </button>
          <a
            href={webUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="spotify-open-link"
            title="Open in Spotify Web / App"
          >
            Open in App ↗
          </a>
        </div>
      </div>

      {/* Spotify Official Responsive Embed */}
      <div
        className="spotify-iframe-wrapper"
        style={{ height: isExpanded ? '352px' : '152px', transition: 'height 0.3s ease' }}
      >
        <iframe
          key={`${spotifyType}-${selectedSpotifyId}`}
          src={embedUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title="Spotify Music Player"
          style={{ borderRadius: '12px', border: 'none' }}
        />
      </div>

      <div className="spotify-hint-text">
        <span>💡 Tip: Log in inside the player to play full songs with your Spotify account.</span>
      </div>
    </div>
  );
};

export default SpotifyPlayer;
