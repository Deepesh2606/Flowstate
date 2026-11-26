import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IconX, IconPlay, IconPause, IconRotateCcw } from '../Icons';

const REACTIONS = ['🔥', '☕', '✨', '🧠', '👏', '🎯'];

const formatCountdown = (seconds) => {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  const m = String(Math.floor(safe / 60)).padStart(2, '0');
  const s = String(safe % 60).padStart(2, '0');
  return `${m}:${s}`;
};

const computeDisplayRemaining = (timer) => {
  if (!timer) return 0;
  if (timer.isRunning && timer.endsAt) {
    return Math.max(0, Math.ceil((timer.endsAt - Date.now()) / 1000));
  }
  return Math.max(0, Math.floor(Number(timer.remainingSec) || 0));
};

const LiveRoomsModal = ({ onClose, onSyncTimer, currentUser }) => {
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [myMemberId, setMyMemberId] = useState(null);
  const [connectionState, setConnectionState] = useState('connecting'); // 'connecting' | 'connected' | 'reconnecting'
  const [roomError, setRoomError] = useState('');

  const [groupName, setGroupName] = useState('');
  const [customRoomCode, setCustomRoomCode] = useState('');
  const [myTopic, setMyTopic] = useState(() => localStorage.getItem('flowstate_room_topic') || 'Deep Work');
  const [chatText, setChatText] = useState('');
  const [synced, setSynced] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [reactionsList, setReactionsList] = useState([]);
  const [tickNow, setTickNow] = useState(() => Date.now());

  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const chatEndRef = useRef(null);
  const activeRoomIdRef = useRef(null);
  const hasAutoJoinedRef = useRef(false);

  const displayName = currentUser?.displayName || 'Guest Scholar';
  const photoURL = currentUser?.photoURL || '';

  const sendWs = useCallback((payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }, []);

  const joinRoomById = useCallback(
    (roomIdOrCode) => {
      setRoomError('');
      sendWs({
        type: 'room:join',
        roomId: roomIdOrCode,
        code: roomIdOrCode,
        displayName,
        photoURL,
        avatar: '⭐',
        topic: myTopic.trim() || 'Deep Work',
      });
    },
    [sendWs, displayName, photoURL, myTopic]
  );

  // Connect to authoritative /ws/rooms WebSocket server
  useEffect(() => {
    let closedByUser = false;

    const connect = () => {
      setConnectionState((prev) => (prev === 'connected' ? 'connected' : 'connecting'));
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws/rooms`);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionState('connected');
        setRoomError('');
      };

      ws.onmessage = (event) => {
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }

        if (msg.type === 'connected') {
          setMyMemberId(msg.memberId || null);
          const list = Array.isArray(msg.rooms) ? msg.rooms : [];
          setRooms(list);

          const targetId = activeRoomIdRef.current || list[0]?.id;
          if (targetId && (!hasAutoJoinedRef.current || activeRoomIdRef.current)) {
            hasAutoJoinedRef.current = true;
            ws.send(
              JSON.stringify({
                type: 'room:join',
                roomId: targetId,
                displayName,
                photoURL,
                avatar: '⭐',
                topic: (localStorage.getItem('flowstate_room_topic') || 'Deep Work').trim(),
              })
            );
          }
          return;
        }

        if (msg.type === 'rooms:list') {
          setRooms(Array.isArray(msg.rooms) ? msg.rooms : []);
          return;
        }

        if (msg.type === 'room:state' && msg.room) {
          setActiveRoom(msg.room);
          activeRoomIdRef.current = msg.room.id;
          setRoomError('');
          return;
        }

        if (msg.type === 'room:message' && msg.message) {
          setActiveRoom((prev) => {
            if (!prev) return prev;
            const exists = prev.messages?.some((m) => m.id === msg.message.id);
            if (exists) return prev;
            return {
              ...prev,
              messages: [...(prev.messages || []), msg.message].slice(-40),
            };
          });
          return;
        }

        if (msg.type === 'room:reaction' && msg.emoji) {
          const rxId = msg.id || `${Date.now()}_${Math.random()}`;
          setReactionsList((prev) => [
            ...prev,
            { id: rxId, emoji: msg.emoji, x: Math.random() * 64 + 18 },
          ]);
          setTimeout(() => {
            setReactionsList((prev) => prev.filter((r) => r.id !== rxId));
          }, 2100);
          return;
        }

        if (msg.type === 'room:error') {
          setRoomError(msg.message || 'Unable to join room.');
        }
      };

      ws.onclose = () => {
        if (closedByUser) return;
        setConnectionState('reconnecting');
        reconnectTimerRef.current = setTimeout(connect, 2000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      closedByUser = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        try {
          if (wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'room:leave' }));
          }
          wsRef.current.close();
        } catch {
          // ignore
        }
        wsRef.current = null;
      }
    };
  }, [displayName, photoURL]);

  // Live 1-second local countdown tick for active room timer
  useEffect(() => {
    if (!activeRoom?.timer?.isRunning) return undefined;
    const id = setInterval(() => setTickNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [activeRoom?.timer?.isRunning]);

  // Auto-scroll check-in chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeRoom?.messages?.length]);

  // Esc key closes modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleReaction = (emoji) => {
    sendWs({ type: 'room:reaction', emoji });
  };

  const handleCreateGroup = (e) => {
    e.preventDefault();
    const trimmed = groupName.trim();
    if (!trimmed) {
      setRoomError('Enter a name to create a private room.');
      return;
    }
    setRoomError('');
    sendWs({
      type: 'room:create',
      name: trimmed,
      focusMinutes: 45,
      breakMinutes: 10,
      displayName,
      photoURL,
      avatar: '⭐',
      topic: myTopic.trim() || 'Deep Work',
    });
    setGroupName('');
  };

  const handleJoinCustom = (e) => {
    e.preventDefault();
    const code = customRoomCode.trim().toUpperCase();
    if (!code) {
      setRoomError('Enter an invite code to join a private room.');
      return;
    }
    joinRoomById(code);
    setCustomRoomCode('');
  };

  const handleTopicSubmit = (e) => {
    e.preventDefault();
    const clean = myTopic.trim() || 'Deep Work';
    try {
      localStorage.setItem('flowstate_room_topic', clean);
    } catch {
      // ignore
    }
    sendWs({ type: 'member:status', topic: clean });
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    const trimmed = chatText.trim();
    if (!trimmed) return;
    if (sendWs({ type: 'room:message', text: trimmed })) {
      setChatText('');
    }
  };

  const handleSyncClick = () => {
    if (!activeRoom || !onSyncTimer) return;
    const liveRemaining = computeDisplayRemaining(activeRoom.timer);
    setSynced(true);
    onSyncTimer({
      roomName: activeRoom.name,
      focusMinutes: activeRoom.timer?.focusMinutes || activeRoom.focusMinutes || 45,
      breakMinutes: activeRoom.timer?.breakMinutes || activeRoom.breakMinutes || 10,
      phase: activeRoom.timer?.phase || 'focus',
      remainingSec: liveRemaining,
      isRunning: Boolean(activeRoom.timer?.isRunning),
    });
    setTimeout(() => setSynced(false), 2000);
  };

  // Use tickNow so countdown re-renders smoothly while running
  void tickNow;
  const remainingSec = computeDisplayRemaining(activeRoom?.timer);
  const timerRunning = Boolean(activeRoom?.timer?.isRunning);
  const timerPhase = activeRoom?.timer?.phase || 'focus';

  return (
    <div className="rooms-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Live Study Rooms">
      <div className="rooms-modal-card" onClick={(e) => e.stopPropagation()} data-testid="live-rooms-modal">
        {/* Floating live reactions display */}
        <div className="rooms-floating-reactions-stage" aria-hidden="true">
          {reactionsList.map((r) => (
            <span key={r.id} className="rooms-floating-reaction" style={{ left: `${r.x}%` }}>
              {r.emoji}
            </span>
          ))}
        </div>

        {/* Modal Header */}
        <div className="rooms-modal-header">
          <div className="rooms-header-left">
            <div className="rooms-header-kicker">
              <span>Live Study Rooms</span>
              <span aria-hidden="true">·</span>
              <span>{connectionState === 'connected' ? 'Connected' : 'Connecting'}</span>
            </div>
            <h2 className="rooms-title">Focus together in real time</h2>
            <p className="rooms-subtitle">
              Join a shared study hall with a synchronized timer, or create a private room with an invite code.
            </p>
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

        {roomError && (
          <div className="rooms-error-banner" role="alert">
            <span>{roomError}</span>
            <button type="button" onClick={() => setRoomError('')} aria-label="Dismiss error">
              ✕
            </button>
          </div>
        )}

        {/* Public Rooms Grid */}
        <div className="rooms-selector-grid" data-testid="live-rooms-grid">
          {rooms.map((room) => {
            const isSelected = activeRoom?.id === room.id;
            return (
              <button
                key={room.id}
                type="button"
                className={`room-card-btn ${isSelected ? 'active' : ''}`}
                onClick={() => joinRoomById(room.id)}
                data-testid={`room-card-${room.id}`}
              >
                <div className="room-card-top">
                  <span className="room-card-name">{room.name}</span>
                  <span className="room-online-count tabular-nums">
                    {room.onlineCount || 0} online
                  </span>
                </div>
                <div className="room-card-meta tabular-nums">
                  <span>{room.pomodoro} min</span>
                  <span aria-hidden="true">·</span>
                  <span>{room.timer?.isRunning ? 'Running' : room.tag}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Room Detail Panel */}
        {activeRoom && (
          <div className="active-room-panel" data-testid="active-room-panel">
            <div className="active-room-header">
              <div className="active-room-title-block">
                <div>
                  <h3 className="active-room-heading" data-testid="active-room-heading">
                    {activeRoom.name}
                    {activeRoom.isPrivate && (
                      <span className="room-private-code-tag">{activeRoom.code}</span>
                    )}
                  </h3>
                  <span className="active-room-sub">
                    {activeRoom.ambience || 'Lofi Beats'} · {activeRoom.pomodoro} cadence
                  </span>
                </div>
              </div>

              <button
                type="button"
                className={`room-sync-timer-btn ${synced ? 'synced' : ''}`}
                onClick={handleSyncClick}
                title="Sync your personal Flowstate timer to this room"
                data-testid="room-sync-timer-btn"
              >
                {synced ? 'Synced to Timer' : 'Sync My Timer'}
              </button>
            </div>

            {/* Shared Authoritative Room Timer */}
            <div className="room-shared-timer-bar">
              <div className="room-shared-timer-left">
                <span className={`room-phase-label ${timerPhase === 'break' ? 'is-break' : ''}`}>
                  {timerPhase === 'focus' ? 'Focus' : 'Break'}
                </span>
                <span className="room-shared-countdown tabular-nums" data-testid="room-timer-countdown">
                  {formatCountdown(remainingSec)}
                </span>
                <span className="room-shared-meta">
                  {timerRunning
                    ? `Running${activeRoom.timer?.startedBy ? ` · started by ${activeRoom.timer.startedBy}` : ''}`
                    : 'Ready to start together'}
                </span>
              </div>
              <div className="room-shared-timer-actions">
                <button
                  type="button"
                  className="room-timer-btn room-timer-btn--primary"
                  onClick={() => sendWs({ type: timerRunning ? 'timer:pause' : 'timer:start' })}
                  data-testid="room-timer-toggle-btn"
                >
                  {timerRunning ? <IconPause size={13} /> : <IconPlay size={13} />}
                  <span>{timerRunning ? 'Pause' : 'Start Room'}</span>
                </button>
                <button
                  type="button"
                  className="room-timer-btn"
                  onClick={() => sendWs({ type: 'timer:reset' })}
                  title="Reset room timer"
                >
                  <IconRotateCcw size={13} />
                </button>
                <button
                  type="button"
                  className="room-timer-btn"
                  onClick={() => sendWs({ type: 'timer:switchPhase' })}
                  title="Switch between Focus and Break"
                >
                  {timerPhase === 'focus' ? 'Break' : 'Focus'}
                </button>
              </div>
            </div>

            {/* Active Members + Personal Focus Topic */}
            <div className="active-room-members-section">
              <div className="members-section-header">
                <span>
                  In this room ({activeRoom.members?.length || 1})
                </span>
                <form className="room-topic-form" onSubmit={handleTopicSubmit}>
                  <input
                    type="text"
                    value={myTopic}
                    onChange={(e) => setMyTopic(e.target.value)}
                    onBlur={handleTopicSubmit}
                    placeholder="What are you working on?"
                    maxLength={40}
                    aria-label="Your current study topic"
                  />
                </form>
              </div>

              <div className="members-chips-list">
                {(activeRoom.members || []).map((member) => {
                  const isYou = member.id === myMemberId;
                  const initial = (member.name || 'G').trim().charAt(0).toUpperCase();
                  return (
                    <div key={member.id} className={`member-chip ${isYou ? 'member-chip--you' : ''}`}>
                      <div className="member-avatar-box" style={{ borderColor: isYou ? '#f4f4f6' : 'rgba(255,255,255,0.18)' }}>
                        {member.photoURL ? (
                          <img src={member.photoURL} alt={member.name} className="member-img" referrerPolicy="no-referrer" />
                        ) : (
                          <span>{initial}</span>
                        )}
                      </div>
                      <div className="member-info">
                        <span className="member-name">
                          {member.name}
                          {isYou ? ' (You)' : ''}
                        </span>
                        <span className="member-status">{member.topic || member.status || 'In Flowstate'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Room Check-In Chat */}
            <div className="room-checkin-section">
              <div className="room-checkin-messages" data-testid="room-checkin-messages">
                {(!activeRoom.messages || activeRoom.messages.length === 0) ? (
                  <div className="room-checkin-empty">
                    Share what you are tackling this block — check-ins stay brief and supportive.
                  </div>
                ) : (
                  activeRoom.messages.map((m) => (
                    <div key={m.id} className="room-checkin-line">
                      <strong>{m.senderName}:</strong> <span>{m.text}</span>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>
              <form className="room-checkin-form" onSubmit={handleSendChat}>
                <input
                  type="text"
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  placeholder="Post a quick goal check-in..."
                  maxLength={180}
                  data-testid="room-checkin-input"
                />
                <button type="submit" disabled={!chatText.trim()} data-testid="room-checkin-send">
                  Send
                </button>
              </form>
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
        )}

        {/* Private Study Group Controls */}
        <div className="custom-room-footer">
          <form className="create-group-form" onSubmit={handleCreateGroup}>
            <span className="custom-room-label">Create a private room</span>
            <input
              type="text"
              className="custom-room-input"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Biology Finals"
              maxLength={32}
              data-testid="create-private-room-input"
            />
            <button type="submit" className="custom-room-submit-btn" data-testid="create-private-room-btn">
              Create
            </button>
          </form>

          <form className="custom-room-form" onSubmit={handleJoinCustom}>
            <span className="custom-room-label">Join with invite code</span>
            <input
              type="text"
              className="custom-room-input"
              value={customRoomCode}
              onChange={(e) => setCustomRoomCode(e.target.value.toUpperCase())}
              placeholder="e.g. BIOLO-492"
              maxLength={16}
              data-testid="join-private-room-input"
            />
            <button type="submit" className="custom-room-submit-btn" data-testid="join-private-room-btn">
              Join
            </button>
          </form>

          {activeRoom?.isPrivate && activeRoom?.code && (
            <button
              type="button"
              className="group-share-code"
              onClick={() => {
                navigator.clipboard?.writeText(activeRoom.code).catch(() => {});
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 2000);
              }}
              title="Copy private room invite code"
              data-testid="private-room-share-code"
            >
              Invite code <strong>{copiedCode ? 'COPIED!' : activeRoom.code}</strong> · {copiedCode ? 'copied to clipboard' : 'click to copy'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveRoomsModal;
