import React, { useState, useRef, useEffect } from 'react';

const SubjectSelector = ({
  subject,
  setSubject,
  studyMode,
  setStudyMode,
  targets = [],
  _isRunning = false,
  isEditing,
  setIsEditing,
}) => {
  const currentTarget = targets.find(t => t.name === studyMode) || (targets.length > 0 ? targets[0] : null);
  const [internalEditing, setInternalEditing] = useState(false);
  const [tempSubject, setTempSubject] = useState(subject || '');
  const inputRef = useRef(null);

  const editing = isEditing !== undefined ? isEditing : internalEditing;
  const setEditingState = (val) => {
    if (setIsEditing) setIsEditing(val);
    setInternalEditing(val);
    if (val) {
      setTempSubject(subject || '');
    }
  };

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = tempSubject.trim();
    setSubject(trimmed);
    setEditingState(false);
  };

  const handleKeyDown = (e) => {
    e.stopPropagation();
    if (e.key === 'Escape') {
      setTempSubject(subject || '');
      setEditingState(false);
    }
  };

  const handleChipClick = (s) => {
    setSubject(s);
    setTempSubject(s);
    setEditingState(false);
  };

  if (editing) {
    return (
      <form onSubmit={handleSubmit} className="focus-center-input-form">
        {/* Study Mode Selector if targets exist */}
        {targets.length > 1 && (
          <div className="mode-toggle" role="group" aria-label="Study mode">
            {targets.map(t => (
              <button
                key={t.id}
                type="button"
                className={`mode-toggle-btn ${studyMode === t.name ? 'active' : ''}`}
                onClick={() => {
                  setStudyMode(t.name);
                  if (t.subjects && t.subjects.length > 0) {
                    setTempSubject(t.subjects[0]);
                  }
                }}
                aria-pressed={studyMode === t.name}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}

        <div className="focus-center-input-wrapper">
          <input
            ref={inputRef}
            id="subject-text-input"
            className="focus-center-input"
            type="text"
            placeholder="What are you focusing on?"
            value={tempSubject}
            onChange={(e) => setTempSubject(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={50}
            autoFocus
            aria-label="Focus topic"
          />
          <button
            type="submit"
            className="focus-center-submit-btn"
            id="btn-set-focus"
            title="Set focus topic (Enter)"
          >
            Done ⏎
          </button>
          <button
            type="button"
            className="focus-center-cancel-btn"
            onClick={() => setEditingState(false)}
            title="Cancel"
            aria-label="Cancel editing"
          >
            ✕
          </button>
        </div>

        {/* Quick subject chips if configured */}
        {currentTarget && currentTarget.subjects && currentTarget.subjects.length > 0 && (
          <div className="focus-center-chips" role="group" aria-label="Preset subjects">
            {currentTarget.subjects.map((s) => (
              <button
                key={s}
                type="button"
                className={`focus-center-chip ${tempSubject === s ? 'active' : ''}`}
                onClick={() => handleChipClick(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </form>
    );
  }

  if (subject) {
    return (
      <div
        className="current-focus-badge"
        onClick={() => setEditingState(true)}
        title="Click to edit focus topic"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setEditingState(true)}
        id="current-focus-badge"
      >
        <span className="focus-badge-pulse" />
        <span className="focus-badge-tag">FOCUSING ON</span>
        <span className="focus-badge-text" title={subject}>{subject}</span>
        <span className="focus-badge-edit-icon" aria-hidden="true" title="Edit">✎</span>
        <button
          type="button"
          className="focus-badge-clear-btn"
          onClick={(e) => {
            e.stopPropagation();
            setSubject('');
            setTempSubject('');
            setEditingState(false);
          }}
          title="Clear topic"
          aria-label="Clear topic"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="current-focus-prompt-btn"
      onClick={() => setEditingState(true)}
      id="btn-set-focus-prompt"
      title="Set a focus topic"
    >
      <span className="focus-prompt-plus">+</span>
      <span>Set what you're focusing on</span>
    </button>
  );
};

export default SubjectSelector;
