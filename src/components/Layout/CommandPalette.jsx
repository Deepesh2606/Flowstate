import React, { useState, useEffect, useRef } from 'react';
import {
  IconClock,
  IconTimer,
  IconStats,
  IconHistory,
  IconImage,
  IconHeadphones,
  IconTasks,
  IconEdit,
  IconSettings,
  IconChat,
  IconX,
} from '../Icons';

const COMMANDS = [
  { id: 'timer', title: 'Focus Timer', shortcut: '', category: 'Navigate', icon: IconTimer },
  { id: 'clock', title: 'Live Desk Clock', shortcut: '', category: 'Navigate', icon: IconClock },
  { id: 'stats', title: 'Study Analytics & Leaderboard', shortcut: '', category: 'Navigate', icon: IconStats },
  { id: 'history', title: 'Session History', shortcut: '', category: 'Navigate', icon: IconHistory },
  { id: 'wallpaper', title: 'Wallpapers & Site Default', shortcut: '', category: 'Customize', icon: IconImage },
  { id: 'audio', title: 'Music & Ambient Sounds', shortcut: 'M', category: 'Workspace', icon: IconHeadphones },
  { id: 'tasks', title: 'Tasks & To-Dos', shortcut: 'T', category: 'Workspace', icon: IconTasks },
  { id: 'notepad', title: 'Quick Notepad', shortcut: 'N', category: 'Workspace', icon: IconEdit },
  { id: 'chat', title: 'Ask AI Study Assistant', shortcut: 'C', category: 'Workspace', icon: IconChat },
  { id: 'rooms', title: 'Live Study Rooms', shortcut: '', category: 'Community', icon: IconClock },
  { id: 'settings', title: 'Settings & Preferences', shortcut: '', category: 'Customize', icon: IconSettings },
];

const CommandPalette = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  const filtered = COMMANDS.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q);
  });

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (filtered.length ? (prev + 1) % filtered.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (filtered.length ? (prev - 1 + filtered.length) % filtered.length : 0));
      } else if (e.key === 'Enter' && filtered[activeIndex]) {
        e.preventDefault();
        onNavigate(filtered[activeIndex].id);
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNavigate, filtered, activeIndex]);

  if (!isOpen) return null;

  return (
    <div className="cmd-palette-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Quick command palette">
      <div className="cmd-palette-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="cmd-palette-header">
          <input
            ref={inputRef}
            type="text"
            placeholder="Jump to timer, wallpapers, sounds, settings..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search commands"
          />
          <button type="button" className="cmd-close-btn" onClick={onClose} aria-label="Close command palette">
            <IconX size={16} />
          </button>
        </div>
        <div className="cmd-palette-results" role="listbox">
          {filtered.length > 0 ? (
            filtered.map((cmd, idx) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  type="button"
                  role="option"
                  aria-selected={idx === activeIndex}
                  className={`cmd-result-item ${idx === activeIndex ? 'is-active' : ''}`}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => {
                    onNavigate(cmd.id);
                    onClose();
                  }}
                >
                  <span className="cmd-result-left">
                    <Icon size={16} />
                    <span>{cmd.title}</span>
                  </span>
                  <span className="cmd-result-right">
                    <span className="cmd-result-cat">{cmd.category}</span>
                    {cmd.shortcut && <kbd className="cmd-result-kbd">{cmd.shortcut}</kbd>}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="cmd-empty-state">No matching commands found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
