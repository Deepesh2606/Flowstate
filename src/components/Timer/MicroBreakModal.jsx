import React, { useState, useEffect, useRef } from 'react';
import { IconX } from '../Icons';

const BREATH_MODES = {
  box: {
    name: 'Box Breathing (4-4-4-4)',
    desc: 'Navy SEAL technique for deep stress relief & mental clarity',
    phases: [
      { name: 'Inhale', duration: 4, tip: 'Breathe in slowly through your nose' },
      { name: 'Hold', duration: 4, tip: 'Keep air gently held in your chest' },
      { name: 'Exhale', duration: 4, tip: 'Release smoothly through your mouth' },
      { name: 'Hold', duration: 4, tip: 'Rest empty before the next breath' },
    ],
  },
  relax: {
    name: 'Deep Relax (4-7-8)',
    desc: 'Dr. Weil relaxation method to calm the nervous system',
    phases: [
      { name: 'Inhale', duration: 4, tip: 'Inhale quietly through the nose' },
      { name: 'Hold', duration: 7, tip: 'Hold your breath comfortably' },
      { name: 'Exhale', duration: 8, tip: 'Whoosh exhale completely' },
    ],
  },
};

const STRETCHES = [
  {
    id: 'neck',
    icon: '🧘',
    title: 'Neck & Upper Trap Release',
    duration: 30,
    steps: 'Drop right ear toward right shoulder. Hold for 15s. Repeat on left side. Release tension in the neck.',
  },
  {
    id: 'chest',
    icon: '👐',
    title: 'Chest Opener & Shoulder Pinch',
    duration: 30,
    steps: 'Interlace fingers behind your back. Gently pull shoulders down and back, opening your collarbone.',
  },
  {
    id: 'wrists',
    icon: '✋',
    title: 'Keyboard Wrist & Forearm Flex',
    duration: 25,
    steps: 'Extend right arm out, palm forward. Gently pull fingers back toward your body. Switch hands.',
  },
];

const MicroBreakModal = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('breathing'); // 'breathing' | 'eye' | 'stretch'

  // Breathing state
  const [breathMethod, setBreathMethod] = useState('box');
  const [isBreathingRunning, setIsBreathingRunning] = useState(true);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(BREATH_MODES[breathMethod].phases[0].duration);
  const [cycleCount, setCycleCount] = useState(0);

  // Eye rest state
  const [eyeSeconds, setEyeSeconds] = useState(20);
  const [isEyeRunning, setIsEyeRunning] = useState(false);

  // Stretch state
  const [activeStretchIdx, setActiveStretchIdx] = useState(0);
  const [stretchSeconds, setStretchSeconds] = useState(STRETCHES[0].duration);
  const [isStretchRunning, setIsStretchRunning] = useState(false);

  // Handle Breathing Timer
  useEffect(() => {
    if (!isBreathingRunning || activeTab !== 'breathing') return;

    const interval = setInterval(() => {
      setPhaseSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;

        // Move to next phase
        const currentPhases = BREATH_MODES[breathMethod].phases;
        setPhaseIndex((curIdx) => {
          const nextIdx = (curIdx + 1) % currentPhases.length;
          if (nextIdx === 0) {
            setCycleCount((c) => c + 1);
          }
          return nextIdx;
        });
        return 1; // temporary, updated in next effect
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isBreathingRunning, breathMethod, activeTab]);

  // Sync phase seconds when phaseIndex changes
  useEffect(() => {
    const currentPhases = BREATH_MODES[breathMethod].phases;
    setPhaseSecondsLeft(currentPhases[phaseIndex].duration);
  }, [phaseIndex, breathMethod]);

  // Handle Eye Relief Timer
  useEffect(() => {
    if (!isEyeRunning || activeTab !== 'eye') return;

    const interval = setInterval(() => {
      setEyeSeconds((prev) => {
        if (prev <= 1) {
          setIsEyeRunning(false);
          return 20;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isEyeRunning, activeTab]);

  // Handle Stretch Timer
  useEffect(() => {
    if (!isStretchRunning || activeTab !== 'stretch') return;

    const interval = setInterval(() => {
      setStretchSeconds((prev) => {
        if (prev <= 1) {
          setIsStretchRunning(false);
          return STRETCHES[activeStretchIdx].duration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isStretchRunning, activeStretchIdx, activeTab]);

  // Keyboard escape listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const currentPhases = BREATH_MODES[breathMethod].phases;
  const currentPhase = currentPhases[phaseIndex];
  const isExpand = currentPhase.name === 'Inhale';
  const isHold = currentPhase.name === 'Hold';

  return (
    <div className="micro-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="micro-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="micro-modal-header">
          <div className="micro-modal-title-row">
            <span className="micro-modal-icon">🌿</span>
            <div>
              <h2 className="micro-modal-title">Smart Guided Micro-Break</h2>
              <p className="micro-modal-subtitle">Reset mental bandwidth, relieve eye fatigue, and return refreshed.</p>
            </div>
          </div>
          <button
            type="button"
            className="micro-modal-close-btn"
            onClick={onClose}
            aria-label="Close micro break modal"
          >
            <IconX size={16} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="micro-modal-tabs">
          <button
            type="button"
            className={`micro-tab-btn ${activeTab === 'breathing' ? 'active' : ''}`}
            onClick={() => setActiveTab('breathing')}
          >
            🫁 Box Breathing
          </button>
          <button
            type="button"
            className={`micro-tab-btn ${activeTab === 'eye' ? 'active' : ''}`}
            onClick={() => setActiveTab('eye')}
          >
            👁️ 20-20-20 Eye Rest
          </button>
          <button
            type="button"
            className={`micro-tab-btn ${activeTab === 'stretch' ? 'active' : ''}`}
            onClick={() => setActiveTab('stretch')}
          >
            🧘 Desk Stretches
          </button>
        </div>

        {/* Tab 1: Box Breathing */}
        {activeTab === 'breathing' && (
          <div className="micro-content-panel">
            <div className="breathing-method-selector">
              <button
                type="button"
                className={`breath-pill-btn ${breathMethod === 'box' ? 'active' : ''}`}
                onClick={() => {
                  setBreathMethod('box');
                  setPhaseIndex(0);
                  setCycleCount(0);
                }}
              >
                Box (4-4-4-4)
              </button>
              <button
                type="button"
                className={`breath-pill-btn ${breathMethod === 'relax' ? 'active' : ''}`}
                onClick={() => {
                  setBreathMethod('relax');
                  setPhaseIndex(0);
                  setCycleCount(0);
                }}
              >
                Deep Relax (4-7-8)
              </button>
            </div>

            {/* Glowing Interactive Breathing Orb */}
            <div className="breathing-orb-stage">
              <div
                className={`breathing-orb ${isExpand ? 'orb-expand' : isHold ? 'orb-hold' : 'orb-contract'}`}
                style={{
                  animationDuration: `${currentPhase.duration}s`,
                }}
              >
                <div className="breathing-orb-inner">
                  <span className="orb-phase-label">{currentPhase.name}</span>
                  <span className="orb-phase-seconds">{phaseSecondsLeft}s</span>
                </div>
              </div>
            </div>

            <p className="breathing-tip-text">{currentPhase.tip}</p>

            {/* Controls */}
            <div className="breathing-controls-row">
              <button
                type="button"
                className="breathing-ctrl-btn"
                onClick={() => setIsBreathingRunning((v) => !v)}
              >
                {isBreathingRunning ? '⏸ Pause' : '▶ Resume'}
              </button>
              <span className="breathing-cycle-badge">
                ✨ {cycleCount} {cycleCount === 1 ? 'Cycle' : 'Cycles'} Completed
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: 20-20-20 Eye Rest */}
        {activeTab === 'eye' && (
          <div className="micro-content-panel eye-panel">
            <div className="eye-guide-card">
              <div className="eye-icon-badge">👁️</div>
              <h3 className="eye-guide-title">The 20-20-20 Rule</h3>
              <p className="eye-guide-desc">
                Every 20 minutes of screen work, look at something at least <strong>20 feet away</strong> for <strong>20 seconds</strong> to relax the ciliary muscles in your eyes.
              </p>
            </div>

            <div className="eye-countdown-circle">
              <span className="eye-countdown-digits">{eyeSeconds}</span>
              <span className="eye-countdown-sub">seconds left</span>
            </div>

            <div className="eye-actions">
              <button
                type="button"
                className="breathing-ctrl-btn eye-start-btn"
                onClick={() => {
                  if (!isEyeRunning && eyeSeconds === 20) {
                    setIsEyeRunning(true);
                  } else {
                    setIsEyeRunning((v) => !v);
                  }
                }}
              >
                {isEyeRunning ? '⏸ Pause' : eyeSeconds < 20 ? '▶ Resume' : '🚀 Start 20s Eye Rest'}
              </button>
              {eyeSeconds < 20 && (
                <button
                  type="button"
                  className="eye-reset-btn"
                  onClick={() => {
                    setIsEyeRunning(false);
                    setEyeSeconds(20);
                  }}
                >
                  Reset
                </button>
              )}
            </div>

            <div className="eye-steps-list">
              <div className={`eye-step-item ${eyeSeconds > 12 ? 'active' : ''}`}>
                <span className="step-num">1</span>
                <span>Look away through a window or at the furthest wall</span>
              </div>
              <div className={`eye-step-item ${eyeSeconds <= 12 && eyeSeconds > 6 ? 'active' : ''}`}>
                <span className="step-num">2</span>
                <span>Blink slowly and gently 4 times to lubricate eyes</span>
              </div>
              <div className={`eye-step-item ${eyeSeconds <= 6 ? 'active' : ''}`}>
                <span className="step-num">3</span>
                <span>Take one slow deep breath and relax facial muscles</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Desk Stretches */}
        {activeTab === 'stretch' && (
          <div className="micro-content-panel stretch-panel">
            <div className="stretch-selector-chips">
              {STRETCHES.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  className={`stretch-chip ${activeStretchIdx === idx ? 'active' : ''}`}
                  onClick={() => {
                    setActiveStretchIdx(idx);
                    setIsStretchRunning(false);
                    setStretchSeconds(s.duration);
                  }}
                >
                  <span>{s.icon}</span> {s.title.split(' ')[0]}
                </button>
              ))}
            </div>

            <div className="stretch-active-card">
              <div className="stretch-card-icon">{STRETCHES[activeStretchIdx].icon}</div>
              <h3 className="stretch-card-title">{STRETCHES[activeStretchIdx].title}</h3>
              <p className="stretch-card-steps">{STRETCHES[activeStretchIdx].steps}</p>

              <div className="stretch-timer-display">
                <span className="stretch-digits">{stretchSeconds}s</span>
                <button
                  type="button"
                  className="breathing-ctrl-btn"
                  onClick={() => setIsStretchRunning((v) => !v)}
                >
                  {isStretchRunning ? '⏸ Pause' : '▶ Start Stretch'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MicroBreakModal;
