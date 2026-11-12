import React from 'react';
import Card from './Card';

/**
 * Computes which powerTarget class each card in a panel should get,
 * based on the current turn phase/power, whose turn it is, and whether this panel is "me".
 *
 * Returns null if no power targeting active, or one of the POWER_TARGET_STYLES keys.
 */
function getPowerTarget({ isMe, isCaboCaller, turn, myId, isMyTurn, selectedCards, isMatchMode, pendingGive, myPlayerId }) {
  // Give mode: my own cards get 'give' highlight
  if (pendingGive && pendingGive.from === myPlayerId) {
    return isMe ? 'give' : null;
  }
  if (!isMyTurn || !turn) return null;
  const phase = turn.phase;
  const power = turn.power;
  const stage = turn.stage;

  if (phase === 'power') {
    if (power === 'own') return isMe ? 'own' : null;
    if (power === 'other') return !isMe ? 'other' : null;
    if (power === 'jack') {
      if (isCaboCaller && !isMe) return null; // CABO locked
      return isMe ? 'jack_own' : 'jack_other';
    }
    if (power === 'queen') {
      if (stage === 0) return !isMe ? 'queen_other' : null;
      if (stage === 1) {
        if (isCaboCaller && !isMe) return null; // CABO locked
        return isMe ? 'queen_own' : null;
      }
    }
    if (power === 'king') {
      if (stage === 0) {
        if (isMe) return 'king_own';
        return 'king_other';
      }
      // stage 1: no more targeting, just confirm swap
      return null;
    }
  }
  return null;
}

export default function PlayerPanel({
  player,
  isMe,
  isCurrentTurn,
  isCaboCaller,
  knownCards = {},
  peekUntil = {},
  selectedCards = {},
  isSwapPower = false,
  isMatchMode = false,
  pendingGive = null,
  myPlayerId = null,
  turn = null,
  isMyTurn = false,
  animatingCards = {},  // map of cardId -> anim type
  onCardClick,
  onDragCard,
  onDropCard,
}) {
  const cards = player.cards || [];
  const topRow = cards.slice(0, 2);
  const botRow = cards.slice(2, 4);
  const extraCards = cards.slice(4);

  const now = Date.now();

  const getPeekFace = (card) => {
    if (!card) return null;
    if (card.rank) return card; // Server revealed it (e.g. game over)
    const k = knownCards[card.id];
    if (!k) return null;
    // ONLY show face if currently in an active peek window (initial 10s or power 5s)
    if ((peekUntil[card.id] || 0) > now) {
      return k;
    }
    return null;
  };

  const isCardSelected = (cardId) => {
    return selectedCards.own === cardId || selectedCards.other === cardId;
  };

  const isPlayerLocked = isCaboCaller && !isMe;

  // Compute power target for each card in this panel
  const powerTargetForCard = (card) => {
    if (isMatchMode) return null; // Match mode takes priority, handled by isMatchTarget
    const basePT = getPowerTarget({ isMe, isCaboCaller, turn, isMyTurn, selectedCards, isMatchMode, pendingGive, myPlayerId });
    if (!basePT) return null;
    // For king stage 0, only the SELECTED own/other gets highlighted differently
    return basePT;
  };

  const renderCard = (c) => {
    const pt = powerTargetForCard(c);
    return (
      <Card
        key={c.id}
        card={c}
        peekFace={getPeekFace(c)}
        isBig={isMe}
        isSelected={isCardSelected(c.id)}
        isLocked={isPlayerLocked}
        isMatchTarget={isMatchMode && !isPlayerLocked}
        powerTarget={pt}
        animating={animatingCards[c.id] || null}
        draggable={isMe && isSwapPower}
        onDragStart={(e) => {
          if (isMe && isSwapPower) {
            e.dataTransfer.setData('text/plain', c.id);
            onDragCard && onDragCard(c.id);
          }
        }}
        onDragOver={(e) => {
          if (!isMe && isSwapPower) e.preventDefault();
        }}
        onDrop={(e) => {
          if (!isMe && isSwapPower) {
            e.preventDefault();
            const fromId = e.dataTransfer.getData('text/plain');
            onDropCard && onDropCard(fromId, c.id, player.id);
          }
        }}
        onClick={() => onCardClick(player.id, c.id)}
      />
    );
  };

  return (
    <div
      className={`glass-panel p-3 text-center transition-all ${
        isCurrentTurn ? 'ring-2 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.35)]' : ''
      } ${isMe ? 'max-w-sm mx-auto mt-4' : 'min-w-[170px]'}`}
      style={{
        border: isCurrentTurn ? '2px solid #fbbf24' : '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        padding: '12px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          fontWeight: 800,
          fontSize: '15px',
          marginBottom: '8px',
          flexWrap: 'wrap',
        }}
      >
        <span>
          {player.name} {isMe && '(You)'}
        </span>
        {isCaboCaller && (
          <span
            style={{
              background: '#dc2626',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '6px',
              boxShadow: '0 0 10px rgba(220, 38, 38, 0.6)',
            }}
          >
            🔒 CABO
          </span>
        )}
        {!player.connected && (
          <span
            style={{
              background: '#64748b',
              color: '#fff',
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '6px',
            }}
          >
            Offline
          </span>
        )}
      </div>

      {/* Hand layout (2x2) */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {isMe && (
          <div style={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.7, marginBottom: 2 }}>
            Top Row (Unknown)
          </div>
        )}
        <div className="hand-grid">
          {topRow.map((c) => renderCard(c))}
        </div>

        {isMe && (
          <div style={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.7, margin: '6px 0 2px' }}>
            Bottom Row (Memorized at start)
          </div>
        )}
        <div className="hand-grid" style={{ marginTop: isMe ? 0 : '4px' }}>
          {botRow.map((c) => renderCard(c))}
        </div>

        {/* Penalty / extra cards */}
        {extraCards.length > 0 && (
          <>
            {isMe && (
              <div style={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.7, margin: '6px 0 2px' }}>
                Penalty Cards
              </div>
            )}
            <div className="hand-extras">
              {extraCards.map((c) => renderCard(c))}
            </div>
          </>
        )}
      </div>

      {/* Score */}
      {player.score != null && (
        <div style={{ marginTop: '8px', fontWeight: 800, color: '#fde047', fontSize: '14px' }}>
          Round Score: {player.score}
        </div>
      )}
    </div>
  );
}
