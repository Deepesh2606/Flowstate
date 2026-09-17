import React from 'react';

const SSC_SUBJECTS = ['Quant', 'English', 'GK', 'Reasoning'];

const SubjectSelector = ({ subject, setSubject, studyMode, setStudyMode }) => {
  return (
    <div className="subject-selector glass-card">
      {/* Mode Toggle */}
      <div className="mode-toggle" role="group" aria-label="Study mode">
        <button
          className={`mode-toggle-btn ${studyMode === 'SSC CGL' ? 'active' : ''}`}
          onClick={() => setStudyMode('SSC CGL')}
          id="mode-ssc"
          aria-pressed={studyMode === 'SSC CGL'}
        >
          SSC CGL
        </button>
        <button
          className={`mode-toggle-btn ${studyMode === 'General' ? 'active' : ''}`}
          onClick={() => setStudyMode('General')}
          id="mode-general"
          aria-pressed={studyMode === 'General'}
        >
          General
        </button>
      </div>

      {/* SSC CGL Subject Chips */}
      {studyMode === 'SSC CGL' && (
        <div className="subject-chips" role="group" aria-label="Select subject">
          {SSC_SUBJECTS.map((s) => (
            <button
              key={s}
              id={`subject-${s.toLowerCase()}`}
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
