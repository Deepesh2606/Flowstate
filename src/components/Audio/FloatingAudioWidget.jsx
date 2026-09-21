import React from 'react';
import { useAudio } from '../../contexts/AudioContext';
import { IconPause, IconPlay, IconVolume, IconVolumeX, IconSkipBack, IconSkipForward } from '../Icons';

const FloatingAudioWidget = () => {
  const {
    isAnyPlaying,
    isPlaybackPaused,
    togglePlayPause,
    activeAmbientLabels,
    lofiPlaying,
    selectedStreamId,
    setSelectedStreamId,
    setCustomVideoId,
    LOFI_STREAMS,
    spotifyActive,
    selectedSpotifyId,
    setSelectedSpotifyId,
    setSpotifyType,
    SPOTIFY_PLAYLISTS,
    ytMusicActive,
    selectedYtMusicId,
    setSelectedYtMusicId,
    setYtMusicType,
    setYtMusicVideoId,
    YT_MUSIC_PLAYLISTS,
    appleMusicActive,
    selectedAppleMusicUrl,
    setSelectedAppleMusicUrl,
    selectedAppleMusicTitle,
    setSelectedAppleMusicTitle,
    APPLE_MUSIC_PLAYLISTS,
    SOUND_PRESETS,
    applyPreset,
    stopAll,
    setShowAudioDrawer,
    showAudioDrawer,
    isMuted,
    setIsMuted,
  } = useAudio();

  const isMusicPlaying = isAnyPlaying && !isPlaybackPaused;

  if (!isMusicPlaying || showAudioDrawer) {
    return null;
  }

  // Construct minimal, elegant label text
  let label = '';
  const currentSpotify = SPOTIFY_PLAYLISTS?.find((p) => p.id === selectedSpotifyId)?.title || 'Spotify';
  const currentYtMusic = YT_MUSIC_PLAYLISTS?.find((p) => p.id === selectedYtMusicId)?.title || 'YouTube Music';
  const currentAppleMusic = APPLE_MUSIC_PLAYLISTS?.find((p) => p.embedUrl === selectedAppleMusicUrl)?.title || selectedAppleMusicTitle || 'Apple Music';
  const currentLofi = LOFI_STREAMS?.find((s) => s.id === selectedStreamId)?.title || 'Lofi Radio';

  if (ytMusicActive && activeAmbientLabels.length > 0) {
    label = `YT Music: ${currentYtMusic} + ${activeAmbientLabels[0]}`;
  } else if (ytMusicActive) {
    label = `YT Music: ${currentYtMusic}`;
  } else if (appleMusicActive && activeAmbientLabels.length > 0) {
    label = `Apple Music: ${currentAppleMusic} + ${activeAmbientLabels[0]}`;
  } else if (appleMusicActive) {
    label = `Apple Music: ${currentAppleMusic}`;
  } else if (spotifyActive && activeAmbientLabels.length > 0) {
    label = `Spotify: ${currentSpotify} + ${activeAmbientLabels[0]}`;
  } else if (spotifyActive) {
    label = `Spotify: ${currentSpotify}`;
  } else if (lofiPlaying && activeAmbientLabels.length > 0) {
    label = `${currentLofi} + ${activeAmbientLabels[0]}`;
  } else if (lofiPlaying) {
    label = currentLofi;
  } else if (activeAmbientLabels.length > 0) {
    label = activeAmbientLabels.join(' • ');
  }

  const handlePrevious = (e) => {
    e.stopPropagation();
    if (ytMusicActive && YT_MUSIC_PLAYLISTS?.length) {
      const idx = YT_MUSIC_PLAYLISTS.findIndex((p) => p.id === selectedYtMusicId);
      const nextIdx = (idx - 1 + YT_MUSIC_PLAYLISTS.length) % YT_MUSIC_PLAYLISTS.length;
      setSelectedYtMusicId(YT_MUSIC_PLAYLISTS[nextIdx].id);
      setYtMusicType(YT_MUSIC_PLAYLISTS[nextIdx].type || 'playlist');
      setYtMusicVideoId('');
    } else if (spotifyActive && SPOTIFY_PLAYLISTS?.length) {
      const idx = SPOTIFY_PLAYLISTS.findIndex((p) => p.id === selectedSpotifyId);
      const nextIdx = (idx - 1 + SPOTIFY_PLAYLISTS.length) % SPOTIFY_PLAYLISTS.length;
      setSelectedSpotifyId(SPOTIFY_PLAYLISTS[nextIdx].id);
      setSpotifyType(SPOTIFY_PLAYLISTS[nextIdx].type || 'playlist');
    } else if (appleMusicActive && APPLE_MUSIC_PLAYLISTS?.length) {
      const idx = APPLE_MUSIC_PLAYLISTS.findIndex((p) => p.embedUrl === selectedAppleMusicUrl);
      const nextIdx = (idx - 1 + APPLE_MUSIC_PLAYLISTS.length) % APPLE_MUSIC_PLAYLISTS.length;
      setSelectedAppleMusicUrl(APPLE_MUSIC_PLAYLISTS[nextIdx].embedUrl);
      setSelectedAppleMusicTitle(APPLE_MUSIC_PLAYLISTS[nextIdx].title);
    } else if (lofiPlaying && LOFI_STREAMS?.length) {
      const validStreams = LOFI_STREAMS.filter((s) => s.id !== 'custom');
      const idx = validStreams.findIndex((s) => s.id === selectedStreamId);
      const nextIdx = (idx - 1 + validStreams.length) % validStreams.length;
      setSelectedStreamId(validStreams[nextIdx].id);
      setCustomVideoId('');
    } else if (SOUND_PRESETS?.length) {
      const idx = SOUND_PRESETS.findIndex((p) => p.name === activeAmbientLabels[0]);
      const nextIdx = (idx - 1 + SOUND_PRESETS.length) % SOUND_PRESETS.length;
      applyPreset(SOUND_PRESETS[nextIdx]);
    }
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (ytMusicActive && YT_MUSIC_PLAYLISTS?.length) {
      const idx = YT_MUSIC_PLAYLISTS.findIndex((p) => p.id === selectedYtMusicId);
      const nextIdx = (idx + 1) % YT_MUSIC_PLAYLISTS.length;
      setSelectedYtMusicId(YT_MUSIC_PLAYLISTS[nextIdx].id);
      setYtMusicType(YT_MUSIC_PLAYLISTS[nextIdx].type || 'playlist');
      setYtMusicVideoId('');
    } else if (spotifyActive && SPOTIFY_PLAYLISTS?.length) {
      const idx = SPOTIFY_PLAYLISTS.findIndex((p) => p.id === selectedSpotifyId);
      const nextIdx = (idx + 1) % SPOTIFY_PLAYLISTS.length;
      setSelectedSpotifyId(SPOTIFY_PLAYLISTS[nextIdx].id);
      setSpotifyType(SPOTIFY_PLAYLISTS[nextIdx].type || 'playlist');
    } else if (appleMusicActive && APPLE_MUSIC_PLAYLISTS?.length) {
      const idx = APPLE_MUSIC_PLAYLISTS.findIndex((p) => p.embedUrl === selectedAppleMusicUrl);
      const nextIdx = (idx + 1) % APPLE_MUSIC_PLAYLISTS.length;
      setSelectedAppleMusicUrl(APPLE_MUSIC_PLAYLISTS[nextIdx].embedUrl);
      setSelectedAppleMusicTitle(APPLE_MUSIC_PLAYLISTS[nextIdx].title);
    } else if (lofiPlaying && LOFI_STREAMS?.length) {
      const validStreams = LOFI_STREAMS.filter((s) => s.id !== 'custom');
      const idx = validStreams.findIndex((s) => s.id === selectedStreamId);
      const nextIdx = (idx + 1) % validStreams.length;
      setSelectedStreamId(validStreams[nextIdx].id);
      setCustomVideoId('');
    } else if (SOUND_PRESETS?.length) {
      const idx = SOUND_PRESETS.findIndex((p) => p.name === activeAmbientLabels[0]);
      const nextIdx = (idx + 1) % SOUND_PRESETS.length;
      applyPreset(SOUND_PRESETS[nextIdx]);
    }
  };

  return (
    <div
      className={`audio-mini-pill ${isPlaybackPaused ? 'is-paused' : ''}`}
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

      <span className="mini-pill-text">{isPlaybackPaused ? `${label} (Paused)` : label}</span>

      {/* Track Skip Controls (Previous / Next) */}
      <div className="mini-pill-controls" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="mini-pill-btn"
          onClick={handlePrevious}
          title="Previous Track / Playlist"
          aria-label="Previous Track / Playlist"
          id="mini-pill-prev-btn"
        >
          <IconSkipBack size={12} />
        </button>
        <button
          type="button"
          className="mini-pill-btn"
          onClick={handleNext}
          title="Next Track / Playlist"
          aria-label="Next Track / Playlist"
          id="mini-pill-next-btn"
        >
          <IconSkipForward size={12} />
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
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <IconVolumeX size={13} /> : <IconVolume size={13} />}
      </button>

      {/* Play / Pause Toggle Button */}
      <button
        type="button"
        className="mini-pill-btn mini-pill-playpause-btn"
        onClick={(e) => {
          e.stopPropagation();
          togglePlayPause();
        }}
        title={isPlaybackPaused ? 'Resume audio' : 'Pause audio'}
        id="mini-pill-playpause-btn"
        aria-label={isPlaybackPaused ? 'Resume audio' : 'Pause audio'}
      >
        {isPlaybackPaused ? <IconPlay size={12} /> : <IconPause size={12} />}
      </button>

      {/* Dedicated Stop & Close Button */}
      <button
        type="button"
        className="mini-pill-btn mini-pill-close-btn"
        onClick={(e) => {
          e.stopPropagation();
          stopAll();
        }}
        title="Stop & Close Player"
        id="mini-pill-close-btn"
        aria-label="Stop audio and close player"
      >
        ✕
      </button>
    </div>
  );
};

export default FloatingAudioWidget;
