import React, { useState, useEffect } from 'react';
import { IconX } from '../Icons';
import { subscribeLiveRooms } from '../../firebase/firestore';

const REACTIONS = ['🔥', '☕', '✨', '🧠', '👏', '🎯'];

const LiveRoomsModal = ({ onClose, onSyncTimer, currentUser }) => {
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [customRoomCode, setCustomRoomCode] = useState('');
  const [groupName, setGroupName] = useState('');
  const [joinedCustom, setJoinedCustom] = useState(false);
  const [synced, setSynced] = useState(false);
  const [reactionsList, setReactionsList] = useState([]);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    const unsub = subscribeLiveRooms((data) => {
      setRooms(data || []);
      if (data?.length > 0 && !selectedRoomId) {
        setSelectedRoomId(data[0].id);
      }
    });
    return () => unsub();
  }, [selectedRoomId]);

  const activeRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0] || null;

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

  const handleCreateGroup = (e) => {
    e.preventDefault();
    const name = groupName.trim();
    if (!name) return;
    const code = `${name.replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase() || 'FOCUS'}-${Math.floor(100 + Math.random() * 900)}`;
    setCustomRoomCode(code);
    setJoinedCustom(true);
    setGroupName('');
  };

  const handleSyncClick = () => {
    setSynced(true);
    if (onSyncTimer && activeRoom) onSyncTimer(activeRoom);
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
              <span>STUDY GROUPS</span>
            </div>
            <h2 className="rooms-title">Focus together</h2>
            <p className="rooms-subtitle">Join a public group or create a private room for your study circle.</p>
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
        {rooms.length > 0 ? (
          <div className="rooms-selector-grid">
            {rooms.map((room) => {
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
                    <span className="room-card-icon">{room.icon || '💬'}</span>
                    <span className="room-online-pill">
                      <span className="rooms-live-indicator" /> {room.onlineCount || 0} online
                    </span>
                  </div>
                  <div className="room-card-name">{room.name}</div>
                  <div className="room-card-meta">
                    <span>⏱️ {room.pomodoro || '25 / 5'}</span> · <span>{room.tag || 'General'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No active public study rooms right now. Create a private group below!
          </div>
        )}

        {/* Active Room Detail Panel */}
        {activeRoom || joinedCustom ? (
          <div className="active-room-panel">
            <div className="active-room-header">
              <div className="active-room-title-block">
                <div className="active-room-icon-wrap">{activeRoom?.icon || '🔒'}</div>
                <div>
                  <h3 className="active-room-heading">
                    {joinedCustom ? `Private Room: ${customRoomCode.toUpperCase()}` : activeRoom?.name}
                  </h3>
                  <span className="active-room-sub">
                    🎧 Recommended Ambience: <strong>{activeRoom?.ambience || 'Lofi Beats'}</strong>
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
                <span>👥 STUDYING RIGHT NOW ({joinedCustom ? 1 : (activeRoom?.onlineCount || 1)} STUDENTS)</span>
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
                {!joinedCustom && activeRoom?.members?.map((m, idx) => (
                  <div key={idx} className="member-chip">
                    <div className="member-avatar-box" style={{ borderColor: m.color || '#fff' }}>
                      <span>{m.avatar || '👤'}</span>
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
        ) : null}

        {/* Private study group controls */}
        <div className="custom-room-footer">
          <form className="create-group-form" onSubmit={handleCreateGroup}>
            <span className="custom-room-label">✨ Create a private group</span>
            <input
              type="text"
              className="custom-room-input"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Biology finals"
              maxLength={24}
            />
            <button type="submit" className="custom-room-submit-btn">Create</button>
          </form>
          <form className="custom-room-form" onSubmit={handleJoinCustom}>
            <span className="custom-room-label">🔑 Join with code</span>
            <input
              type="text"
              className="custom-room-input"
              value={customRoomCode}
              onChange={(e) => setCustomRoomCode(e.target.value.toUpperCase())}
              placeholder="e.g. FOCUS-492"
              maxLength={12}
            />
            <button type="submit" className="custom-room-submit-btn">
              Join
            </button>
          </form>
          {joinedCustom && customRoomCode && (
            <button
              type="button"
              className="group-share-code"
              onClick={() => {
                navigator.clipboard?.writeText(customRoomCode);
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 2000);
              }}
              title="Copy group code"
            >
              Share code <strong className={copiedCode ? 'code-vanish' : ''}>{copiedCode ? 'COPIED!' : customRoomCode.toUpperCase()}</strong> · {copiedCode ? 'text copied' : 'tap to copy'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveRoomsModal;
