import React, { useRef, useState, useEffect } from 'react';
import PlayerSeat from './PlayerSeat';
import Card from './Card';

/**
 * RoundTable
 * Elegant oval felt poker table.
 * No human hands! Uses smooth card animations and prominent card highlights
 * so all players clearly see which cards are peeked, swapped, or matched.
 */
export default function RoundTable({
  players = [],
  myId,
  callerId,
  turn,
  isMyTurn,
  deckCount,
  discardTop,
  opp,
  pendingGive,
  knownCards,
  peekUntil,
  selectedCards,
  isSwapPowerActive,
  matchMode,
  animEvents = [],
  initialPeekSecondsLeft = 0,
  now = Date.now(),
  onCardClick,
  onDropCard,
  onDragCard,
  onDrawClick,
  onToggleMatch,
}) {
  const tableRef = useRef(null);
  const seatRefs = useRef({});
  const cardRefs = useRef({});
  const drawPileRef = useRef(null);
  const discardPileRef = useRef(null);

  // Active highlights on specific cards: { [cardId]: { type, label } }
  const [actionHighlights, setActionHighlights] = useState({});
  const [drawPileFlashing, setDrawPileFlashing] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  // Register DOM refs
  const registerSeatRef = (playerId, el) => {
    seatRefs.current[playerId] = el;
  };

  const registerCardRef = (playerId, cardIdx, cardId, el) => {
    if (!cardRefs.current[playerId]) cardRefs.current[playerId] = {};
    cardRefs.current[playerId][cardIdx] = { el, cardId };
  };

  // Organize seats so YOU are always at the bottom center (index 0)
  const myPlayer = players.find((p) => p.id === myId);
  const otherPlayers = players.filter((p) => p.id !== myId);

  const orderedSeats = [];
  if (myPlayer) orderedSeats.push({ player: myPlayer, isMe: true, seatIndex: 0 });
  otherPlayers.forEach((p, idx) => {
    orderedSeats.push({ player: p, isMe: false, seatIndex: idx + 1 });
  });

  // Calculate table positions for seats based on count
  const getSeatPositionClass = (seatIndex, total) => {
    if (seatIndex === 0) return 'seat-pos-bottom';
    if (total === 2) return 'seat-pos-top';
    if (total === 3) {
      if (seatIndex === 1) return 'seat-pos-top-left';
      return 'seat-pos-top-right';
    }
    if (total === 4) {
      if (seatIndex === 1) return 'seat-pos-left';
      if (seatIndex === 2) return 'seat-pos-top';
      return 'seat-pos-right';
    }
    if (total === 5) {
      if (seatIndex === 1) return 'seat-pos-mid-left';
      if (seatIndex === 2) return 'seat-pos-top-left';
      if (seatIndex === 3) return 'seat-pos-top-right';
      return 'seat-pos-mid-right';
    }
    const positions = [
      'seat-pos-bottom',
      'seat-pos-bottom-left',
      'seat-pos-top-left',
      'seat-pos-top',
      'seat-pos-top-right',
      'seat-pos-bottom-right',
    ];
    return positions[seatIndex] || 'seat-pos-top';
  };

  // Helper to find cardId by owner ID and index
  const getCardIdAt = (ownerId, idx) => {
    const owner = players.find((p) => p.id === ownerId);
    if (owner && owner.cards && owner.cards[idx]) {
      return owner.cards[idx].id;
    }
    const refData = cardRefs.current[ownerId] && cardRefs.current[ownerId][idx];
    return refData?.cardId || null;
  };

  // Process animation events to highlight cards with smooth animations
  useEffect(() => {
    if (!animEvents || animEvents.length === 0) return;
    const latest = animEvents[animEvents.length - 1];
    if (!latest || latest._handled) return;
    latest._handled = true;

    if (latest.type === 'replace' || latest.type === 'discard') {
      const verb = latest.type === 'replace' ? 'replaced a card' : 'discarded a card';
      setActionNotice(`${latest.actorName || 'A player'} ${verb}`);
      setTimeout(() => setActionNotice(''), 4000);
    }

    // 1. Draw action
    if (latest.type === 'draw') {
      setDrawPileFlashing(true);
      setTimeout(() => setDrawPileFlashing(false), 1200);
      return;
    }

    // 2. Swap action: highlight BOTH cards with slow, smooth swap animation!
    if (latest.type === 'swap') {
      const ownCardId = getCardIdAt(latest.actorId, latest.ownIdx != null ? latest.ownIdx : 0);
      const otherCardId = getCardIdAt(latest.targetId, latest.otherIdx != null ? latest.otherIdx : 0);
      const newHl = {};
      if (ownCardId) newHl[ownCardId] = { type: 'swap', label: '🔀 Swapping' };
      if (otherCardId) newHl[otherCardId] = { type: 'swap', label: '🔀 Swapping' };

      if (Object.keys(newHl).length > 0) {
        setActionHighlights((prev) => ({ ...prev, ...newHl }));
        setTimeout(() => {
          setActionHighlights((prev) => {
            const next = { ...prev };
            if (ownCardId) delete next[ownCardId];
            if (otherCardId) delete next[otherCardId];
            return next;
          });
        }, 2200);
      }
      return;
    }

    // 3. Peek actions: highlight the specific peeked card for all players!
    if (latest.type === 'peek_other' || latest.type === 'peek_own') {
      const targetOwner = latest.targetId || latest.actorId;
      const targetCardId = getCardIdAt(targetOwner, latest.cardIdx != null ? latest.cardIdx : 0);
      if (targetCardId) {
        const actorName = latest.actorName || 'Player';
        setActionHighlights((prev) => ({
          ...prev,
          [targetCardId]: { type: 'peek', label: `👁️ ${actorName} Peeking` },
        }));
        setTimeout(() => {
          setActionHighlights((prev) => {
            const next = { ...prev };
            delete next[targetCardId];
            return next;
          });
        }, 2500);
      }
      return;
    }

    // 4. King Peek Both
    if (latest.type === 'peek_both') {
      const ownCardId = getCardIdAt(latest.actorId, latest.ownIdx != null ? latest.ownIdx : 0);
      const otherCardId = getCardIdAt(latest.targetId, latest.otherIdx != null ? latest.otherIdx : 0);
      const actorName = latest.actorName || 'Player';
      const newHl = {};
      if (ownCardId) newHl[ownCardId] = { type: 'peek', label: `👁️ ${actorName}` };
      if (otherCardId) newHl[otherCardId] = { type: 'peek', label: `👁️ ${actorName}` };

      if (Object.keys(newHl).length > 0) {
        setActionHighlights((prev) => ({ ...prev, ...newHl }));
        setTimeout(() => {
          setActionHighlights((prev) => {
            const next = { ...prev };
            if (ownCardId) delete next[ownCardId];
            if (otherCardId) delete next[otherCardId];
            return next;
          });
        }, 2500);
      }
      return;
    }

    // 5. Match action
    if (latest.type === 'match') {
      const targetCardId = getCardIdAt(latest.targetId || latest.actorId, latest.cardIdx != null ? latest.cardIdx : 0);
      if (targetCardId) {
        setActionHighlights((prev) => ({
          ...prev,
          [targetCardId]: { type: 'match', label: '🎯 Matched!' },
        }));
        setTimeout(() => {
          setActionHighlights((prev) => {
            const next = { ...prev };
            delete next[targetCardId];
            return next;
          });
        }, 1800);
      }
      return;
    }

    // 6. Fumble action
    if (latest.type === 'fumble') {
      const targetCardId = getCardIdAt(latest.targetId || latest.actorId, latest.cardIdx != null ? latest.cardIdx : 0);
      if (targetCardId) {
        setActionHighlights((prev) => ({
          ...prev,
          [targetCardId]: { type: 'fumble', label: '💥 Fumble!' },
        }));
        setTimeout(() => {
          setActionHighlights((prev) => {
            const next = { ...prev };
            delete next[targetCardId];
            return next;
          });
        }, 2000);
      }
      return;
    }

    // 7. Replace action
    if (latest.type === 'replace') {
      const targetCardId = latest.cardId || getCardIdAt(latest.actorId, latest.cardIdx != null ? latest.cardIdx : 0);
      if (targetCardId) {
        setActionHighlights((prev) => ({
          ...prev,
          [targetCardId]: { type: 'replace', label: '🔄 Replaced' },
        }));
        setTimeout(() => {
          setActionHighlights((prev) => {
            const next = { ...prev };
            delete next[targetCardId];
            return next;
          });
        }, 4000);
      }
    }
  }, [animEvents, players]);

  const canDraw = isMyTurn && turn?.phase === 'draw';
  const isMatchOpen = opp && opp.state === 'open';
  const caboCaller = players.find((p) => p.id === callerId);

  return (
    <div className="table-viewport">
      {/* Oval Felt Poker Table */}
      <div ref={tableRef} className="cabo-felt-table">
        <div className="table-felt-inner">
          <div className="table-felt-ring" />

          {/* Center Table Area (Piles & Notifications) */}
          <div className="table-center-hub">
            {actionNotice && <div className="table-action-notice">{actionNotice}</div>}
            {/* CABO Notification Banner in center */}
            {caboCaller && (
              <div className="table-center-cabo-banner">
                <div className="cabo-banner-badge">🚨 CABO CALLED</div>
                <div className="cabo-banner-main">
                  <span className="cabo-caller-name">{caboCaller.name.toUpperCase()}</span>
                  <span className="cabo-banner-desc">CALLED CABO · CARDS LOCKED · FINAL ROUND</span>
                </div>
              </div>
            )}

            {/* Match Window Banner in center */}
            {isMatchOpen && (
              <div className="table-center-match-banner">
                <div className="match-info">
                  <span className="match-bolt">⚡</span>
                  <span>
                    MATCH VALUE: <strong className="match-val">{opp.value}</strong>
                  </span>
                </div>
                {onToggleMatch && (
                  <button
                    className={`btn-primary match-table-btn ${matchMode ? 'active' : ''}`}
                    onClick={onToggleMatch}
                  >
                    {matchMode ? '❌ Cancel' : '⚡ Match Discard'}
                  </button>
                )}
              </div>
            )}

            {/* Piles Container */}
            <div className="table-piles-row">
              {/* Draw Pile */}
              <div
                ref={drawPileRef}
                className={`table-pile draw ${canDraw ? 'can-draw' : ''} ${drawPileFlashing ? 'pile-flashing' : ''}`}
                onClick={onDrawClick}
                title={canDraw ? 'Click to draw a card' : 'Draw Deck'}
              >
                <div className="pile-card-stack">
                  <Card isBig isGlow={canDraw || drawPileFlashing} />
                </div>
                <div className="pile-label">
                  Draw Deck ({deckCount})
                  {canDraw && <span className="draw-hint">Click to draw!</span>}
                </div>
              </div>

              {/* Discard Pile */}
              <div ref={discardPileRef} className="table-pile discard">
                <div className="pile-card-stack">
                  {discardTop ? <Card card={discardTop} isBig /> : <Card isEmpty isBig />}
                </div>
                <div className="pile-label">Discard Pile</div>
              </div>
            </div>
          </div>

          {/* Seats Placed Around Table Perimeter */}
          {orderedSeats.map(({ player, isMe, seatIndex }) => {
            const posClass = getSeatPositionClass(seatIndex, orderedSeats.length);

            return (
              <div key={player.id} className={`seat-anchor ${posClass}`}>
                <PlayerSeat
                  player={player}
                  isMe={isMe}
                  seatIndex={seatIndex}
                  seatPosition={posClass}
                  isCurrentTurn={turn?.playerId === player.id}
                  isCaboCaller={callerId === player.id}
                  knownCards={knownCards}
                  peekUntil={peekUntil}
                  selectedCards={selectedCards}
                  isSwapPower={isSwapPowerActive}
                  isMatchMode={matchMode}
                  pendingGive={pendingGive}
                  myPlayerId={myId}
                  turn={turn}
                  isMyTurn={isMyTurn}
                  initialPeekSecondsLeft={initialPeekSecondsLeft}
                  now={now}
                  actionHighlights={actionHighlights}
                  onCardClick={onCardClick}
                  onDragCard={onDragCard}
                  onDropCard={onDropCard}
                  registerCardRef={registerCardRef}
                  registerSeatRef={registerSeatRef}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
