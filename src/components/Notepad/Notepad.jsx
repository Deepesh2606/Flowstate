import React, { useState, useEffect, useRef } from 'react';
import { IconEdit, IconTrash, IconX } from '../Icons';

const STORAGE_KEY = 'flowstate_scratchpad_notes';

const Notepad = ({ onClose, onTriggerRecall, subject }) => {
  const [notes, setNotes] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  const textareaRef = useRef(null);

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, notes);
      window.dispatchEvent(new Event('flowstate_notes_updated'));
    } catch {}
  }, [notes]);

  // Listen to external notes updates
  useEffect(() => {
    const handleUpdate = () => {
      try {
        const val = localStorage.getItem(STORAGE_KEY) || '';
        if (val !== notes) setNotes(val);
      } catch {}
    };
    window.addEventListener('flowstate_notes_updated', handleUpdate);
    return () => window.removeEventListener('flowstate_notes_updated', handleUpdate);
  }, [notes]);

  const wordCount = notes.trim() ? notes.trim().split(/\s+/).length : 0;
  const charCount = notes.length;

  const handleClear = () => {
    if (notes.trim() && !window.confirm('Clear all notes in notepad?')) return;
    setNotes('');
    textareaRef.current?.focus();
  };

  const applyFormat = (prefix, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const replacement = prefix + selectedText + suffix;
    const newText = text.substring(0, start) + replacement + text.substring(end);
    setNotes(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  return (
    <div className="notepad-card-container" role="region" aria-label="Notepad">
      {/* ─── Header ─── */}
      <div className="notepad-card-header">
        <div className="notepad-header-left">
          <div className="notepad-icon-box">
            <IconEdit size={18} color="#c084fc" />
          </div>
          <div>
            <div className="notepad-title-row">
              <span className="notepad-title">Notepad</span>
            </div>
            <div className="notepad-counter-sub">
              {wordCount} {wordCount === 1 ? 'word' : 'words'} · {charCount} chars
            </div>
          </div>
        </div>

        <div className="notepad-header-right">
          {notes.trim() && (
            <button
              type="button"
              className="notepad-action-icon-btn"
              onClick={handleClear}
              title="Clear notes"
              aria-label="Clear notes"
            >
              <IconTrash size={16} />
            </button>
          )}
          {onClose && (
            <button
              type="button"
              className="notepad-action-icon-btn"
              onClick={onClose}
              title="Close notepad"
              aria-label="Close notepad"
            >
              <IconX size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ─── Formatting Toolbar (matching screenshot) ─── */}
      <div className="notepad-toolbar" role="toolbar" aria-label="Text formatting">
        <button type="button" className="notepad-tool-btn" onClick={() => applyFormat('**', '**')} title="Bold (Ctrl+B)">
          <strong>B</strong>
        </button>
        <button type="button" className="notepad-tool-btn" onClick={() => applyFormat('*', '*')} title="Italic (Ctrl+I)">
          <em>I</em>
        </button>
        <button type="button" className="notepad-tool-btn" onClick={() => applyFormat('<u>', '</u>')} title="Underline">
          <u>U</u>
        </button>
        <button type="button" className="notepad-tool-btn" onClick={() => applyFormat('~~', '~~')} title="Strikethrough">
          <s>S</s>
        </button>

        <span className="notepad-tool-divider" />

        <button type="button" className="notepad-tool-btn" onClick={() => applyFormat('# ')} title="Heading 1">
          H₁
        </button>
        <button type="button" className="notepad-tool-btn" onClick={() => applyFormat('## ')} title="Heading 2">
          H₂
        </button>
        <button type="button" className="notepad-tool-btn" onClick={() => applyFormat('> ')} title="Quote">
          ”
        </button>

        <span className="notepad-tool-divider" />

        <button type="button" className="notepad-tool-btn" onClick={() => applyFormat('1. ')} title="Numbered List">
          1.
        </button>
        <button type="button" className="notepad-tool-btn" onClick={() => applyFormat('• ')} title="Bullet List">
          •
        </button>
        <button type="button" className="notepad-tool-btn" onClick={() => applyFormat('- [ ] ')} title="Checklist">
          ☑
        </button>

        <span className="notepad-tool-divider" />

        <button type="button" className="notepad-tool-btn" onClick={() => applyFormat('  ')} title="Indent">
          ⇥
        </button>
        <button
          type="button"
          className="notepad-tool-btn"
          onClick={() => {
            const textarea = textareaRef.current;
            if (!textarea) return;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = textarea.value;
            const clean = text.substring(start, end).replace(/[\*_~#>`]/g, '');
            setNotes(text.substring(0, start) + clean + text.substring(end));
          }}
          title="Clear formatting"
        >
          T<sub style={{ fontSize: '9px' }}>x</sub>
        </button>
      </div>

      {/* ─── Editor Area ─── */}
      <div className="notepad-editor-wrap">
        <textarea
          ref={textareaRef}
          className="notepad-textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              e.target.blur();
              onClose?.();
            }
          }}
          placeholder=""
        />

        {/* Placeholder overlay when notes is empty */}
        {!notes.trim() && (
          <div
            className="notepad-empty-placeholder"
            onClick={() => textareaRef.current?.focus()}
          >
            <p className="notepad-placeholder-text">
              Brain dump your best ideas without distractions. Track word and character counts.
            </p>
          </div>
        )}
      </div>

      {/* ─── Footer with AI Flashcards option ─── */}
      {notes.trim() && onTriggerRecall && (
        <div className="notepad-footer">
          <button
            type="button"
            className="notepad-recall-action-btn"
            onClick={() => onTriggerRecall(notes, subject)}
            title="Generate 3 AI Flashcards from these notes"
          >
            ⚡ Test Recall (AI Flashcards)
          </button>
        </div>
      )}
    </div>
  );
};

export default Notepad;
