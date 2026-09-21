import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

export const AMBIENT_SOUNDS = [
  { id: 'rain', label: 'Rain', icon: 'IconRain', src: '/audio/rain.mp3', defaultVol: 0.6 },
  { id: 'fire', label: 'Campfire', icon: 'IconFire', src: '/audio/fire.mp3', defaultVol: 0.5 },
  { id: 'cafe', label: 'Coffee Shop', icon: 'IconCoffee', src: '/audio/cafe.mp3', defaultVol: 0.5 },
  { id: 'waves', label: 'Ocean Waves', icon: 'IconWaves', src: '/audio/waves.mp3', defaultVol: 0.6 },
  { id: 'wind', label: 'Breeze', icon: 'IconWind', src: '/audio/wind.mp3', defaultVol: 0.5 },
  { id: 'thunder', label: 'Thunder', icon: 'IconThunder', src: '/audio/thunder.mp3', defaultVol: 0.5 },
];

export const LOFI_STREAMS = [
  {
    id: 'lofi-girl',
    title: 'Lofi Girl - Relax & Study',
    subtitle: 'Classic beats to relax and study to',
    videoId: 'rFZHOHl-L8A',
    fallbacks: ['qGohtGC5Rtk', '0muHFBSiybw'],
  },
  {
    id: 'synthwave',
    title: 'Lofi Girl - Synthwave',
    subtitle: 'Chill retro synth beats for flow',
    videoId: '4xDzrJKXOOY',
    fallbacks: ['GSfT7H87zq4'],
  },
  {
    id: 'chillhop',
    title: 'Chillhop Radio - Study & Relax',
    subtitle: 'Jazzy & chilled hip hop beats',
    videoId: '7NOSDKb0HlU',
    fallbacks: ['5yx6BWlEVcY', 'jiua2V9q9V0'],
  },
  {
    id: 'lofi-house',
    title: 'Lofi Girl - House & Lounge',
    subtitle: 'Upbeat chill lounge vibes',
    videoId: '3PFJ9SETS4M',
    fallbacks: ['0muHFBSiybw'],
  },
  {
    id: 'sleep-ambient',
    title: 'Sleep & Space Ambient',
    subtitle: 'Deep focus & calming soundscapes',
    videoId: 'VAlMDl00mYY',
    fallbacks: ['GSfT7H87zq4'],
  },
  {
    id: 'custom',
    title: 'Custom Stream / Video',
    subtitle: 'Enter YouTube video link or ID',
    videoId: '',
    fallbacks: [],
  },
];

export const SPOTIFY_PLAYLISTS = [
  {
    id: '37i9dQZF1DXdLEN7aqioXM',
    title: 'Lofi Beats',
    subtitle: 'The quintessential chill beats playlist',
    type: 'playlist',
  },
  {
    id: '37i9dQZF1DWZeKCadgRdKQ',
    title: 'Deep Focus',
    subtitle: 'Ambient & atmospheric post-rock',
    type: 'playlist',
  },
  {
    id: '37i9dQZF1DX4sWSpwq3LiO',
    title: 'Peaceful Piano',
    subtitle: 'Calm classical piano for focus',
    type: 'playlist',
  },
  {
    id: '37i9dQZF1DX3rxVfibe1L0',
    title: 'Brain Food',
    subtitle: 'Hypnotic electronic study beats',
    type: 'playlist',
  },
  {
    id: '37i9dQZF1DX0SM0LYsmbMT',
    title: 'Jazz Vibes',
    subtitle: 'Smooth instrumental jazz background',
    type: 'playlist',
  },
];

export const YT_MUSIC_PLAYLISTS = [
  {
    id: 'RDCLAK5uy_m_d74y9P42646d5q7c9757',
    title: 'Lofi Chill & Study',
    subtitle: 'Peaceful lofi hip hop beats',
    type: 'playlist',
    listId: 'RDCLAK5uy_m_d74y9P42646d5q7c9757',
  },
  {
    id: 'RDCLAK5uy_n9Fmy5nF4B6wQYmQ8_iR4qV5aX5t0',
    title: 'Deep Focus',
    subtitle: 'Atmospheric post-rock & ambient',
    type: 'playlist',
    listId: 'RDCLAK5uy_n9Fmy5nF4B6wQYmQ8_iR4qV5aX5t0',
  },
  {
    id: 'PLOzDu-MXXLhhpw8IuL9uVbA_n9-V_9w0t',
    title: 'Peaceful Piano',
    subtitle: 'Gentle classical piano for concentration',
    type: 'playlist',
    listId: 'PLOzDu-MXXLhhpw8IuL9uVbA_n9-V_9w0t',
  },
  {
    id: 'PL859EEB4CD1D904E0',
    title: 'Synthwave Study',
    subtitle: 'Retro synthesizer focus beats',
    type: 'playlist',
    listId: 'PL859EEB4CD1D904E0',
  },
  {
    id: 'PLMC9KNkIncKtPzgY-5rmhvj7fax8fdxoj',
    title: 'Acoustic Study',
    subtitle: 'Calm acoustic guitar melodies',
    type: 'playlist',
    listId: 'PLMC9KNkIncKtPzgY-5rmhvj7fax8fdxoj',
  },
];

export const APPLE_MUSIC_PLAYLISTS = [
  {
    id: 'pure-focus',
    title: 'Pure Focus',
    subtitle: 'Ambient & electronic soundscapes',
    embedUrl: 'https://embed.music.apple.com/us/playlist/pure-focus/pl.u-a1699mD31114',
    webUrl: 'https://music.apple.com/us/playlist/pure-focus/pl.u-a1699mD31114',
  },
  {
    id: 'beatstrumentals',
    title: 'BEATstrumentals',
    subtitle: 'Instrumental hip-hop & lofi head-nodders',
    embedUrl: 'https://embed.music.apple.com/us/playlist/beatstrumentals/pl.u-zPyLm49t222',
    webUrl: 'https://music.apple.com/us/playlist/beatstrumentals/pl.u-zPyLm49t222',
  },
  {
    id: 'peaceful-piano',
    title: 'Peaceful Piano',
    subtitle: 'Mellow acoustic piano for deep flow',
    embedUrl: 'https://embed.music.apple.com/us/playlist/peaceful-piano/pl.u-b3b88G5u222',
    webUrl: 'https://music.apple.com/us/playlist/peaceful-piano/pl.u-b3b88G5u222',
  },
  {
    id: 'classical-focus',
    title: 'Classical Focus',
    subtitle: 'Subtle classical gems for studying',
    embedUrl: 'https://embed.music.apple.com/us/playlist/classical-focus/pl.6022e4d0cb5a420ba6f9fe3ab77d4023',
    webUrl: 'https://music.apple.com/us/playlist/classical-focus/pl.6022e4d0cb5a420ba6f9fe3ab77d4023',
  },
  {
    id: 'best-of-lofi',
    title: 'Best of Lofi',
    subtitle: 'Relaxing beats curated by Lofi Girl',
    embedUrl: 'https://embed.music.apple.com/us/playlist/best-of-lofi/pl.u-4Jpea1JIoq4B',
    webUrl: 'https://music.apple.com/us/playlist/best-of-lofi/pl.u-4Jpea1JIoq4B',
  },
];

export const SOUND_PRESETS = [
  {
    id: 'focus-storm',
    name: 'Stormy Focus',
    icon: '🌧️',
    tracks: { rain: 0.7, thunder: 0.6 }
  },
  {
    id: 'cozy-cafe',
    name: 'Cozy Cafe',
    icon: '☕',
    tracks: { cafe: 0.7, rain: 0.4 }
  },
  {
    id: 'cabin-night',
    name: 'Cabin Night',
    icon: '🔥',
    tracks: { fire: 0.7, wind: 0.5, rain: 0.3 }
  },
  {
    id: 'ocean-drift',
    name: 'Ocean Drift',
    icon: '🌊',
    tracks: { waves: 0.7, wind: 0.4 }
  }
];

const STORAGE_KEY = 'flowstate_ambient_audio';

const AudioContext = createContext(null);

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useAudio must be used within AudioProvider');
  return context;
};

export const AudioProvider = ({ children }) => {
  // Load saved state or use defaults
  const [tracks, setTracks] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const initial = {};
        AMBIENT_SOUNDS.forEach((s) => {
          initial[s.id] = {
            playing: false, // Start paused on initial load
            volume: parsed[s.id]?.volume ?? s.defaultVol,
          };
        });
        return initial;
      }
    } catch (e) {
      console.warn('Failed to parse audio storage:', e);
    }
    const initial = {};
    AMBIENT_SOUNDS.forEach((s) => {
      initial[s.id] = { playing: false, volume: s.defaultVol };
    });
    return initial;
  });

  const [masterVolume, setMasterVolume] = useState(() => {
    try {
      const saved = localStorage.getItem('flowstate_master_vol');
      return saved ? parseFloat(saved) : 0.8;
    } catch {
      return 0.8;
    }
  });

  const [isMuted, setIsMuted] = useState(false);
  const [isPlaybackPaused, setIsPlaybackPaused] = useState(false);
  const [showAudioDrawer, setShowAudioDrawer] = useState(false);
  const [activeAudioTab, setActiveAudioTab] = useState('ambient'); // 'ambient' | 'spotify' | 'applemusic' | 'ytmusic' | 'lofi'

  // Lofi Radio state
  const [lofiPlaying, setLofiPlaying] = useState(false);
  const [selectedStreamId, setSelectedStreamId] = useState('lofi-girl');
  const [customVideoId, setCustomVideoId] = useState('');
  const [streamStatus, setStreamStatus] = useState({}); // { [id]: 'available' | 'offline' | 'checking' }
  const [filterAvailableOnly, setFilterAvailableOnly] = useState(false);

  // Spotify state
  const [spotifyActive, setSpotifyActive] = useState(false);
  const [selectedSpotifyId, setSelectedSpotifyId] = useState('37i9dQZF1DXdLEN7aqioXM');
  const [spotifyType, setSpotifyType] = useState('playlist');
  const [customSpotifyInput, setCustomSpotifyInput] = useState('');

  // YouTube Music state
  const [ytMusicActive, setYtMusicActive] = useState(false);
  const [selectedYtMusicId, setSelectedYtMusicId] = useState('RDCLAK5uy_m_d74y9P42646d5q7c9757');
  const [ytMusicType, setYtMusicType] = useState('playlist'); // 'playlist' | 'video'
  const [ytMusicVideoId, setYtMusicVideoId] = useState('');
  const [customYtMusicInput, setCustomYtMusicInput] = useState('');

  // Apple Music state
  const [appleMusicActive, setAppleMusicActive] = useState(false);
  const [selectedAppleMusicUrl, setSelectedAppleMusicUrl] = useState('https://embed.music.apple.com/us/playlist/pure-focus/pl.u-a1699mD31114');
  const [selectedAppleMusicTitle, setSelectedAppleMusicTitle] = useState('Pure Focus');
  const [customAppleMusicInput, setCustomAppleMusicInput] = useState('');

  const openAudioDrawerWithTab = useCallback((tab = 'ambient') => {
    setActiveAudioTab(tab);
    setShowAudioDrawer(true);
  }, []);

  const openMusicPlayer = useCallback((service = 'spotify') => {
    setIsPlaybackPaused(false);
    if (service === 'spotify') {
      setSpotifyActive(true);
      setActiveAudioTab('spotify');
    } else if (service === 'ytmusic') {
      setYtMusicActive(true);
      setActiveAudioTab('ytmusic');
    } else if (service === 'applemusic') {
      setAppleMusicActive(true);
      setActiveAudioTab('applemusic');
    } else if (service === 'lofi') {
      setLofiPlaying(true);
      setActiveAudioTab('lofi');
    } else {
      setActiveAudioTab('ambient');
    }
    setShowAudioDrawer(true);
  }, []);

  // Audio HTML elements map: { [id]: HTMLAudioElement }
  const audioRefs = useRef({});

  // Stream Availability Checker
  const checkVideoAvailability = useCallback((vidId) => {
    return new Promise((resolve) => {
      if (!vidId) return resolve(false);
      const img = new Image();
      img.onload = () => {
        // YouTube returns 120px wide placeholder when video is unavailable
        const isAvail = img.naturalWidth > 120;
        resolve(isAvail);
      };
      img.onerror = () => resolve(false);
      img.src = `https://img.youtube.com/vi/${vidId}/mqdefault.jpg`;
    });
  }, []);

  // Verify all streams periodically
  const refreshStreamStatuses = useCallback(async () => {
    const statusMap = {};
    for (const stream of LOFI_STREAMS) {
      if (stream.id === 'custom') continue;
      statusMap[stream.id] = 'checking';
    }
    setStreamStatus((prev) => ({ ...prev, ...statusMap }));

    const results = {};
    await Promise.all(
      LOFI_STREAMS.filter((s) => s.id !== 'custom').map(async (s) => {
        const isOk = await checkVideoAvailability(s.videoId);
        results[s.id] = isOk ? 'available' : 'offline';
      })
    );
    setStreamStatus(results);
  }, [checkVideoAvailability]);

  // Initial check on mount
  useEffect(() => {
    refreshStreamStatuses();
  }, [refreshStreamStatuses]);

  // Auto fallback if currently playing stream errors
  const handleStreamError = useCallback(
    async (failedVideoId) => {
      console.warn(`Lofi stream ${failedVideoId} reported playback error. Finding available fallback...`);
      setStreamStatus((prev) => ({ ...prev, [selectedStreamId]: 'offline' }));

      // Find first available preset that isn't offline
      const available = LOFI_STREAMS.find(
        (s) => s.id !== 'custom' && s.id !== selectedStreamId && streamStatus[s.id] !== 'offline'
      );

      if (available) {
        setSelectedStreamId(available.id);
      } else {
        // Try any preset
        const other = LOFI_STREAMS.find((s) => s.id !== 'custom' && s.id !== selectedStreamId);
        if (other) setSelectedStreamId(other.id);
      }
    },
    [selectedStreamId, streamStatus]
  );

  // Helper to extract Spotify URI or ID
  const extractSpotifyDetails = useCallback((input) => {
    if (!input) return null;
    const trimmed = input.trim();
    // Match URLs like open.spotify.com/playlist/37i9dQZF1DXdLEN7aqioXM or open.spotify.com/album/...
    const urlMatch = trimmed.match(/open\.spotify\.com\/(playlist|album|track)\/([a-zA-Z0-9]+)/);
    if (urlMatch) {
      return { type: urlMatch[1], id: urlMatch[2] };
    }
    // Match spotify:playlist:37i9dQZF1DXdLEN7aqioXM
    const uriMatch = trimmed.match(/spotify:(playlist|album|track):([a-zA-Z0-9]+)/);
    if (uriMatch) {
      return { type: uriMatch[1], id: uriMatch[2] };
    }
    // Bare ID
    if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) {
      return { type: 'playlist', id: trimmed };
    }
    return null;
  }, []);

  // Helper to extract YouTube Music details
  const extractYtMusicDetails = useCallback((input) => {
    if (!input) return null;
    const trimmed = input.trim();

    // Check for list= query parameter (playlist)
    let listMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    // Check for v= query parameter (video)
    let videoMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    // Short youtu.be link
    if (!videoMatch) {
      videoMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    }

    if (listMatch) {
      return {
        type: 'playlist',
        playlistId: listMatch[1],
        videoId: videoMatch ? videoMatch[1] : '',
      };
    }

    if (videoMatch) {
      return {
        type: 'video',
        videoId: videoMatch[1],
      };
    }

    // Direct playlist id (e.g. starts with PL, RD, OLAK)
    if (/^(PL|RD|OLAK)[a-zA-Z0-9_-]+$/.test(trimmed)) {
      return {
        type: 'playlist',
        playlistId: trimmed,
      };
    }

    // Direct video id (11 chars)
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return {
        type: 'video',
        videoId: trimmed,
      };
    }

    return null;
  }, []);

  // Helper to extract Apple Music embed details
  const extractAppleMusicDetails = useCallback((input) => {
    if (!input) return null;
    let trimmed = input.trim();

    // If iframe tag pasted by user, extract src
    const iframeSrcMatch = trimmed.match(/src=["']([^"']+)["']/);
    if (iframeSrcMatch) {
      trimmed = iframeSrcMatch[1];
    }

    // Already an embed URL
    if (trimmed.includes('embed.music.apple.com')) {
      return {
        embedUrl: trimmed,
        webUrl: trimmed.replace('embed.music.apple.com', 'music.apple.com'),
      };
    }

    // Standard music.apple.com URL
    if (trimmed.includes('music.apple.com')) {
      const embedUrl = trimmed.replace('music.apple.com', 'embed.music.apple.com');
      return {
        embedUrl,
        webUrl: trimmed,
      };
    }

    return null;
  }, []);

  // Persist volumes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tracks));
    } catch (e) {
      console.warn('Could not save ambient settings', e);
    }
  }, [tracks]);

  useEffect(() => {
    try {
      localStorage.setItem('flowstate_master_vol', masterVolume.toString());
    } catch {
      // ignore
    }
  }, [masterVolume]);

  // Sync Audio elements with track state
  useEffect(() => {
    AMBIENT_SOUNDS.forEach((sound) => {
      const trackState = tracks[sound.id];
      if (!trackState) return;

      let el = audioRefs.current[sound.id];
      if (!el) {
        el = new Audio(sound.src);
        el.loop = true;
        el.preload = 'none';
        audioRefs.current[sound.id] = el;
      }

      const effectiveVolume = isMuted ? 0 : trackState.volume * masterVolume;
      el.volume = Math.max(0, Math.min(1, effectiveVolume));

      if (trackState.playing && !isMuted && !isPlaybackPaused) {
        if (el.paused) {
          el.play().catch((err) => {
            console.warn(`Autoplay prevented for ${sound.id}:`, err);
          });
        }
      } else {
        if (!el.paused) {
          el.pause();
        }
      }
    });
  }, [tracks, masterVolume, isMuted, isPlaybackPaused]);

  // Sync YouTube / Lofi / YTMusic iframe playback when isPlaybackPaused toggles
  useEffect(() => {
    const cmd = isPlaybackPaused ? 'pauseVideo' : 'playVideo';
    document.querySelectorAll('iframe').forEach((iframe) => {
      try {
        iframe.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: cmd, args: '' }), '*');
      } catch {
        // ignore cross-origin error
      }
    });
  }, [isPlaybackPaused]);

  // Clean up audio elements on unmount
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach((el) => {
        try {
          el.pause();
          el.src = '';
        } catch {
          // ignore
        }
      });
      audioRefs.current = {};
    };
  }, []);

  const toggleTrack = useCallback((id) => {
    setTracks((prev) => {
      const current = prev[id] || { playing: false, volume: 0.5 };
      const willPlay = !current.playing;
      if (willPlay) {
        setIsPlaybackPaused(false);
      }
      return {
        ...prev,
        [id]: {
          ...current,
          playing: willPlay,
        },
      };
    });
  }, []);

  const setTrackVolume = useCallback((id, volume) => {
    setTracks((prev) => {
      const current = prev[id] || { playing: false, volume: 0.5 };
      return {
        ...prev,
        [id]: {
          ...current,
          volume: Math.max(0, Math.min(1, volume)),
        },
      };
    });
  }, []);

  const applyPreset = useCallback((preset) => {
    setIsPlaybackPaused(false);
    setTracks((prev) => {
      const updated = {};
      AMBIENT_SOUNDS.forEach((s) => {
        if (preset.tracks[s.id] !== undefined) {
          updated[s.id] = {
            playing: true,
            volume: preset.tracks[s.id],
          };
        } else {
          updated[s.id] = {
            ...prev[s.id],
            playing: false,
          };
        }
      });
      return updated;
    });
  }, []);

  const stopAllAmbient = useCallback(() => {
    setTracks((prev) => {
      const updated = {};
      Object.keys(prev).forEach((id) => {
        updated[id] = { ...prev[id], playing: false };
      });
      return updated;
    });
  }, []);

  const togglePlayPause = useCallback(() => {
    setIsPlaybackPaused((prev) => !prev);
  }, []);

  const stopAll = useCallback(() => {
    setIsPlaybackPaused(false);
    stopAllAmbient();
    setLofiPlaying(false);
    setSpotifyActive(false);
    setYtMusicActive(false);
    setAppleMusicActive(false);
  }, [stopAllAmbient]);

  // Parse YouTube video ID from various formats
  const extractVideoId = useCallback((input) => {
    if (!input) return '';
    const trimmed = input.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }
    try {
      const match = trimmed.match(
        /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|live\/|shorts\/))([\w-]{11})/
      );
      return match ? match[1] : '';
    } catch {
      return '';
    }
  }, []);

  const currentVideoId =
    selectedStreamId === 'custom'
      ? extractVideoId(customVideoId)
      : LOFI_STREAMS.find((s) => s.id === selectedStreamId)?.videoId || '';

  const activeAmbientCount = Object.values(tracks).filter((t) => t.playing).length;
  const isAnyPlaying =
    activeAmbientCount > 0 || lofiPlaying || spotifyActive || ytMusicActive || appleMusicActive;

  const activeAmbientLabels = AMBIENT_SOUNDS.filter((s) => tracks[s.id]?.playing).map(
    (s) => s.label
  );

  return (
    <AudioContext.Provider
      value={{
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
        stopAllAmbient,
        stopAll,
        togglePlayPause,
        isPlaybackPaused,
        setIsPlaybackPaused,
        activeAmbientCount,
        activeAmbientLabels,
        isAnyPlaying,
        // Lofi Radio
        lofiPlaying,
        setLofiPlaying,
        selectedStreamId,
        setSelectedStreamId,
        customVideoId,
        setCustomVideoId,
        currentVideoId,
        extractVideoId,
        streamStatus,
        refreshStreamStatuses,
        handleStreamError,
        filterAvailableOnly,
        setFilterAvailableOnly,
        // Spotify
        spotifyActive,
        setSpotifyActive,
        selectedSpotifyId,
        setSelectedSpotifyId,
        spotifyType,
        setSpotifyType,
        customSpotifyInput,
        setCustomSpotifyInput,
        extractSpotifyDetails,
        // YouTube Music
        YT_MUSIC_PLAYLISTS,
        ytMusicActive,
        setYtMusicActive,
        selectedYtMusicId,
        setSelectedYtMusicId,
        ytMusicType,
        setYtMusicType,
        ytMusicVideoId,
        setYtMusicVideoId,
        customYtMusicInput,
        setCustomYtMusicInput,
        extractYtMusicDetails,
        // Apple Music
        APPLE_MUSIC_PLAYLISTS,
        appleMusicActive,
        setAppleMusicActive,
        selectedAppleMusicUrl,
        setSelectedAppleMusicUrl,
        selectedAppleMusicTitle,
        setSelectedAppleMusicTitle,
        customAppleMusicInput,
        setCustomAppleMusicInput,
        extractAppleMusicDetails,
        // Drawer toggle & tab controls
        showAudioDrawer,
        setShowAudioDrawer,
        activeAudioTab,
        setActiveAudioTab,
        openAudioDrawerWithTab,
        openMusicPlayer,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};
