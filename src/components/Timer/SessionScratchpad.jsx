import React, { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = 'flowstate_scratchpad_notes';
const COLLAPSED_KEY = 'flowstate_scratchpad_collapsed';

export const SessionScratchpad = ({ onTriggerRecall, subject }) => {
  const [notes, setNotes] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  const [isOpen, setIsOpen] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, notes);
    } catch {}
  }, [notes]);

  const handleClear = () => {
    if (notes.trim() && !window.confirm('Clear your session notes?')) return;
    setNotes('');
  };

  const wordCount = notes.trim() ? notes.trim().split(/\s+/).length : 0;

  return (
    <div className="scratchpad-wrapper">
      {/* Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          className={`scratchpad-toggle-btn ${notes.trim() ? 'has-notes' : ''}`}
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => textareaRef.current?.focus(), 150);
          }}
          title="Session Scratchpad & AI Flashcards"
          id="btn-scratchpad-toggle"
        >
          <span className="scratchpad-toggle-icon">📝</span>
          <span className="scratchpad-toggle-text">Scratchpad</span>
          {notes.trim() && <span className="scratchpad-badge">{wordCount}w</span>}
        </button>
      )}

      {/* Expanded Modal / Card */}
      {isOpen && (
        <div className="scratchpad-panel" role="region" aria-label="Session scratchpad">
          <div className="scratchpad-header">
            <div className="scratchpad-title-group">
              <span className="scratchpad-icon">📝</span>
              <div>
                <div className="scratchpad-title">Session Scratchpad</div>
                <div className="scratchpad-subtitle">
                  {subject ? `Studying ${subject}` : 'Jot key concepts & formulas'}
                </div>
              </div>
            </div>

            <div className="scratchpad-header-actions">
              {notes.trim() && (
                <button
                  type="button"
                  className="scratchpad-clear-btn"
                  onClick={handleClear}
                  title="Clear notes"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                className="scratchpad-close-btn"
                onClick={() => setIsOpen(false)}
                title="Minimize scratchpad"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="scratchpad-body">
            <textarea
              ref={textareaRef}
              className="scratchpad-textarea"
              placeholder="Jot key terms, equations, questions, or definitions here...&#10;&#10;e.g.&#10;• Mitochondria: site of ATP synthesis via chemiosmosis&#10;• Rate law: k[A]^2 is second-order overall&#10;• Active recall increases memory consolidation"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
            />
          </div>

          <div className="scratchpad-footer">
            <span className="scratchpad-stats">
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </span>

            <button
              type="button"
              className="scratchpad-recall-btn"
              onClick={() => {
                onTriggerRecall(notes, subject);
              }}
              title="Generate 3 AI Flashcards from these notes"
              id="btn-scratchpad-recall"
            >
              <span>⚡</span> Generate AI Flashcards
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionScratchpad;
