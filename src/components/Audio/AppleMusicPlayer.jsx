import React, { useState } from 'react';
import { useAudio } from '../../contexts/AudioContext';
import { IconAppleMusic } from '../Icons';

const AppleMusicPlayer = () => {
  const {
    appleMusicActive,
    selectedAppleMusicUrl,
    selectedAppleMusicTitle,
    APPLE_MUSIC_PLAYLISTS,
  } = useAudio();

  const [isExpanded, setIsExpanded] = useState(false);

  if (!selectedAppleMusicUrl) {
    return null;
  }

  // Determine web url (replacing embed.music.apple.com with music.apple.com)
  const webUrl = selectedAppleMusicUrl.replace('embed.music.apple.com', 'music.apple.com');
  const matchedPreset = APPLE_MUSIC_PLAYLISTS?.find((p) => p.embedUrl === selectedAppleMusicUrl);
  const title = matchedPreset?.title || selectedAppleMusicTitle || 'Apple Music Focus';

  return (
    <div className="music-player-container applemusic-player-container">
      {/* Header bar */}
      <div className="music-player-bar applemusic-player-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconAppleMusic size={18} color="#FA2D48" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Apple Music Focus Player
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="music-player-btn applemusic-expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Compact player' : 'Expand tracklist'}
          >
            {isExpanded ? 'Compact' : 'Tracks'}
          </button>
          <a
            href={webUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="music-open-link applemusic-open-link"
            title="Open in Apple Music App or Web"
          >
            Open in App ↗
          </a>
        </div>
      </div>

      {/* Official Apple Music Responsive Embed */}
      <div
        className="music-iframe-wrapper applemusic-iframe-wrapper"
        style={{ height: isExpanded ? '450px' : '175px', transition: 'height 0.3s ease' }}
      >
        <iframe
          key={selectedAppleMusicUrl}
          src={selectedAppleMusicUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write *"
          sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
          loading="lazy"
          title="Apple Music Player"
          style={{ borderRadius: '12px', border: 'none', background: 'transparent' }}
        />
      </div>

      <div className="music-hint-text applemusic-hint-text">
        <span>💡 Playing: <strong>{title}</strong>. Sign in inside player to stream full tracks with your Apple ID!</span>
      </div>
    </div>
  );
};

export default AppleMusicPlayer;
