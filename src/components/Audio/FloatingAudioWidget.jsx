import React from 'react';
import { useAudio } from '../../contexts/AudioContext';
import { IconPause, IconPlay, IconVolume, IconVolumeX } from '../Icons';

const FloatingAudioWidget = () => {
  const {
    isAnyPlaying,
    activeAmbientLabels,
    lofiPlaying,
    stopAll,
    setShowAudioDrawer,
    showAudioDrawer,
    isMuted,
    setIsMuted,
  } = useAudio();

  if (!isAnyPlaying || showAudioDrawer) {
    return null;
  }

  // Construct label text
  let label = '';
  if (lofiPlaying && activeAmbientLabels.length > 0) {
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
