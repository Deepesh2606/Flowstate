import React from 'react';

const TABS = [
  { id: 'timer', label: 'Timer', icon: '⏱' },
  { id: 'stats', label: 'Stats', icon: '📊' },
  { id: 'history', label: 'History', icon: '📋' },
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
