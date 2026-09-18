import React from 'react';
import { IconTimer, IconStats, IconHistory } from '../Icons';

const TABS = [
  { id: 'timer', label: 'Timer', icon: <IconTimer size={20} /> },
  { id: 'stats', label: 'Stats', icon: <IconStats size={20} /> },
  { id: 'history', label: 'History', icon: <IconHistory size={20} /> },
];

const TabBar = ({ activeTab, onTabChange }) => {
  return (
    <nav className="tab-bar" role="tablist" aria-label="Main navigation">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          id={`nav-${tab.id}`}
          className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`panel-${tab.id}`}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default TabBar;
