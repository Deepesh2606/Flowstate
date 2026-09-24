import React, { useState } from 'react';
import { useAudio } from '../../contexts/AudioContext';
import { useSpotify } from '../../contexts/SpotifyContext';
import { IconSpotify, IconPlay, IconPause } from '../Icons';

const SpotifyPlayer = () => {
  const { selectedSpotifyId, spotifyType = 'playlist' } = useAudio();
  const { token, isReady, playbackState, login, logout, togglePlay, nextTrack, previousTrack, error } = useSpotify();
  
  const [isExpanded, setIsExpanded] = useState(false);

  // If we don't have a token, show login UI
  if (!token) {
    return (
      <div className="spotify-player-container">
        <div className="spotify-player-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconSpotify size={18} color="#1DB954" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Spotify Integration
            </span>
          </div>
        </div>
        <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginTop: '12px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Connect your Spotify Premium account to control playback natively.
          </p>
          <button 
            onClick={login}
            style={{
              background: '#1DB954',
              color: '#000',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '20px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Connect Spotify
          </button>
        </div>
      </div>
    );
  }

  const currentTrack = playbackState?.track_window?.current_track;
  const isPlaying = !playbackState?.paused;

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
            onClick={logout}
            title="Disconnect Spotify"
          >
            Disconnect
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '12px', marginTop: '12px' }}>
          {error}
        </div>
      )}

      {/* Native Custom UI */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '16px', 
        padding: '16px', 
        background: 'rgba(255,255,255,0.05)', 
        borderRadius: '12px',
        marginTop: '12px'
      }}>
        {currentTrack?.album?.images[0]?.url ? (
          <img 
            src={currentTrack.album.images[0].url} 
            alt="Album Art" 
            style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
          />
        ) : (
          <div style={{ width: '64px', height: '64px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconSpotify size={24} color="rgba(255,255,255,0.3)" />
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentTrack ? currentTrack.name : (isReady ? 'Ready to play' : 'Loading SDK...')}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentTrack ? currentTrack.artists.map(a => a.name).join(', ') : (isReady ? 'Select a track in Spotify and pick Fmood Player' : 'Please wait')}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={previousTrack} style={{ color: 'var(--text-secondary)', padding: '4px' }}>
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>
          </button>
          
          <button 
            onClick={togglePlay}
            style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              background: 'var(--text-primary)', 
              color: 'var(--bg-base)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isPlaying ? <IconPause size={20} /> : <IconPlay size={20} />}
          </button>

          <button onClick={nextTrack} style={{ color: 'var(--text-secondary)', padding: '4px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpotifyPlayer;
