import React, { useState, useEffect, useRef } from 'react';

const MOODS = [
  { emoji: '🔥', label: 'On fire' },
  { emoji: '😊', label: 'Good' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '😩', label: 'Struggled' },
];

/**
 * Post-session note + mood picker modal.
 * Slides up after a focus session completes.
 */
const SessionNoteModal = ({ isOpen, onClose, onSave, onTriggerRecall, sessionInfo }) => {
  const [note, setNote] = useState('');
  const [mood, setMood] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setNote('');
      setMood(null);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ note: note.trim(), mood });
    onClose();
  };

  const handleSkip = () => {
    onSave({ note: '', mood: null });
    onClose();
  };

  const handleRecall = () => {
    const savedNote = note.trim();
    onSave({ note: savedNote, mood });
    onClose();
    if (onTriggerRecall) {
      onTriggerRecall(savedNote, sessionInfo?.subject);
    }
  };

  const formatDuration = (secs) => {
    if (!secs) return '';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <div className="session-note-overlay" role="dialog" aria-modal="true" aria-label="Session note">
      <div className="session-note-card">
        {/* Header */}
        <div className="session-note-header">
          <span className="session-note-icon">✅</span>
          <div>
            <div className="session-note-title">Session Complete!</div>
            {sessionInfo?.duration > 0 && (
              <div className="session-note-sub">
                {formatDuration(sessionInfo.duration)} focused
                {sessionInfo?.subject ? ` on ${sessionInfo.subject}` : ''}
              </div>
            )}
          </div>
        </div>

        {/* Mood picker */}
        <div className="session-note-section">
          <div className="session-note-label">How did it go?</div>
          <div className="session-mood-row">
            {MOODS.map((m) => (
              <button
                key={m.label}
                type="button"
                className={`session-mood-btn ${mood === m.label ? 'active' : ''}`}
                onClick={() => setMood(mood === m.label ? null : m.label)}
                title={m.label}
              >
                <span className="session-mood-emoji">{m.emoji}</span>
                <span className="session-mood-label">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Note input */}
        <div className="session-note-section">
          <div className="session-note-label">Quick note <span style={{ opacity: 0.5 }}>(optional)</span></div>
          <input
            ref={inputRef}
            type="text"
            className="session-note-input"
            placeholder="What did you work on? Any blockers?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleSkip();
            }}
            maxLength={200}
          />
        </div>

        {/* Actions */}
        <div className="session-note-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            className="session-note-recall-btn"
            onClick={handleRecall}
            title="Generate 3 AI active recall flashcards from your study session"
          >
            <span>⚡</span> Test Recall (3 AI Flashcards)
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="session-note-skip" onClick={handleSkip} style={{ flex: 1 }}>
              Skip
            </button>
            <button type="button" className="session-note-save" onClick={handleSave} style={{ flex: 1 }}>
              Save Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionNoteModal;
