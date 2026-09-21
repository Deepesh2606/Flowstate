import React, { useState, useEffect } from 'react';
import { useAudio } from '../../contexts/AudioContext';
import {
  IconHeadphones,
  IconVolume,
  IconVolumeX,
  IconPlay,
  IconPause,
  IconRain,
  IconFire,
  IconCoffee,
  IconWaves,
  IconWind,
  IconThunder,
  IconRadio,
  IconSpotify,
  IconYTMusic,
  IconAppleMusic,
  IconRefreshCw,
} from '../Icons';
import LofiPlayer from './LofiPlayer';
import SpotifyPlayer from './SpotifyPlayer';
import YTMusicPlayer from './YTMusicPlayer';
import AppleMusicPlayer from './AppleMusicPlayer';
import './AudioDrawer.css';

const ICON_MAP = {
  IconRain,
  IconFire,
  IconCoffee,
  IconWaves,
  IconWind,
  IconThunder,
};

const SOUND_THEMES = {
  rain: { accent: '#38bdf8', glow: 'rgba(56, 189, 248, 0.25)', bg: 'rgba(56, 189, 248, 0.12)' },
  fire: { accent: '#f97316', glow: 'rgba(249, 115, 22, 0.25)', bg: 'rgba(249, 115, 22, 0.12)' },
  cafe: { accent: '#eab308', glow: 'rgba(234, 179, 8, 0.25)', bg: 'rgba(234, 179, 8, 0.12)' },
  waves: { accent: '#14b8a6', glow: 'rgba(20, 184, 166, 0.25)', bg: 'rgba(20, 184, 166, 0.12)' },
  wind: { accent: '#818cf8', glow: 'rgba(129, 140, 248, 0.25)', bg: 'rgba(129, 140, 248, 0.12)' },
  thunder: { accent: '#c084fc', glow: 'rgba(192, 132, 252, 0.25)', bg: 'rgba(192, 132, 252, 0.12)' },
};

const MUSIC_SERVICES = [
  {
    id: 'spotify',
    name: 'Spotify',
    tag: 'Web Player',
    description: 'Chill study beats, deep focus & personal playlists',
    icon: IconSpotify,
    color: '#1DB954',
    bg: 'rgba(29, 185, 84, 0.12)',
    border: 'rgba(29, 185, 84, 0.3)',
  },
  {
    id: 'applemusic',
    name: 'Apple Music',
    tag: 'Apple Embed',
    description: 'Pure Focus, BEATstrumentals & Apple study playlists',
    icon: IconAppleMusic,
    color: '#FA2D48',
    bg: 'rgba(250, 45, 72, 0.12)',
    border: 'rgba(250, 45, 72, 0.3)',
  },
  {
    id: 'ytmusic',
    name: 'YouTube Music',
    tag: 'YT Music',
    description: 'Lofi hip-hop, instrumental study playlists & video links',
    icon: IconYTMusic,
    color: '#FF0000',
    bg: 'rgba(255, 0, 0, 0.12)',
    border: 'rgba(255, 0, 0, 0.3)',
  },
  {
    id: 'lofi',
    name: 'Lofi Radio',
    tag: '24/7 Live',
    description: 'Lofi Girl, Synthwave, Chillhop & ambient streams',
    icon: IconRadio,
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(56, 189, 248, 0.3)',
  },
];

const AudioDrawer = ({ onClose, isOpen = true }) => {
  const {
    AMBIENT_SOUNDS,
    LOFI_STREAMS,
    SPOTIFY_PLAYLISTS,
    SOUND_PRESETS,
    tracks,
    toggleTrack,
    setTrackVolume,
    masterVolume,
    setMasterVolume,
    isMuted,
    setIsMuted,
    applyPreset,
    stopAll,
    isAnyPlaying,
    activeAmbientCount,
    activeAmbientLabels,
    activeAudioTab,
    setActiveAudioTab,
    lofiPlaying,
    setLofiPlaying,
    selectedStreamId,
    setSelectedStreamId,
    customVideoId,
    setCustomVideoId,
    extractVideoId,
    streamStatus,
    refreshStreamStatuses,
    filterAvailableOnly,
    setFilterAvailableOnly,
    spotifyActive,
    setSpotifyActive,
    selectedSpotifyId,
    setSelectedSpotifyId,
    setSpotifyType,
    extractSpotifyDetails,
    // YouTube Music
    YT_MUSIC_PLAYLISTS,
    ytMusicActive,
    setYtMusicActive,
    selectedYtMusicId,
    setSelectedYtMusicId,
    setYtMusicType,
    setYtMusicVideoId,
    extractYtMusicDetails,
    // Apple Music
    APPLE_MUSIC_PLAYLISTS,
    appleMusicActive,
    setAppleMusicActive,
    selectedAppleMusicUrl,
    setSelectedAppleMusicUrl,
    selectedAppleMusicTitle,
    setSelectedAppleMusicTitle,
    extractAppleMusicDetails,
  } = useAudio();

  const activeSubTab = activeAudioTab || 'ambient';
  const setActiveSubTab = (tab) => {
    if (setActiveAudioTab) setActiveAudioTab(tab);
  };
  const [customInput, setCustomInput] = useState(customVideoId);
  const [spotifyUrlInput, setSpotifyUrlInput] = useState('');
  const [ytMusicUrlInput, setYtMusicUrlInput] = useState('');
  const [appleMusicUrlInput, setAppleMusicUrlInput] = useState('');
  const [isRefreshingStreams, setIsRefreshingStreams] = useState(false);

  const handleCustomSubmit = (e) => {
    if (e) e.preventDefault();
    const id = extractVideoId(customInput);
    if (id) {
      setCustomVideoId(id);
      setSelectedStreamId('custom');
      setLofiPlaying(true);
    }
  };

  const handleSpotifySubmit = (e) => {
    if (e) e.preventDefault();
    const details = extractSpotifyDetails(spotifyUrlInput);
    if (details) {
      setSelectedSpotifyId(details.id);
      setSpotifyType(details.type);
      setSpotifyActive(true);
    }
  };

  const handleYtMusicSubmit = (e) => {
    if (e) e.preventDefault();
    const details = extractYtMusicDetails(ytMusicUrlInput);
    if (details) {
      if (details.type === 'playlist') {
        setSelectedYtMusicId(details.playlistId);
        setYtMusicType('playlist');
        setYtMusicVideoId(details.videoId || '');
      } else {
        setSelectedYtMusicId(details.videoId);
        setYtMusicType('video');
        setYtMusicVideoId(details.videoId);
      }
      setYtMusicActive(true);
    }
  };

  const handleAppleMusicSubmit = (e) => {
    if (e) e.preventDefault();
    const details = extractAppleMusicDetails(appleMusicUrlInput);
    if (details) {
      setSelectedAppleMusicUrl(details.embedUrl);
      setSelectedAppleMusicTitle('Custom Apple Music');
      setAppleMusicActive(true);
    }
  };

  const handleRefreshStreams = async () => {
    setIsRefreshingStreams(true);
    await refreshStreamStatuses();
    setIsRefreshingStreams(false);
  };

  // Build live playback descriptor
  let playingLabel = '';
  if (lofiPlaying) {
    const stream = LOFI_STREAMS.find(s => s.id === selectedStreamId);
    playingLabel = stream ? `Radio: ${stream.title}` : 'Lofi Radio';
  } else if (ytMusicActive) {
    const ytp = YT_MUSIC_PLAYLISTS.find(p => p.id === selectedYtMusicId);
    playingLabel = ytp ? `YT Music: ${ytp.title}` : 'YouTube Music';
  } else if (appleMusicActive) {
    const amp = APPLE_MUSIC_PLAYLISTS.find(p => p.embedUrl === selectedAppleMusicUrl);
    playingLabel = amp ? `Apple Music: ${amp.title}` : (selectedAppleMusicTitle || 'Apple Music');
  } else if (spotifyActive) {
    const sp = SPOTIFY_PLAYLISTS.find(p => p.id === selectedSpotifyId);
    playingLabel = sp ? `Spotify: ${sp.title}` : 'Spotify';
  }

  if (activeAmbientCount > 0) {
    if (playingLabel) {
      playingLabel += ` + ${activeAmbientLabels[0]}`;
    } else {
      playingLabel = activeAmbientLabels.join(' + ');
    }
  }

  const [selectedMusicService, setSelectedMusicService] = useState(() => {
    if (activeAudioTab && activeAudioTab !== 'ambient') return activeAudioTab;
    return 'spotify';
  });

  useEffect(() => {
    if (activeAudioTab && activeAudioTab !== 'ambient') {
      setSelectedMusicService(activeAudioTab);
    }
  }, [activeAudioTab]);

  const isAmbientTab = activeSubTab === 'ambient';
  const isAnyMusicPlaying = spotifyActive || appleMusicActive || ytMusicActive || lofiPlaying;

  const displayedStreams = (LOFI_STREAMS || []).filter((s) => {
    if (!filterAvailableOnly) return true;
    if (s.id === 'custom') return true;
    return streamStatus[s.id] !== 'offline';
  });

  const renderStatusBadge = (status) => {
    if (status === 'available') {
      return (
        <span className="stream-badge badge-available" style={{ fontSize: '10px', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
          Live
        </span>
      );
    }
    if (status === 'offline') {
      return (
        <span className="stream-badge badge-offline" style={{ fontSize: '10px', color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />
          Offline
        </span>
      );
    }
    return (
      <span className="stream-badge badge-checking" style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.4)' }} />
        Checking
      </span>
    );
  };

  const handleServiceChange = (serviceId) => {
    setSelectedMusicService(serviceId);
    setActiveSubTab(serviceId);
    if (serviceId === 'spotify') setSpotifyActive(true);
    if (serviceId === 'applemusic') setAppleMusicActive(true);
    if (serviceId === 'ytmusic') setYtMusicActive(true);
    if (serviceId === 'lofi' && !lofiPlaying) setLofiPlaying(true);
  };

  const renderMusicServiceSelector = () => (
    <div className="music-service-nav" role="tablist" aria-label="Streaming platform">
      {MUSIC_SERVICES.map((srv) => {
        const isCurrent = selectedMusicService === srv.id;
        const Icon = srv.icon;
        let isPlaying = false;
        if (srv.id === 'spotify') isPlaying = spotifyActive;
        else if (srv.id === 'applemusic') isPlaying = appleMusicActive;
        else if (srv.id === 'ytmusic') isPlaying = ytMusicActive;
        else if (srv.id === 'lofi') isPlaying = lofiPlaying;

        return (
          <button
            key={srv.id}
            type="button"
            className={`music-service-pill ${isCurrent ? 'active' : ''}`}
            onClick={() => handleServiceChange(srv.id)}
            style={{
              '--srv-color': srv.color,
              '--srv-bg': srv.bg,
              '--srv-border': srv.border,
            }}
            id={`select-service-${srv.id}`}
            title={`Switch to ${srv.name}`}
            role="tab"
            aria-selected={isCurrent}
          >
            <Icon size={14} color={isCurrent ? srv.color : 'currentColor'} />
            <span className="music-service-pill-label">{srv.name}</span>
            {isPlaying && <span className="music-service-live-dot" />}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      <div
        className="drawer-overlay"
        onClick={onClose}
        aria-hidden="true"
        style={{
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          visibility: isOpen ? 'visible' : 'hidden',
          transition: 'opacity 0.25s ease, visibility 0.25s ease',
        }}
      />
      <aside
        className={`drawer audio-drawer ${isOpen ? 'open' : 'closed'}`}
        role="dialog"
        aria-label="Audio and Ambience Studio"
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(105%)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          visibility: isOpen ? 'visible' : 'hidden',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease, visibility 0.3s ease',
        }}
      >
        {/* Header */}
        <div className="drawer-header audio-drawer-header">
          <div className="audio-header-left">
            <div className="audio-header-icon-box">
              <IconHeadphones size={20} color="var(--accent)" />
              {isAnyPlaying && <span className="audio-header-live-dot" />}
            </div>
            <div>
              <h2 className="drawer-title" style={{ fontSize: '1.2rem', lineHeight: 1.2 }}>Music & Ambience</h2>
              <span className="audio-header-sub">Soundscapes & focus music</span>
            </div>
          </div>
          <div className="audio-header-actions">
            {isAnyPlaying && (
              <button
                className="stop-all-btn"
                onClick={stopAll}
                title="Stop all sounds and music"
                id="stop-all-audio-btn"
              >
                <IconPause size={12} />
                <span>Stop All</span>
              </button>
            )}
            <button className="drawer-close" onClick={onClose} aria-label="Close audio drawer">
              &times;
            </button>
          </div>
        </div>

        {/* Dynamic Now Playing Banner */}
        {isAnyPlaying && (
          <div className="now-playing-banner">
            <div className="now-playing-left">
              <div className="now-playing-equalizer">
                <span className="eq-bar" />
                <span className="eq-bar" />
                <span className="eq-bar" />
                <span className="eq-bar" />
              </div>
              <div className="now-playing-info">
                <span className="now-playing-tag">NOW PLAYING</span>
                <span className="now-playing-text" title={playingLabel}>{playingLabel}</span>
              </div>
            </div>
            <button
              className="now-playing-mute-btn"
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <IconVolumeX size={14} /> : <IconVolume size={14} />}
            </button>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="audio-nav-tabs" role="tablist">
          <button
            className={`audio-nav-tab ${isAmbientTab ? 'active' : ''}`}
            onClick={() => setActiveSubTab('ambient')}
            role="tab"
            aria-selected={isAmbientTab}
            id="tab-ambient-mixer"
          >
            <IconVolume size={16} />
            <span>Ambient</span>
            {activeAmbientCount > 0 && <span className="audio-tab-count">{activeAmbientCount}</span>}
          </button>
          <button
            className={`audio-nav-tab ${!isAmbientTab ? 'active' : ''}`}
            onClick={() => {
              setActiveSubTab(selectedMusicService || 'spotify');
            }}
            role="tab"
            aria-selected={!isAmbientTab}
            id="tab-music-player"
          >
            <IconHeadphones size={16} />
            <span>Music Player</span>
            {isAnyMusicPlaying && <span className="audio-tab-live-pulse" />}
          </button>
        </div>

        {/* ── AMBIENT MIXER TAB ── */}
        <div className="ambient-tab-content" style={{ display: activeSubTab === 'ambient' ? 'block' : 'none' }}>
            {/* Master Volume Section */}
            <div className="master-volume-box">
              <div className="master-volume-header">
                <div className="master-volume-title-group">
                  <IconVolume size={14} color="var(--accent)" />
                  <span>Master Soundscape Volume</span>
                </div>
                <span className="master-volume-value">{isMuted ? 'Muted' : `${Math.round(masterVolume * 100)}%`}</span>
              </div>
              <div className="master-volume-controls">
                <button
                  className={`mute-btn ${isMuted ? 'muted' : ''}`}
                  onClick={() => setIsMuted(!isMuted)}
                  title={isMuted ? 'Unmute All' : 'Mute All'}
                  id="ambient-mute-btn"
                >
                  {isMuted ? <IconVolumeX size={16} /> : <IconVolume size={16} />}
                </button>
                <div className="slider-track-wrap">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : Math.round(masterVolume * 100)}
                    onChange={(e) => {
                      setMasterVolume(parseFloat(e.target.value) / 100);
                      if (isMuted) setIsMuted(false);
                    }}
                    className="audio-slider master-slider"
                    id="master-volume-slider"
                    aria-label="Master ambient volume"
                    style={{
                      '--slider-progress': `${isMuted ? 0 : Math.round(masterVolume * 100)}%`
                    }}
                  />
                </div>
              </div>
              {/* Quick volume jump presets */}
              <div className="master-volume-quick-steps">
                {[25, 50, 75, 100].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    className={`vol-quick-btn ${Math.round(masterVolume * 100) === pct && !isMuted ? 'active' : ''}`}
                    onClick={() => {
                      setMasterVolume(pct / 100);
                      if (isMuted) setIsMuted(false);
                    }}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Soundscape Presets */}
            <div className="audio-presets-section">
              <div className="section-label-header">
                <span className="section-label-small">Instant Soundscapes</span>
                <span className="section-sub-hint">One-click focus mixes</span>
              </div>
              <div className="presets-chips">
                {SOUND_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    className="preset-chip"
                    onClick={() => applyPreset(p)}
                    id={`preset-${p.id}`}
                  >
                    <span className="preset-chip-icon">{p.icon}</span>
                    <span className="preset-chip-name">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Ambient Sound Cards Grid */}
            <div className="ambient-tracks-section">
              <div className="section-label-header">
                <span className="section-label-small">Natural Elements</span>
                <span className="section-sub-hint">Mix and adjust levels</span>
              </div>
              <div className="ambient-tracks-grid">
                {AMBIENT_SOUNDS.map((sound) => {
                  const trackState = tracks[sound.id] || { playing: false, volume: sound.defaultVol };
                  const IconComponent = ICON_MAP[sound.icon] || IconVolume;
                  const isPlaying = trackState.playing;
                  const theme = SOUND_THEMES[sound.id] || { accent: 'var(--accent)', glow: 'rgba(6,182,212,0.25)', bg: 'rgba(6,182,212,0.12)' };

                  return (
                    <div
                      key={sound.id}
                      className={`ambient-track-card ${isPlaying ? 'active' : ''}`}
                      id={`ambient-card-${sound.id}`}
                      style={{
                        '--card-accent': theme.accent,
                        '--card-glow': theme.glow,
                        '--card-bg-accent': theme.bg,
                      }}
                    >
                      <div className="track-top-row">
                        <div className="track-info" onClick={() => toggleTrack(sound.id)}>
                          <div className="track-icon-wrapper">
                            <IconComponent size={16} />
                          </div>
                          <span className="track-name">{sound.label}</span>
                        </div>
                        <div className="track-actions">
                          {isPlaying && (
                            <div className="track-mini-eq">
                              <span />
                              <span />
                              <span />
                            </div>
                          )}
                          <button
                            className="track-play-btn"
                            onClick={() => toggleTrack(sound.id)}
                            title={isPlaying ? `Pause ${sound.label}` : `Play ${sound.label}`}
                            id={`play-btn-${sound.id}`}
                          >
                            {isPlaying ? <IconPause size={12} /> : <IconPlay size={12} />}
                          </button>
                        </div>
                      </div>

                      <div className="track-slider-row">
                        <div className="slider-track-wrap">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={Math.round(trackState.volume * 100)}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) / 100;
                              setTrackVolume(sound.id, val);
                              if (!isPlaying && val > 0) {
                                toggleTrack(sound.id);
                              }
                            }}
                            className="audio-slider track-slider"
                            id={`volume-slider-${sound.id}`}
                            aria-label={`${sound.label} volume`}
                            style={{
                              '--slider-progress': `${Math.round(trackState.volume * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="track-volume-pct">
                          {Math.round(trackState.volume * 100)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        {/* ── MUSIC PLAYER (STREAMING SERVICE) TAB ── */}
        <div className="music-player-tab-content" style={{ display: !isAmbientTab ? 'block' : 'none' }}>
          {renderMusicServiceSelector()}

          {/* ── SPOTIFY VIEW ── */}
          <div className="spotify-section" style={{ display: selectedMusicService === 'spotify' ? 'block' : 'none' }}>
            {/* Spotify Player Embed */}
            <SpotifyPlayer />

            {/* Curated Spotify Playlists */}
            <div className="audio-presets-section">
              <div className="section-label-header">
                <span className="section-label-small">Curated Focus Playlists</span>
                <span className="section-sub-hint">Verified Spotify playlists</span>
              </div>
              <div className="lofi-streams-list">
                {SPOTIFY_PLAYLISTS.map((playlist) => {
                  const isSelected = selectedSpotifyId === playlist.id;
                  return (
                    <div
                      key={playlist.id}
                      className={`stream-card spotify-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedSpotifyId(playlist.id);
                        setSpotifyType(playlist.type || 'playlist');
                        setSpotifyActive(true);
                      }}
                      id={`spotify-playlist-${playlist.id}`}
                    >
                      <div className="stream-card-left">
                        <div className="stream-icon-badge spotify-icon-badge">
                          <IconSpotify size={16} color="#1DB954" />
                        </div>
                        <div className="stream-info">
                          <div className="stream-title-row">
                            <span className="stream-title">{playlist.title}</span>
                            <span className="spotify-tag-pill">Spotify</span>
                          </div>
                          <div className="stream-subtitle">{playlist.subtitle}</div>
                        </div>
                      </div>

                      <div className="stream-card-right">
                        {isSelected && (
                          <div className="spotify-active-indicator" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Spotify URL Input */}
            <form className="custom-stream-box spotify-custom-box" onSubmit={handleSpotifySubmit}>
              <span className="section-label-small">Connect Any Spotify Link</span>
              <div className="custom-stream-input-group">
                <input
                  type="text"
                  placeholder="Paste Spotify playlist, album, or track URL"
                  value={spotifyUrlInput}
                  onChange={(e) => setSpotifyUrlInput(e.target.value)}
                  className="custom-stream-input"
                  id="custom-spotify-input"
                />
                <button
                  type="submit"
                  className="custom-stream-btn spotify-submit-btn"
                  id="load-custom-spotify-btn"
                >
                  Load
                </button>
              </div>
              <span className="spotify-url-hint">
                Supports <code>open.spotify.com/playlist/...</code>, <code>/album/...</code>, or <code>/track/...</code>
              </span>
            </form>
          </div>

          {/* ── APPLE MUSIC VIEW ── */}
          <div className="applemusic-section" style={{ display: selectedMusicService === 'applemusic' ? 'block' : 'none' }}>
            {/* Apple Music Player Embed */}
            <AppleMusicPlayer />

            {/* Curated Apple Music Focus Playlists */}
            <div className="audio-presets-section">
              <div className="section-label-header">
                <span className="section-label-small">Curated Apple Music Playlists</span>
                <span className="section-sub-hint">Verified Apple Music study playlists</span>
              </div>
              <div className="lofi-streams-list">
                {APPLE_MUSIC_PLAYLISTS.map((playlist) => {
                  const isSelected = selectedAppleMusicUrl === playlist.embedUrl;
                  return (
                    <div
                      key={playlist.id}
                      className={`stream-card applemusic-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedAppleMusicUrl(playlist.embedUrl);
                        setSelectedAppleMusicTitle(playlist.title);
                        setAppleMusicActive(true);
                      }}
                      id={`applemusic-playlist-${playlist.id}`}
                    >
                      <div className="stream-card-left">
                        <div className="stream-icon-badge applemusic-icon-badge">
                          <IconAppleMusic size={16} color="#FA2D48" />
                        </div>
                        <div className="stream-info">
                          <div className="stream-title-row">
                            <span className="stream-title">{playlist.title}</span>
                            <span className="applemusic-tag-pill">Apple Music</span>
                          </div>
                          <div className="stream-subtitle">{playlist.subtitle}</div>
                        </div>
                      </div>

                      <div className="stream-card-right">
                        {isSelected && (
                          <div className="applemusic-active-indicator" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Apple Music URL Input */}
            <form className="custom-stream-box applemusic-custom-box" onSubmit={handleAppleMusicSubmit}>
              <span className="section-label-small">Connect Any Apple Music Link</span>
              <div className="custom-stream-input-group">
                <input
                  type="text"
                  placeholder="Paste music.apple.com playlist, album, or song link"
                  value={appleMusicUrlInput}
                  onChange={(e) => setAppleMusicUrlInput(e.target.value)}
                  className="custom-stream-input"
                  id="custom-applemusic-input"
                />
                <button
                  type="submit"
                  className="custom-stream-btn applemusic-submit-btn"
                  id="load-custom-applemusic-btn"
                >
                  Load
                </button>
              </div>
              <span className="applemusic-url-hint">
                Supports <code>music.apple.com/.../playlist/...</code> or <code>/album/...</code>
              </span>
            </form>
          </div>

          {/* ── YOUTUBE MUSIC VIEW ── */}
          <div className="ytmusic-section" style={{ display: selectedMusicService === 'ytmusic' ? 'block' : 'none' }}>
            {/* YouTube Music Player Embed */}
            <YTMusicPlayer />

            {/* Curated YouTube Music Focus Playlists */}
            <div className="audio-presets-section">
              <div className="section-label-header">
                <span className="section-label-small">Curated Focus Playlists</span>
                <span className="section-sub-hint">Verified YouTube Music playlists</span>
              </div>
              <div className="lofi-streams-list">
                {YT_MUSIC_PLAYLISTS.map((playlist) => {
                  const isSelected = selectedYtMusicId === playlist.id;
                  return (
                    <div
                      key={playlist.id}
                      className={`stream-card ytmusic-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedYtMusicId(playlist.id);
                        setYtMusicType(playlist.type || 'playlist');
                        setYtMusicVideoId('');
                        setYtMusicActive(true);
                      }}
                      id={`ytmusic-playlist-${playlist.id}`}
                    >
                      <div className="stream-card-left">
                        <div className="stream-icon-badge ytmusic-icon-badge">
                          <IconYTMusic size={16} color="#FF0000" />
                        </div>
                        <div className="stream-info">
                          <div className="stream-title-row">
                            <span className="stream-title">{playlist.title}</span>
                            <span className="ytmusic-tag-pill">YT Music</span>
                          </div>
                          <div className="stream-subtitle">{playlist.subtitle}</div>
                        </div>
                      </div>

                      <div className="stream-card-right">
                        {isSelected && (
                          <div className="ytmusic-active-indicator" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom YouTube Music URL Input */}
            <form className="custom-stream-box ytmusic-custom-box" onSubmit={handleYtMusicSubmit}>
              <span className="section-label-small">Connect Any YouTube Music Link</span>
              <div className="custom-stream-input-group">
                <input
                  type="text"
                  placeholder="Paste music.youtube.com playlist or song link"
                  value={ytMusicUrlInput}
                  onChange={(e) => setYtMusicUrlInput(e.target.value)}
                  className="custom-stream-input"
                  id="custom-ytmusic-input"
                />
                <button
                  type="submit"
                  className="custom-stream-btn ytmusic-submit-btn"
                  id="load-custom-ytmusic-btn"
                >
                  Load
                </button>
              </div>
              <span className="ytmusic-url-hint">
                Supports <code>music.youtube.com/playlist?list=...</code>, <code>watch?v=...</code>, or standard YouTube links
              </span>
            </form>
          </div>

          {/* ── LOFI RADIO VIEW ── */}
          <div className="lofi-section" style={{ display: selectedMusicService === 'lofi' ? 'block' : 'none' }}>
            {/* Live Status & Main Toggle */}
            <div className="lofi-hero-bar">
              <div className={`lofi-status-pill ${lofiPlaying ? 'playing' : ''}`}>
                <span className="live-dot" />
                <span>{lofiPlaying ? 'ON AIR' : 'RADIO PAUSED'}</span>
              </div>

              <button
                className={`lofi-main-toggle-btn ${lofiPlaying ? 'playing' : ''}`}
                onClick={() => setLofiPlaying(!lofiPlaying)}
                id="lofi-main-toggle-btn"
              >
                {lofiPlaying ? (
                  <>
                    <IconPause size={14} />
                    <span>Pause Radio</span>
                  </>
                ) : (
                  <>
                    <IconPlay size={14} />
                    <span>Start Radio</span>
                  </>
                )}
              </button>
            </div>

            {/* Video Player or Placeholder */}
            {lofiPlaying ? (
              <div className="lofi-player-box">
                <LofiPlayer inDrawer={true} />
              </div>
            ) : (
              <div
                className="lofi-placeholder"
                onClick={() => setLofiPlaying(true)}
                title="Click to start Lofi stream"
              >
                <div className="lofi-placeholder-icon">📻</div>
                <div className="lofi-placeholder-title">
                  24/7 Lofi Hip Hop Radio
                </div>
                <div className="lofi-placeholder-sub">
                  Tap to tune in to chill beats & background study streams
                </div>
                <button type="button" className="lofi-start-pill">
                  <IconPlay size={12} /> Play Channel
                </button>
              </div>
            )}

            {/* Stream Presets Header with Filter & Refresh */}
            <div className="audio-presets-section">
              <div className="section-label-header">
                <span className="section-label-small">Radio Channels</span>
                <div className="stream-header-actions">
                  <button
                    type="button"
                    className={`stream-filter-btn ${filterAvailableOnly ? 'active' : ''}`}
                    onClick={() => setFilterAvailableOnly(!filterAvailableOnly)}
                    title={filterAvailableOnly ? 'Showing verified live streams' : 'Show all streams'}
                  >
                    {filterAvailableOnly ? '🟢 Verified Live' : 'All Streams'}
                  </button>

                  <button
                    type="button"
                    className={`stream-refresh-btn ${isRefreshingStreams ? 'refreshing' : ''}`}
                    onClick={handleRefreshStreams}
                    disabled={isRefreshingStreams}
                    title="Check stream availability"
                  >
                    <IconRefreshCw size={11} />
                    <span>{isRefreshingStreams ? 'Checking...' : 'Check Status'}</span>
                  </button>
                </div>
              </div>

              {/* Streams Grid */}
              <div className="lofi-streams-list">
                {displayedStreams.map((stream) => {
                  const isSelected = selectedStreamId === stream.id && !customVideoId;
                  const isPlayingThis = isSelected && lofiPlaying;
                  const status = streamStatus[stream.id] || 'checking';

                  return (
                    <div
                      key={stream.id}
                      className={`stream-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedStreamId(stream.id);
                        setCustomVideoId('');
                        if (!lofiPlaying) setLofiPlaying(true);
                      }}
                      id={`stream-card-${stream.id}`}
                    >
                      <div className="stream-card-left">
                        <div className="stream-icon-badge">
                          <IconRadio size={16} />
                        </div>
                        <div className="stream-info">
                          <div className="stream-title-row">
                            <span className="stream-title">{stream.title}</span>
                            {renderStatusBadge(status)}
                          </div>
                          <div className="stream-subtitle">{stream.subtitle}</div>
                        </div>
                      </div>

                      <div className="stream-card-right">
                        {isPlayingThis && (
                          <div className="stream-live-indicator">
                            <span className="live-dot" />
                            <span>LIVE</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Stream Input */}
            <form className="custom-stream-box" onSubmit={handleCustomSubmit}>
              <span className="section-label-small">Custom YouTube Stream</span>
              <div className="custom-stream-input-group">
                <input
                  type="text"
                  placeholder="https://youtube.com/watch?v=..."
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  className="custom-stream-input"
                  id="custom-youtube-input"
                />
                <button type="submit" className="custom-stream-btn" id="load-custom-stream-btn">
                  Load
                </button>
              </div>
              {customVideoId && (
                <span className="custom-stream-active-id">
                  Active Video ID: <code>{customVideoId}</code>
                </span>
              )}
            </form>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AudioDrawer;
