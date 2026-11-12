import React, { useRef, useEffect } from 'react';
import Card from './Card';

/**
 * Computes powerTarget based on rules and power phase.
 */
function getPowerTarget({ isMe, isCaboCaller, turn, isMyTurn, isMatchMode, pendingGive, myPlayerId }) {
  if (pendingGive && pendingGive.from === myPlayerId) {
    return isMe ? 'give' : null;
  }
  if (!isMyTurn || !turn) return null;
  const { phase, power, stage } = turn;

  if (phase === 'power') {
    if (power === 'own') return isMe ? 'own' : null;
    if (power === 'other') return !isMe ? 'other' : null;
    if (power === 'jack') {
      if (isCaboCaller && !isMe) return null;
      return isMe ? 'jack_own' : 'jack_other';
    }
    if (power === 'queen') {
      if (stage === 0) return !isMe ? 'queen_other' : null;
      if (stage === 1) {
        if (isCaboCaller && !isMe) return null;
        return isMe ? 'queen_own' : null;
      }
    }
    if (power === 'king') {
      if (stage === 0) {
        return isMe ? 'king_own' : 'king_other';
      }
      return null;
    }
  }
  return null;
}

export default function PlayerSeat({
  player,
  isMe,
  seatIndex = 0,
  seatPosition = '',
  isCurrentTurn = false,
  isCaboCaller = false,
  knownCards = {},
  peekUntil = {},
  selectedCards = {},
  isSwapPower = false,
  isMatchMode = false,
  pendingGive = null,
  myPlayerId = null,
  turn = null,
  isMyTurn = false,
  initialPeekSecondsLeft = 0,
  now: propNow = null,
  actionHighlights = {}, // map of cardId -> { type: 'swap'|'peek'|'match'|'fumble', label: string }
  onCardClick,
  onDragCard,
  onDropCard,
  registerCardRef,
  registerSeatRef,
}) {
  const cards = player.cards || [];
  // Server-owned slot positions keep replacement cards in the exact position
  // of the card they replace, while cards removed from a hand leave a gap.
  const slotByCardId = useRef({});
  const occupiedSlots = new Set();
  cards.forEach((card) => {
    const slot = Number.isInteger(card.slot) ? card.slot : slotByCardId.current[card.id];
    if (Number.isInteger(slot)) occupiedSlots.add(slot);
  });
  let nextSlot = 0;
  const positionedCards = cards.map((card, idx) => {
    let slot = Number.isInteger(card.slot) ? card.slot : slotByCardId.current[card.id];
    if (!Number.isInteger(slot)) {
      while (occupiedSlots.has(nextSlot)) nextSlot += 1;
      slot = nextSlot;
      occupiedSlots.add(slot);
      nextSlot += 1;
      slotByCardId.current[card.id] = slot;
    }
    return { card, idx, slot };
  });

  const seatRef = useRef(null);

  useEffect(() => {
    if (registerSeatRef && seatRef.current) {
      registerSeatRef(player.id, seatRef.current);
    }
  }, [registerSeatRef, player.id]);

  const now = propNow || Date.now();

  const getPeekFace = (card, idx) => {
    if (!card) return null;
    if (card.rank) return card;
    const k = knownCards[card.id];
    if (!k) return null;
    // During initial memorization window, local player's bottom two cards (idx 2 & 3) are always visible
    if (isMe && initialPeekSecondsLeft > 0 && (idx === 2 || idx === 3)) return k;
    if ((peekUntil[card.id] || 0) > now) return k;
    return null;
  };

  const isCardSelected = (cardId) => {
    return selectedCards.own === cardId || selectedCards.other === cardId;
  };

  const isPlayerLocked = isCaboCaller && !isMe;

  const pt = isMatchMode
    ? null
    : getPowerTarget({
        isMe,
        isCaboCaller,
        turn,
        isMyTurn,
        isMatchMode,
        pendingGive,
        myPlayerId,
      });

  const renderCard = (c, idx, slot) => {
    // Check if this card is one of the 2 bottom cards during initial memorization
    const isMemorizeCard = isMe && initialPeekSecondsLeft > 0 && (idx === 2 || idx === 3);
    const hl = actionHighlights[c.id] || (isMemorizeCard ? { type: 'memorize', label: '🧠 MEMORIZE' } : null);

    return (
      <div
        key={c.id}
        ref={(el) => {
          if (registerCardRef && el) registerCardRef(player.id, idx, c.id, el);
        }}
        className={`seat-card-slot ${hl ? `slot-${hl.type}` : ''}`}
        style={{ gridColumn: (slot % 2) + 1, gridRow: Math.floor(slot / 2) + 1 }}
      >
        <Card
          card={c}
          peekFace={getPeekFace(c, idx)}
          isBig={isMe}
          isSelected={isCardSelected(c.id)}
          isLocked={isPlayerLocked}
          isMatchTarget={isMatchMode && !isPlayerLocked}
          powerTarget={pt}
          actionHighlight={hl?.type || null}
          highlightLabel={hl?.label || null}
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
      </div>
    );
  };

  return (
    <div
      ref={seatRef}
      className={`table-seat ${isMe ? 'seat-me' : 'seat-opponent'} ${seatPosition} ${
        isCurrentTurn ? 'turn-active' : ''
      }`}
    >
      {/* Player badge / info chip */}
      <div className="seat-badge">
        <span className="seat-name">
          {player.name} {isMe && '(You)'}
        </span>
        <span className="seat-score">
          {player.total} pts {player.wins > 0 ? `· ${player.wins}🏆` : ''}
        </span>
        {isCaboCaller && <span className="seat-cabo-tag">🔒 CABO</span>}
        {!player.connected && <span className="seat-offline-tag">Offline</span>}
      </div>

      {/* Fixed 2-column slots keep each card in place when neighboring cards leave. */}
      <div className="seat-hand-grid">
        {positionedCards.map(({ card, idx, slot }) => renderCard(card, idx, slot))}
      </div>

      {/* Round score if over */}
      {player.score != null && (
        <div className="seat-round-score">Round: {player.score} pts</div>
      )}
    </div>
  );
}
