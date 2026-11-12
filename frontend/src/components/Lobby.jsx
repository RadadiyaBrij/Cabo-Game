import React, { useState } from 'react';
import { Volume2, VolumeX, BookOpen, Copy, Check, Users, Play, LogOut, Settings } from 'lucide-react';

export default function Lobby({
  roomState,
  playerName,
  setPlayerName,
  roomCodeInput,
  setRoomCodeInput,
  serverUrl,
  setServerUrl,
  soundEnabled,
  onToggleSound,
  onOpenRules,
  onCreateRoom,
  onJoinRoom,
  onStartGame,
  onLeaveRoom,
  onUpdateSettings,
}) {
  const [copied, setCopied] = useState(false);
  const [showServerConfig, setShowServerConfig] = useState(false);

  const handleCopyLink = () => {
    if (!roomState?.code) return;
    const link = `${window.location.origin}/?room=${roomState.code}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // If in lobby phase of an active room
  if (roomState && roomState.phase === 'lobby') {
    const isHost = roomState.hostId === roomState.you;
    return (
      <div style={{ maxWidth: '580px', margin: '0 auto', paddingTop: '20px' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🃏</span> CABO Room
          </h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-ghost" onClick={onOpenRules}>
              <BookOpen size={16} /> Rules
            </button>
            <button className="btn-ghost" onClick={onToggleSound}>
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button className="btn-ghost" onClick={onLeaveRoom}>
              <LogOut size={16} /> Leave
            </button>
          </div>
        </div>

        {/* Room Code Card */}
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', marginBottom: '16px' }}>
          <div className="retro-assignment-tag">YOUR TABLE ASSIGNMENT</div>
          <div
            className="retro-headline"
            style={{
              fontSize: '44px',
              letterSpacing: '6px',
              color: '#fde047',
              margin: '8px 0 12px',
              textShadow: '0 0 24px rgba(253, 224, 71, 0.4)',
            }}
          >
            ROOM {roomState.code}
          </div>

          {/* 3-stat counter box (Matching photo layout) */}
          <div className="retro-stat-box">
            <div className="retro-stat-item">
              <div className="retro-stat-num">{roomState.players?.length || 0}</div>
              <div className="retro-stat-label">Players</div>
            </div>
            <div className="retro-stat-item">
              <div className="retro-stat-num">4</div>
              <div className="retro-stat-label">Cards / Hand</div>
            </div>
            <div className="retro-stat-item">
              <div className="retro-stat-num">10s</div>
              <div className="retro-stat-label">Peek Time</div>
            </div>
          </div>

          <button className="btn-retro-action" onClick={handleCopyLink} style={{ margin: '8px 0 0' }}>
            <span>{copied ? '✓ INVITE LINK COPIED' : 'COPY INVITE LINK'}</span>
            <span className="retro-arrow">→</span>
          </button>
        </div>

        {/* Players Card */}
        <div className="glass-panel" style={{ padding: '18px', marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={18} /> Players in Room ({roomState.players?.length || 0}/8)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {roomState.players?.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.08)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700 }}>{p.name}</span>
                  {p.id === roomState.hostId && (
                    <span style={{ background: '#f59e0b', color: '#0f172a', fontSize: '11px', fontWeight: 800, padding: '1px 6px', borderRadius: '4px' }}>
                      👑 Host
                    </span>
                  )}
                  {p.id === roomState.you && (
                    <span style={{ background: 'rgba(255,255,255,0.2)', fontSize: '11px', padding: '1px 6px', borderRadius: '4px' }}>
                      You
                    </span>
                  )}
                </div>
                {!p.connected && (
                  <span style={{ color: '#94a3b8', fontSize: '12px' }}>Offline</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Settings Card */}
        <div className="glass-panel" style={{ padding: '18px', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Game Settings</h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: isHost ? 'pointer' : 'default', fontSize: '14px' }}>
            <input
              type="checkbox"
              checked={roomState.settings?.aid}
              disabled={!isHost}
              onChange={(e) => onUpdateSettings({ aid: e.target.checked })}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span>
              <strong>Memory Aid:</strong> Keep showing cards you have seen (Untick for hard mode: cards vanish after 6 seconds)
            </span>
          </label>
        </div>

        {/* Start Game */}
        {isHost ? (
          <button
            className="btn-retro-action"
            style={{ background: '#f59e0b', color: '#09090b', borderColor: '#f59e0b', marginTop: '10px' }}
            onClick={onStartGame}
          >
            <span>START GAME NOW</span>
            <span className="retro-arrow">→</span>
          </button>
        ) : (
          <p style={{ textAlign: 'center', opacity: 0.8, fontSize: '14px' }}>
            Waiting for the host to start the game...
          </p>
        )}
      </div>
    );
  }

  // Not in a room: Home Lobby Screen
  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', paddingTop: '30px' }}>
      {/* Brand Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <div className="retro-assignment-tag">CARD GAME ENGINE</div>
          <h1 style={{ margin: '2px 0 0 0', fontSize: '32px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🃏</span> CABO ONLINE
          </h1>
          <p style={{ margin: '4px 0 0 0', opacity: 0.8, fontSize: '14px' }}>
            Lowest total score wins. Play with friends anywhere.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-ghost" onClick={onOpenRules} title="Game Rules">
            <BookOpen size={18} />
          </button>
          <button className="btn-ghost" onClick={onToggleSound} title="Toggle Sound">
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      </div>

      {/* 3-stat counter box from photo */}
      <div className="retro-stat-box" style={{ margin: '10px 0 20px' }}>
        <div className="retro-stat-item">
          <div className="retro-stat-num">52</div>
          <div className="retro-stat-label">Vector Cards</div>
        </div>
        <div className="retro-stat-item">
          <div className="retro-stat-num">2-8</div>
          <div className="retro-stat-label">Players</div>
        </div>
        <div className="retro-stat-item">
          <div className="retro-stat-num">10s</div>
          <div className="retro-stat-label">Initial Peek</div>
        </div>
      </div>

      {/* 1. Name Input */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
          Your Name
        </label>
        <input
          type="text"
          value={playerName}
          maxLength={16}
          placeholder="Enter player name"
          onChange={(e) => setPlayerName(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 14px',
            fontSize: '16px',
            fontWeight: 700,
            borderRadius: '10px',
            border: 'none',
          }}
        />
      </div>

      {/* 2. Create Room */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '16px' }}>
        <div className="retro-assignment-tag">HOST A TABLE</div>
        <h3 style={{ margin: '2px 0 6px 0', fontSize: '18px', fontWeight: 900 }}>Create a New Game</h3>
        <p style={{ margin: '0 0 14px 0', fontSize: '13px', opacity: 0.8 }}>
          Host a private table for 2 to 8 players.
        </p>
        <button className="btn-retro-action" onClick={onCreateRoom}>
          <span>CREATE NEW ROOM</span>
          <span className="retro-arrow">→</span>
        </button>
      </div>

      {/* 3. Join Room */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <div className="retro-assignment-tag">ENTER CODE</div>
        <h3 style={{ margin: '2px 0 6px 0', fontSize: '18px', fontWeight: 900 }}>Join an Existing Room</h3>
        <p style={{ margin: '0 0 12px 0', fontSize: '13px', opacity: 0.8 }}>
          Enter the 4-letter room code shared by your friend.
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={roomCodeInput}
            maxLength={4}
            placeholder="ROOM"
            onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
            style={{
              width: '130px',
              textAlign: 'center',
              fontSize: '18px',
              fontWeight: 900,
              letterSpacing: '3px',
              padding: '10px',
              borderRadius: '6px',
              border: 'none',
              textTransform: 'uppercase',
            }}
          />
          <button className="btn-retro-action" style={{ width: 'auto', flex: 1 }} onClick={onJoinRoom}>
            <span>JOIN ROOM</span>
            <span className="retro-arrow">→</span>
          </button>
        </div>
      </div>

      {/* Backend Server Configuration (Collapsible) */}
      <div style={{ textAlign: 'center', marginTop: '14px' }}>
        <button
          className="btn-ghost"
          style={{ fontSize: '12px', opacity: 0.7 }}
          onClick={() => setShowServerConfig(!showServerConfig)}
        >
          <Settings size={14} /> Server: {serverUrl}
        </button>

        {showServerConfig && (
          <div className="glass-panel" style={{ padding: '14px', marginTop: '10px', textAlign: 'left' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
              Backend Server URL (for Vercel deployment)
            </label>
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="e.g. https://cabo-game.onrender.com"
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: '13px',
                borderRadius: '8px',
                border: 'none',
                marginBottom: '6px',
              }}
            />
            <div style={{ fontSize: '11px', opacity: 0.75 }}>
              When deployed to Vercel, connect this frontend to your hosted Node.js server (e.g. on Render, Railway, or VPS).
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

