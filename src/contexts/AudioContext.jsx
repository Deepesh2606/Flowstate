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
  { id: 'lofi-girl', title: 'Lofi Girl - Relax & Study', subtitle: 'Beats to relax and study to', videoId: 'jfKfPfyJRdk' },
  { id: 'synthwave', title: 'Lofi Girl - Synthwave', subtitle: 'Chill synth & retro beats', videoId: '4xDzrJKXOOY' },
  { id: 'chillhop', title: 'Chillhop Radio', subtitle: 'Jazzy and groovy study beats', videoId: '5yx6BWlEvqA' },
  { id: 'coffee-lofi', title: 'Coffee Shop Lofi', subtitle: 'Warm acoustic & coffee beats', videoId: '-5KAN9_CzSA' },
  { id: 'custom', title: 'Custom Stream / Video', subtitle: 'Enter YouTube video link or ID', videoId: '' }
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
  const [showAudioDrawer, setShowAudioDrawer] = useState(false);

  // Lofi Radio state
  const [lofiPlaying, setLofiPlaying] = useState(false);
  const [selectedStreamId, setSelectedStreamId] = useState('lofi-girl');
  const [customVideoId, setCustomVideoId] = useState('');

  // Audio HTML elements map: { [id]: HTMLAudioElement }
  const audioRefs = useRef({});

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

      if (trackState.playing && !isMuted) {
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
  }, [tracks, masterVolume, isMuted]);

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
      return {
        ...prev,
        [id]: {
          ...current,
          playing: !current.playing,
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

  const stopAll = useCallback(() => {
    stopAllAmbient();
    setLofiPlaying(false);
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
  const isAnyPlaying = activeAmbientCount > 0 || lofiPlaying;

  const activeAmbientLabels = AMBIENT_SOUNDS.filter((s) => tracks[s.id]?.playing).map(
    (s) => s.label
  );

  return (
    <AudioContext.Provider
      value={{
        AMBIENT_SOUNDS,
        LOFI_STREAMS,
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
        // Drawer toggle
        showAudioDrawer,
        setShowAudioDrawer,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};
