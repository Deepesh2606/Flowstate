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
    e.preventDefault();
    const id = extractVideoId(customInput);
    if (id) {
      setCustomVideoId(id);
      setSelectedStreamId('custom');
      setLofiPlaying(true);
    }
  };

  const handleSpotifySubmit = (e) => {
    e.preventDefault();
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

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} aria-hidden="true" />
      <aside className="drawer audio-drawer" role="dialog" aria-label="Audio and Ambience Studio">
        {/* Header */}
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconHeadphones size={20} color="var(--accent)" />
            <h2 className="drawer-title" style={{ fontSize: '1.25rem' }}>Ambience</h2>
          </div>
          <div className="audio-header-actions">
            {isAnyPlaying && (
              <button
                className="stop-all-btn"
                onClick={stopAll}
                title="Stop all sounds and music"
                id="stop-all-audio-btn"
              >
                Stop All
              </button>
            )}
            <button className="drawer-close" onClick={onClose} aria-label="Close audio drawer">
              &times;
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="audio-nav-tabs">
          <button
            className={`audio-nav-tab ${activeSubTab === 'ambient' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('ambient')}
            id="tab-ambient-mixer"
          >
            <IconVolume size={15} /> Ambient
          </button>
          <button
            className={`audio-nav-tab ${activeSubTab === 'lofi' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('lofi')}
            id="tab-lofi-radio"
          >
            <IconRadio size={15} /> Lofi Radio
          </button>
          <button
            className={`audio-nav-tab ${activeSubTab === 'spotify' ? 'active' : ''}`}
            onClick={() => {
              setActiveSubTab('spotify');
              setSpotifyActive(true);
            }}
            id="tab-spotify"
          >
            <IconSpotify size={15} color="#1DB954" /> Spotify
          </button>
        </div>

        {/* ── AMBIENT MIXER TAB ── */}
        {activeSubTab === 'ambient' && (
          <>
            {/* Master Volume Section */}
            <div className="master-volume-box">
              <div className="master-volume-header">
                <span>Master Soundscape Volume</span>
                <span>{isMuted ? 'Muted' : `${Math.round(masterVolume * 100)}%`}</span>
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
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : Math.round(masterVolume * 100)}
                  onChange={(e) => {
                    setMasterVolume(parseFloat(e.target.value) / 100);
                    if (isMuted) setIsMuted(false);
                  }}
                  className="audio-slider"
                  id="master-volume-slider"
                  aria-label="Master ambient volume"
                />
              </div>
            </div>

            {/* Soundscape Presets */}
            <div className="audio-presets-section">
              <span className="section-label-small">Instant Soundscapes</span>
              <div className="presets-chips">
                {SOUND_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    className="preset-chip"
                    onClick={() => applyPreset(p)}
                    id={`preset-${p.id}`}
                  >
                    <span>{p.icon}</span> {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Ambient Sound Cards Grid */}
            <div className="ambient-tracks-grid">
              {AMBIENT_SOUNDS.map((sound) => {
                const trackState = tracks[sound.id] || { playing: false, volume: sound.defaultVol };
                const IconComponent = ICON_MAP[sound.icon] || IconVolume;
                const isPlaying = trackState.playing;

                return (
                  <div
                    key={sound.id}
                    className={`ambient-track-card ${isPlaying ? 'active' : ''}`}
                    id={`ambient-card-${sound.id}`}
                  >
                    <div className="track-top-row">
                      <div className="track-info" onClick={() => toggleTrack(sound.id)}>
                        <div className="track-icon-wrapper">
                          <IconComponent size={16} />
                        </div>
                        <span className="track-name">{sound.label}</span>
                      </div>
                      <div className="track-actions">
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
                        className="audio-slider"
                        id={`volume-slider-${sound.id}`}
                        aria-label={`${sound.label} volume`}
                      />
                      <span className="track-volume-pct">
                        {Math.round(trackState.volume * 100)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── LOFI RADIO TAB ── */}
        {activeSubTab === 'lofi' && (
          <div className="lofi-section">
            {/* Live Status & Main Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className={`lofi-status-pill ${lofiPlaying ? 'playing' : ''}`}>
                <span className="live-dot" />
                {lofiPlaying ? 'Playing Stream' : 'Stream Paused'}
              </div>

              <button
                className="custom-stream-btn"
                onClick={() => setLofiPlaying(!lofiPlaying)}
                id="lofi-main-toggle-btn"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {lofiPlaying ? (
                  <>
                    <IconPause size={13} /> Pause Radio
                  </>
                ) : (
                  <>
                    <IconPlay size={13} /> Play Radio
                  </>
                )}
              </button>
            </div>

            {/* Video Player or Placeholder */}
            {lofiPlaying ? (
              <LofiPlayer inDrawer={true} />
            ) : (
              <div
                className="lofi-placeholder"
                onClick={() => setLofiPlaying(true)}
                style={{ cursor: 'pointer' }}
                title="Click to start Lofi stream"
              >
                <div className="lofi-placeholder-icon">📻</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Lofi Hip Hop Radio
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Click Play to start 24/7 background beats
                </div>
              </div>
            )}

            {/* Stream Presets Header with Filter & Refresh */}
            <div className="audio-presets-section">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="section-label-small">Radio Channels</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className={`stream-filter-btn ${filterAvailableOnly ? 'active' : ''}`}
                    onClick={() => setFilterAvailableOnly(!filterAvailableOnly)}
                    title={filterAvailableOnly ? 'Show all streams' : 'Show available streams only'}
                    id="filter-available-streams-btn"
                  >
                    {filterAvailableOnly ? '● Available Only' : 'All Streams'}
                  </button>
                  <button
                    type="button"
                    className="stream-refresh-btn"
                    onClick={handleRefreshStreams}
                    title="Check streams availability"
                    disabled={isRefreshingStreams}
                  >
                    {isRefreshingStreams ? 'Checking…' : '↻'}
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
                  const status = streamStatus[stream.id]; // 'available' | 'offline' | 'checking'
                  return (
                    <div
                      key={stream.id}
                      className={`stream-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedStreamId(stream.id);
                        if (!lofiPlaying && stream.id !== 'custom') {
                          setLofiPlaying(true);
                        }
                      }}
                      id={`stream-card-${stream.id}`}
                    >
                      <div className="stream-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                      {isSelected && (
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: 'var(--accent)',
                            boxShadow: '0 0 8px var(--accent)',
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom YouTube Stream URL Input */}
            {selectedStreamId === 'custom' && (
              <form className="custom-stream-box" onSubmit={handleCustomSubmit}>
                <span className="section-label-small">Custom YouTube Stream / Video</span>
                <div className="custom-stream-input-group">
                  <input
                    type="text"
                    placeholder="Paste YouTube Link or Video ID"
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
                  <span style={{ fontSize: '11px', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                    Active ID: {customVideoId}
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
              <span className="section-label-small">Curated Spotify Playlists</span>
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
                      <div className="stream-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <IconSpotify size={14} color={isSelected ? '#1DB954' : 'var(--text-secondary)'} />
                          <span className="stream-title">{playlist.title}</span>
                        </div>
                        <div className="stream-subtitle">{playlist.subtitle}</div>
                      </div>
                      {isSelected && (
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#1DB954',
                            boxShadow: '0 0 8px #1DB954',
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Spotify URL Input */}
            <form className="custom-stream-box" onSubmit={handleSpotifySubmit}>
              <span className="section-label-small">Connect Custom Spotify Link</span>
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
                  className="custom-stream-btn"
                  style={{ background: '#1DB954', color: '#fff' }}
                  id="load-custom-spotify-btn"
                >
                  Load
                </button>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Supports open.spotify.com/playlist/... or album/track links
              </span>
            </form>
          </div>
        )}
      </aside>
    </>
  );
};

export default AudioDrawer;
