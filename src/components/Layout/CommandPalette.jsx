import React, { useState, useEffect, useRef } from 'react';
import { IconClock, IconTimer, IconStats, IconUser, IconHelpCircle, IconX } from '../Icons';

const CommandPalette = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands = [
    { id: 'timer', title: 'Focus Timer', icon: <IconClock size={18} /> },
    { id: 'stats', title: 'View Analytics', icon: <IconStats size={18} /> },
    { id: 'account', title: 'Account Settings', icon: <IconUser size={18} /> },
    { id: 'support', title: 'Help & Support', icon: <IconHelpCircle size={18} /> },
  ];

  const filtered = commands.filter(c => c.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="cmd-palette-overlay" onClick={onClose}>
      <div className="cmd-palette-dialog" onClick={e => e.stopPropagation()}>
        <div className="cmd-palette-header">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search commands or settings..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="cmd-close-btn" onClick={onClose}><IconX size={16} /></button>
        </div>
        <div className="cmd-palette-results">
          {filtered.length > 0 ? (
            filtered.map(cmd => (
              <div
                key={cmd.id}
                className="cmd-result-item"
                onClick={() => {
                  onNavigate(cmd.id);
                  onClose();
                }}
              >
                {cmd.icon}
                <span>{cmd.title}</span>
              </div>
            ))
          ) : (
            <div className="cmd-empty-state">No commands found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
