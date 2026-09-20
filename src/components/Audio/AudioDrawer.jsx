import React, { useState } from 'react';
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
} from '../Icons';
import LofiPlayer from './LofiPlayer';
import SpotifyPlayer from './SpotifyPlayer';
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

const AudioDrawer = ({ onClose }) => {
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
    spotifyType,
    setSpotifyType,
    customSpotifyInput,
    setCustomSpotifyInput,
    extractSpotifyDetails,
  } = useAudio();

  const [activeSubTab, setActiveSubTab] = useState('ambient'); // 'ambient' | 'lofi' | 'spotify'
  const [customInput, setCustomInput] = useState(customVideoId);
  const [spotifyUrlInput, setSpotifyUrlInput] = useState('');
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
    if (activeAmbientCount > 0) {
      playingLabel += ` + ${activeAmbientLabels[0]}`;
    }
  } else if (spotifyActive) {
    const sp = SPOTIFY_PLAYLISTS.find(p => p.id === selectedSpotifyId);
    playingLabel = sp ? `Spotify: ${sp.title}` : 'Spotify';
    if (activeAmbientCount > 0) {
      playingLabel += ` + ${activeAmbientLabels[0]}`;
    }
  } else if (activeAmbientCount > 0) {
    playingLabel = activeAmbientLabels.join(' + ');
  }

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} aria-hidden="true" />
      <aside className="drawer audio-drawer" role="dialog" aria-label="Audio and Ambience Studio">
        {/* Header */}
        <div className="drawer-header audio-drawer-header">
          <div className="audio-header-left">
            <div className="audio-header-icon-box">
              <IconHeadphones size={20} color="var(--accent)" />
              {isAnyPlaying && <span className="audio-header-live-dot" />}
            </div>
            <div>
              <h2 className="drawer-title" style={{ fontSize: '1.2rem', lineHeight: 1.2 }}>Music & Ambience</h2>
              <span className="audio-header-sub">Soundscapes for deep focus</span>
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
            className={`audio-nav-tab ${activeSubTab === 'ambient' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('ambient')}
            role="tab"
            aria-selected={activeSubTab === 'ambient'}
            id="tab-ambient-mixer"
          >
            <IconVolume size={15} />
            <span>Ambient</span>
            {activeAmbientCount > 0 && <span className="audio-tab-count">{activeAmbientCount}</span>}
          </button>
          <button
            className={`audio-nav-tab ${activeSubTab === 'lofi' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('lofi')}
            role="tab"
            aria-selected={activeSubTab === 'lofi'}
            id="tab-lofi-radio"
          >
            <IconRadio size={15} />
            <span>Lofi Radio</span>
            {lofiPlaying && <span className="audio-tab-live-pulse" />}
          </button>
          <button
            className={`audio-nav-tab ${activeSubTab === 'spotify' ? 'active' : ''}`}
            onClick={() => {
              setActiveSubTab('spotify');
              setSpotifyActive(true);
            }}
            role="tab"
            aria-selected={activeSubTab === 'spotify'}
            id="tab-spotify"
          >
            <IconSpotify size={15} color="#1DB954" />
            <span>Spotify</span>
            {spotifyActive && <span className="audio-tab-spotify-dot" />}
          </button>
        </div>

        {/* ── AMBIENT MIXER TAB ── */}
        {activeSubTab === 'ambient' && (
          <div className="ambient-tab-content">
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
        )}

        {/* ── LOFI RADIO TAB ── */}
        {activeSubTab === 'lofi' && (
          <div className="lofi-section">
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
                    title={filterAvailableOnly ? 'Show all channels' : 'Show live channels only'}
                    id="filter-available-streams-btn"
                  >
                    {filterAvailableOnly ? '● Live Only' : 'All Channels'}
                  </button>
                  <button
                    type="button"
                    className={`stream-refresh-btn ${isRefreshingStreams ? 'refreshing' : ''}`}
                    onClick={handleRefreshStreams}
                    title="Check stream health"
                    disabled={isRefreshingStreams}
                  >
                    ↻
                  </button>
                </div>
              </div>

              <div className="lofi-streams-list">
                {LOFI_STREAMS.filter((s) => {
                  if (!filterAvailableOnly) return true;
                  if (s.id === 'custom') return true;
                  return streamStatus[s.id] !== 'offline';
                }).map((stream) => {
                  const isSelected = selectedStreamId === stream.id;
                  const isCurrentlyLive = lofiPlaying && isSelected;
                  const status = streamStatus[stream.id]; // 'available' | 'offline' | 'checking'

                  return (
                    <div
                      key={stream.id}
                      className={`stream-card ${isSelected ? 'selected' : ''} ${isCurrentlyLive ? 'currently-live' : ''}`}
                      onClick={() => {
                        setSelectedStreamId(stream.id);
                        if (!lofiPlaying && stream.id !== 'custom') {
                          setLofiPlaying(true);
                        }
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
                            {stream.id !== 'custom' && (
                              <span
                                className={`stream-badge ${
                                  status === 'available'
                                    ? 'badge-available'
                                    : status === 'offline'
                                    ? 'badge-offline'
                                    : 'badge-checking'
                                }`}
                              >
                                {status === 'available' ? 'Live' : status === 'offline' ? 'Offline' : 'Checking'}
                              </span>
                            )}
                          </div>
                          <div className="stream-subtitle">{stream.subtitle}</div>
                        </div>
                      </div>

                      <div className="stream-card-right">
                        {isCurrentlyLive && (
                          <div className="stream-active-waves">
                            <span />
                            <span />
                            <span />
                          </div>
                        )}
                        {isSelected && !isCurrentlyLive && (
                          <span className="stream-selected-dot" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom YouTube Stream URL Input */}
            {selectedStreamId === 'custom' && (
              <form className="custom-stream-box" onSubmit={handleCustomSubmit}>
                <span className="section-label-small">Custom YouTube Link or ID</span>
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
            )}
          </div>
        )}

        {/* ── SPOTIFY TAB ── */}
        {activeSubTab === 'spotify' && (
          <div className="spotify-section">
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
        )}
      </aside>
    </>
  );
};

export default AudioDrawer;
