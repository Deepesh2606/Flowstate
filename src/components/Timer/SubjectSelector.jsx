import React from 'react';

const SubjectSelector = ({ subject, setSubject, studyMode, setStudyMode, targets }) => {
  const currentTarget = targets.find(t => t.name === studyMode);

  return (
    <div className="subject-selector glass-card">
      {/* Mode Toggle */}
      <div className="mode-toggle" role="group" aria-label="Study mode">
        {targets.map(t => (
          <button
            key={t.id}
            className={`mode-toggle-btn ${studyMode === t.name ? 'active' : ''}`}
            onClick={() => setStudyMode(t.name)}
            aria-pressed={studyMode === t.name}
          >
            {t.name}
          </button>
        ))}
        <button
          className={`mode-toggle-btn ${studyMode === 'General' ? 'active' : ''}`}
          onClick={() => setStudyMode('General')}
          id="mode-general"
          aria-pressed={studyMode === 'General'}
        >
          General
        </button>
      </div>

      {/* Subject Chips */}
      {currentTarget && currentTarget.subjects.length > 0 && (
        <div className="subject-chips" role="group" aria-label="Select subject">
          {currentTarget.subjects.map((s) => (
            <button
              key={s}
              className={`subject-chip ${subject === s ? 'active' : ''}`}
              onClick={() => setSubject(s)}
              aria-pressed={subject === s}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* General Free Text */}
      {studyMode === 'General' && (
        <input
          className="subject-input"
          type="text"
          placeholder="What are you studying?"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={50}
          id="subject-text-input"
          aria-label="Study subject"
        />
      )}
    </div>
  );
};

export default SubjectSelector;
