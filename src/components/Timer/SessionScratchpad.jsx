import React, { useState, useEffect } from 'react';
import Notepad from '../Notepad/Notepad';
import { IconEdit } from '../Icons';

const STORAGE_KEY = 'flowstate_scratchpad_notes';

export const SessionScratchpad = ({ onTriggerRecall, subject }) => {
  const [hasNotes, setHasNotes] = useState(() => {
    try {
      return Boolean((localStorage.getItem(STORAGE_KEY) || '').trim());
    } catch {
      return false;
    }
  });

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkNotes = () => {
      try {
        setHasNotes(Boolean((localStorage.getItem(STORAGE_KEY) || '').trim()));
      } catch {}
    };
    window.addEventListener('flowstate_notes_updated', checkNotes);
    return () => window.removeEventListener('flowstate_notes_updated', checkNotes);
  }, []);

  return (
    <div className="scratchpad-wrapper">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          type="button"
          className={`scratchpad-toggle-btn ${hasNotes ? 'has-notes' : ''}`}
          onClick={() => setIsOpen(true)}
          title="Open Notepad & AI Flashcards"
          id="btn-scratchpad-toggle"
        >
          <IconEdit size={15} />
          <span className="scratchpad-toggle-text">Notepad</span>
          {hasNotes && <span className="scratchpad-badge">●</span>}
        </button>
      )}

      {/* Expanded Notepad Card */}
      {isOpen && (
        <div className="scratchpad-floating-anchor">
          <Notepad
            onClose={() => setIsOpen(false)}
            onTriggerRecall={onTriggerRecall}
            subject={subject}
          />
        </div>
      )}
    </div>
  );
};

export default SessionScratchpad;
