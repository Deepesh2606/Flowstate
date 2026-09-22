import React, { useState, useEffect } from 'react';
import { IconX } from '../Icons';

const PRESET_ROOMS = [
  {
    id: 'forest-library',
    name: 'Pinecrest Forest Library',
    tag: 'Silent Deep Work',
    icon: '🌲',
    onlineCount: 268,
    pomodoro: '50 / 10',
    ambience: 'Forest Wind & Soft Rain',
    members: [
      { name: 'Elena Rostova', role: 'Medical Student', status: 'Focusing (22m left)', avatar: '👩‍⚕️', color: '#10b981' },
      { name: 'Kenji Takahashi', role: 'Software Engineer', status: 'Focusing (22m left)', avatar: '👨‍💻', color: '#06b6d4' },
      { name: 'Maya Lin', role: 'Architecture', status: 'Short Break (4m)', avatar: '👩‍🎨', color: '#f59e0b' },
      { name: 'David Chen', role: 'Data Analysis', status: 'Focusing (22m left)', avatar: '📊', color: '#8b5cf6' },
      { name: 'Sarah Miller', role: 'Law Review', status: 'Focusing (22m left)', avatar: '📚', color: '#ec4899' },
    ],
  },
  {
    id: 'rainy-cafe',
    name: 'Shibuya Rainy Cafe',
    tag: 'Ambient & Lofi Beats',
    icon: '☕',
    onlineCount: 184,
    pomodoro: '25 / 5',
    ambience: 'Cafe Chatter & Rain on Glass',
    members: [
      { name: 'Chloe Dubois', role: 'Graphic Design', status: 'Focusing (14m left)', avatar: '🎨', color: '#ec4899' },
      { name: 'Arjun Mehta', role: 'Machine Learning', status: 'Focusing (14m left)', avatar: '🤖', color: '#06b6d4' },
      { name: 'Leo Vance', role: 'Creative Writing', status: 'Short Break (2m)', avatar: '✍️', color: '#f59e0b' },
      { name: 'Hannah Schmidt', role: 'Economics Prep', status: 'Focusing (14m left)', avatar: '📈', color: '#10b981' },
    ],
  },
  {
    id: 'coding-lab',
    name: 'Late Night Coding Lab',
    tag: 'High Velocity Sprints',
    icon: '🚀',
    onlineCount: 142,
    pomodoro: '45 / 15',
    ambience: 'Cyber Lofi & Synthwave',
    members: [
      { name: 'Alex Rivera', role: 'Full Stack Dev', status: 'Focusing (31m left)', avatar: '💻', color: '#06b6d4' },
      { name: 'Zack Thorne', role: 'Game Engine', status: 'Focusing (31m left)', avatar: '🕹️', color: '#8b5cf6' },
      { name: 'Nadia Popov', role: 'Backend Lead', status: 'Focusing (31m left)', avatar: '⚡', color: '#10b981' },
      { name: 'Tariq Al-Mansoor', role: 'Security Audit', status: 'Short Break (8m)', avatar: '🛡️', color: '#f59e0b' },
    ],
  },
  {
    id: 'lofi-space',
    name: 'Celestial Lo-Fi Station',
    tag: 'Calm & Atmospheric Reading',
    icon: '🌌',
    onlineCount: 95,
    pomodoro: '30 / 5',
    ambience: 'Cosmic Drone & White Noise',
    members: [
      { name: 'Aria Thorne', role: 'Astrophysics', status: 'Focusing (19m left)', avatar: '🔭', color: '#8b5cf6' },
      { name: 'Liam Wilson', role: 'Philosophy Essay', status: 'Focusing (19m left)', avatar: '📖', color: '#06b6d4' },
      { name: 'Emma Watson', role: 'Exam Review', status: 'Focusing (19m left)', avatar: '📝', color: '#ec4899' },
    ],
  },
];

const REACTIONS = ['🔥', '☕', '✨', '🧠', '👏', '🎯'];

const LiveRoomsModal = ({ onClose, onSyncTimer, currentUser }) => {
  const [selectedRoomId, setSelectedRoomId] = useState('forest-library');
  const [customRoomCode, setCustomRoomCode] = useState('');
  const [joinedCustom, setJoinedCustom] = useState(false);
  const [synced, setSynced] = useState(false);
  const [reactionsList, setReactionsList] = useState([]);

  const activeRoom = PRESET_ROOMS.find((r) => r.id === selectedRoomId) || PRESET_ROOMS[0];

  // Esc key closes modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Handle send reaction burst
  const handleReaction = (emoji) => {
    const id = Date.now() + Math.random();
    setReactionsList((prev) => [...prev, { id, emoji, x: Math.random() * 60 + 20 }]);
    setTimeout(() => {
      setReactionsList((prev) => prev.filter((r) => r.id !== id));
    }, 2000);
  };

  const handleJoinCustom = (e) => {
    e.preventDefault();
    if (!customRoomCode.trim()) return;
    setJoinedCustom(true);
  };

  const handleSyncClick = () => {
    setSynced(true);
    if (onSyncTimer) onSyncTimer(activeRoom);
    setTimeout(() => setSynced(false), 2500);
  };

  return (
    <div className="rooms-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="rooms-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Floating live reactions display */}
        <div className="rooms-floating-reactions-stage" aria-hidden="true">
          {reactionsList.map((r) => (
            <span
              key={r.id}
              className="rooms-floating-reaction"
              style={{ left: `${r.x}%` }}
            >
              {r.emoji}
            </span>
          ))}
        </div>

        {/* Modal Header */}
        <div className="rooms-modal-header">
          <div className="rooms-header-left">
            <div className="rooms-header-badge">
              <span className="rooms-pulsing-dot" />
              <span>LIVE STUDY ROOMS</span>
            </div>
            <h2 className="rooms-title">Focus Together in Real-Time</h2>
            <p className="rooms-subtitle">Join thousands of students and creators in distraction-free co-working spaces.</p>
          </div>
          <button
            type="button"
            className="rooms-close-btn"
            onClick={onClose}
            aria-label="Close Live Rooms"
          >
            <IconX size={16} />
          </button>
        </div>

        {/* Room Grid Selector */}
        <div className="rooms-selector-grid">
          {PRESET_ROOMS.map((room) => {
            const isSelected = room.id === selectedRoomId && !joinedCustom;
            return (
              <button
                key={room.id}
                type="button"
                className={`room-card-btn ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  setSelectedRoomId(room.id);
                  setJoinedCustom(false);
                }}
              >
                <div className="room-card-top">
                  <span className="room-card-icon">{room.icon}</span>
                  <span className="room-online-pill">
                    <span className="rooms-live-indicator" /> {room.onlineCount} online
                  </span>
                </div>
                <div className="room-card-name">{room.name}</div>
                <div className="room-card-meta">
                  <span>⏱️ {room.pomodoro}</span> · <span>{room.tag}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Room Detail Panel */}
        <div className="active-room-panel">
          <div className="active-room-header">
            <div className="active-room-title-block">
              <div className="active-room-icon-wrap">{activeRoom.icon}</div>
              <div>
                <h3 className="active-room-heading">
                  {joinedCustom ? `Private Room: ${customRoomCode.toUpperCase()}` : activeRoom.name}
                </h3>
                <span className="active-room-sub">
                  🎧 Recommended Ambience: <strong>{activeRoom.ambience}</strong>
                </span>
              </div>
            </div>

            {/* Sync Timer Button */}
            <button
              type="button"
              className={`room-sync-timer-btn ${synced ? 'synced' : ''}`}
              onClick={handleSyncClick}
              title="Synchronize your Pomodoro timer with this room"
            >
              {synced ? '✅ Synced to Room!' : '⏱️ Sync My Timer'}
            </button>
          </div>

          {/* Active Members List */}
          <div className="active-room-members-section">
            <div className="members-section-header">
              <span>👥 STUDYING RIGHT NOW ({activeRoom.onlineCount} STUDENTS)</span>
              <span className="members-muted-tip">Soundless presence · Keep going</span>
            </div>

            <div className="members-chips-list">
              {/* Current user */}
              <div className="member-chip member-chip--you">
                <div className="member-avatar-box" style={{ borderColor: '#06b6d4' }}>
                  {currentUser?.photoURL ? (
                    <img src={currentUser.photoURL} alt="You" className="member-img" />
                  ) : (
                    <span>⭐</span>
                  )}
                </div>
                <div className="member-info">
                  <span className="member-name">{currentUser?.displayName || 'Deepesh (You)'}</span>
                  <span className="member-status">⚡ In Flowstate</span>
                </div>
              </div>

              {/* Other peers */}
              {activeRoom.members.map((m, idx) => (
                <div key={idx} className="member-chip">
                  <div className="member-avatar-box" style={{ borderColor: m.color }}>
                    <span>{m.avatar}</span>
                  </div>
                  <div className="member-info">
                    <span className="member-name">{m.name}</span>
                    <span className="member-status">{m.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cheer & Reaction Bar */}
          <div className="rooms-reactions-bar">
            <span className="reactions-label">Send study energy to the room:</span>
            <div className="reactions-btns-group">
              {REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="reaction-burst-btn"
                  onClick={() => handleReaction(emoji)}
                  title={`Send ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Room Code Bar */}
        <div className="custom-room-footer">
          <form className="custom-room-form" onSubmit={handleJoinCustom}>
            <span className="custom-room-label">🔑 Or Join Private Study Room:</span>
            <input
              type="text"
              className="custom-room-input"
              value={customRoomCode}
              onChange={(e) => setCustomRoomCode(e.target.value.toUpperCase())}
              placeholder="e.g. FOCUS-492"
              maxLength={12}
            />
            <button type="submit" className="custom-room-submit-btn">
              Join Room
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LiveRoomsModal;
