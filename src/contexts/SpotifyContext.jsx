import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const SpotifyContext = createContext(null);

export const useSpotify = () => {
  const ctx = useContext(SpotifyContext);
  if (!ctx) throw new Error('useSpotify must be used within a SpotifyProvider');
  return ctx;
};

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = window.location.origin + '/'; // Return to root
const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-modify-playback-state',
  'user-read-playback-state',
  'user-read-currently-playing',
].join(' ');

// PKCE Helpers
const generateRandomString = (length) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
};

const sha256 = async (plain) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
};

const base64encode = (input) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

export const SpotifyProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('spotify_access_token'));
  const [isReady, setIsReady] = useState(false);
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [playbackState, setPlaybackState] = useState(null);
  const [error, setError] = useState(null);

  // Check for auth code in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (code) {
      // Exchange code for token
      const codeVerifier = localStorage.getItem('spotify_code_verifier');
      const expectedState = localStorage.getItem('spotify_auth_state');

      if (state !== expectedState) {
        console.error('State mismatch during Spotify auth');
        return;
      }

      const payload = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: REDIRECT_URI,
          code_verifier: codeVerifier,
        }),
      };

      fetch('https://accounts.spotify.com/api/token', payload)
        .then((res) => res.json())
        .then((data) => {
          if (data.access_token) {
            localStorage.setItem('spotify_access_token', data.access_token);
            localStorage.setItem('spotify_refresh_token', data.refresh_token);
            const expiry = new Date().getTime() + data.expires_in * 1000;
            localStorage.setItem('spotify_token_expiry', expiry.toString());
            setToken(data.access_token);
            
            // Clean up URL
            window.history.replaceState({}, document.title, '/');
          }
        })
        .catch((err) => console.error('Spotify token exchange failed', err));
    }
  }, []);

  const login = async () => {
    if (!CLIENT_ID) {
      alert('VITE_SPOTIFY_CLIENT_ID is missing in .env.local');
      return;
    }

    const codeVerifier = generateRandomString(64);
    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64encode(hashed);
    const state = generateRandomString(16);

    localStorage.setItem('spotify_code_verifier', codeVerifier);
    localStorage.setItem('spotify_auth_state', state);

    const authUrl = new URL('https://accounts.spotify.com/authorize');
    const params = {
      response_type: 'code',
      client_id: CLIENT_ID,
      scope: SCOPES,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      redirect_uri: REDIRECT_URI,
      state: state,
    };
    authUrl.search = new URLSearchParams(params).toString();
    window.location.href = authUrl.toString();
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_token_expiry');
    if (player) {
      player.disconnect();
    }
  };

  // Initialize Web Playback SDK
  useEffect(() => {
    if (!token) return;

    window.onSpotifyWebPlaybackSDKReady = () => {
      const spotifyPlayer = new window.Spotify.Player({
        name: 'Fmood Web Player',
        getOAuthToken: (cb) => {
          // Check expiry and refresh if needed here in a robust implementation
          // For now, just pass the current token
          cb(token);
        },
        volume: 0.8,
      });

      spotifyPlayer.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
        setIsReady(true);
      });

      spotifyPlayer.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
        setIsReady(false);
      });

      spotifyPlayer.addListener('player_state_changed', (state) => {
        if (!state) return;
        setPlaybackState(state);
      });

      spotifyPlayer.addListener('initialization_error', ({ message }) => {
        console.error('Spotify Initialization Error:', message);
        setError(message);
      });
      spotifyPlayer.addListener('authentication_error', ({ message }) => {
        console.error('Spotify Authentication Error:', message);
        logout(); // Token likely expired or invalid
      });
      spotifyPlayer.addListener('account_error', ({ message }) => {
        console.error('Spotify Account Error:', message);
        // Usually means user is not premium
        setError('Premium account required for Web Playback SDK.');
      });

      spotifyPlayer.connect();
      setPlayer(spotifyPlayer);
    };

    // Ensure SDK script is loaded
    if (!window.Spotify && !document.getElementById('spotify-sdk')) {
      const script = document.createElement('script');
      script.id = 'spotify-sdk';
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);
    } else if (window.Spotify && !player) {
      window.onSpotifyWebPlaybackSDKReady();
    }

    return () => {
      if (player) player.disconnect();
    };
  }, [token]);

  // Transfer playback to this device if ready and wanted
  const transferPlayback = async () => {
    if (!token || !deviceId) return;
    await fetch('https://api.spotify.com/v1/me/player', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        device_ids: [deviceId],
        play: false,
      }),
    });
  };

  const togglePlay = () => player && player.togglePlay();
  const nextTrack = () => player && player.nextTrack();
  const previousTrack = () => player && player.previousTrack();

  const value = {
    token,
    isReady,
    playbackState,
    login,
    logout,
    togglePlay,
    nextTrack,
    previousTrack,
    transferPlayback,
    error
  };

  return <SpotifyContext.Provider value={value}>{children}</SpotifyContext.Provider>;
};
