import React from 'react';
import { useAudio } from '../../contexts/AudioContext';
import { IconPause, IconPlay, IconVolume, IconVolumeX } from '../Icons';

const FloatingAudioWidget = () => {
  const {
    isAnyPlaying,
    activeAmbientLabels,
    lofiPlaying,
    spotifyActive,
    selectedSpotifyId,
    SPOTIFY_PLAYLISTS,
    ytMusicActive,
    selectedYtMusicId,
    YT_MUSIC_PLAYLISTS,
    appleMusicActive,
    selectedAppleMusicUrl,
    selectedAppleMusicTitle,
    APPLE_MUSIC_PLAYLISTS,
    stopAll,
    setShowAudioDrawer,
    showAudioDrawer,
    isMuted,
    setIsMuted,
    openMusicPlayer,
  } = useAudio();

  if (!isAnyPlaying || showAudioDrawer) {
    return null;
  }

  // Construct label text
  let label = '';
  const currentSpotify = SPOTIFY_PLAYLISTS?.find((p) => p.id === selectedSpotifyId)?.title || 'Spotify Player';
  const currentYtMusic = YT_MUSIC_PLAYLISTS?.find((p) => p.id === selectedYtMusicId)?.title || 'YouTube Music';
  const currentAppleMusic = APPLE_MUSIC_PLAYLISTS?.find((p) => p.embedUrl === selectedAppleMusicUrl)?.title || selectedAppleMusicTitle || 'Apple Music';

  if (ytMusicActive && activeAmbientLabels.length > 0) {
    label = `🔴 ${currentYtMusic} + ${activeAmbientLabels[0]}`;
  } else if (ytMusicActive) {
    label = `🔴 YT Music: ${currentYtMusic}`;
  } else if (appleMusicActive && activeAmbientLabels.length > 0) {
    label = `🍎 ${currentAppleMusic} + ${activeAmbientLabels[0]}`;
  } else if (appleMusicActive) {
    label = `🍎 Apple Music: ${currentAppleMusic}`;
  } else if (spotifyActive && activeAmbientLabels.length > 0) {
    label = `🟢 ${currentSpotify} + ${activeAmbientLabels[0]}`;
  } else if (spotifyActive) {
    label = `🟢 Spotify: ${currentSpotify}`;
  } else if (lofiPlaying && activeAmbientLabels.length > 0) {
    label = `Lofi Radio + ${activeAmbientLabels[0]}${
      activeAmbientLabels.length > 1 ? ` (+${activeAmbientLabels.length - 1})` : ''
    }`;
  } else if (lofiPlaying) {
    label = '📻 Lofi Hip Hop Radio';
  } else if (activeAmbientLabels.length > 0) {
    label = activeAmbientLabels.join(' • ');
  }

  return (
    <div
      className="audio-mini-pill"
      onClick={() => setShowAudioDrawer(true)}
      title="Click to open Ambience Studio"
      id="floating-audio-mini-pill"
    >
      <div className="soundwave-bars">
        <span className="wave-bar" />
        <span className="wave-bar" />
        <span className="wave-bar" />
        <span className="wave-bar" />
      </div>

      <span className="mini-pill-text">{label}</span>

      {/* Quick Service Switchers */}
      <div className="mini-pill-services" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={`mini-pill-srv-btn ${spotifyActive ? 'active' : ''}`}
          onClick={() => openMusicPlayer('spotify')}
          title="Switch to Spotify"
          aria-label="Switch to Spotify"
        >
          <span style={{ fontSize: '11px' }}>🟢</span>
        </button>
        <button
          type="button"
          className={`mini-pill-srv-btn ${appleMusicActive ? 'active' : ''}`}
          onClick={() => openMusicPlayer('applemusic')}
          title="Switch to Apple Music"
          aria-label="Switch to Apple Music"
        >
          <span style={{ fontSize: '11px' }}>🍎</span>
        </button>
        <button
          type="button"
          className={`mini-pill-srv-btn ${ytMusicActive ? 'active' : ''}`}
          onClick={() => openMusicPlayer('ytmusic')}
          title="Switch to YouTube Music"
          aria-label="Switch to YouTube Music"
        >
          <span style={{ fontSize: '11px' }}>🔴</span>
        </button>
      </div>

      <button
        className="mini-pill-btn"
        onClick={(e) => {
          e.stopPropagation();
          setIsMuted(!isMuted);
        }}
        title={isMuted ? 'Unmute' : 'Mute'}
        id="mini-pill-mute-btn"
      >
        {isMuted ? <IconVolumeX size={13} /> : <IconVolume size={13} />}
      </button>

      <button
        className="mini-pill-btn"
        onClick={(e) => {
          e.stopPropagation();
          stopAll();
        }}
        title="Stop All"
        id="mini-pill-stop-btn"
      >
        <IconPause size={12} />
      </button>
    </div>
  );
};

export default FloatingAudioWidget;
