import React from 'react';
import { getCardSvg } from '../utils/cardAssets';
import { POWER_TEXT, powerForRank, isRedCard } from '../utils/constants';
import { RefreshCw, Trash2, X } from 'lucide-react';

function getCardPointsBadge(card) {
  if (!card || !card.rank) return null;
  const isRed = isRedCard(card.suit);
  if (card.rank === 'K') {
    return isRed ? { text: '-1 PTS', className: 'red' } : { text: '13 PTS', className: 'black' };
  }
  if (card.rank === 'A') return { text: '1 PT', className: 'neutral' };
  if (card.rank === 'J' || card.rank === 'Q') return { text: '10 PTS', className: 'neutral' };
  const val = parseInt(card.rank, 10);
  if (!isNaN(val)) return { text: `${val} PTS`, className: 'neutral' };
  return null;
}

/**
 * InspectCardModal
 * High-resolution floating vector card inspection overlay.
 * Supports:
 * 1. Dual-card side-by-side view for initial 10-second memorization (Card 1 & Card 2) -> Centered.
 * 2. Single-card view for drawn card inspection or secret power peeking -> Docked at RIGHT side in empty space,
 *    ensuring the center action buttons ("Replace One of My Cards", "Discard Drawn Card") are 100% visible and accessible!
 */
export default function InspectCardModal({
  card,
  cards,
  label,
  secondsLeft,
  onPutDown,
  isDrawnCard = false,
  isReplacing = false,
  onStartReplace,
  onCancelReplace,
  onDiscardDrawn,
}) {
  const displayCards = cards && cards.length > 0 ? cards : card ? [card] : [];
  if (displayCards.length === 0) return null;

  const isDual = displayCards.length > 1;

  // Dual card initial memorization is centered; single card / drawn card is docked on the right side
  const dockClass = isDual ? 'dock-center' : 'dock-right';

  return (
    <div className={`inspect-card-overlay ${dockClass}`}>
      <div className={`inspect-card-dialog ${isDual ? 'dialog-dual' : 'dialog-single'} ${isDrawnCard ? 'dialog-drawn' : ''}`}>
        {/* Retro Header Section */}
        <div className="inspect-dialog-header">
          <div className="inspect-assignment-tag">
            {isDual ? 'YOUR INITIAL ASSIGNMENT' : isDrawnCard ? 'YOUR TURN' : 'SECRET PEEK'}
          </div>
          <div className="inspect-main-title">
            <span>
              {isDrawnCard
                ? '🎴 DRAWN CARD'
                : label || (isDual ? 'MEMORIZE TWO CARDS' : 'SECRET PEEK')}
            </span>
            {secondsLeft != null && secondsLeft > 0 && (
              <span className="inspect-timer-chip">
                {secondsLeft}s
              </span>
            )}
          </div>
          <div className="inspect-subtext">
            {isDual
              ? 'Ten seconds to memorize both cards. They will remain hidden for the rest of the game.'
              : isDrawnCard
              ? 'Choose Replace or Discard in the buttons below or center bar:'
              : 'Keep this value in mind. No cards are shown publicly during the round.'}
          </div>
          {onPutDown && !isDrawnCard && (
            <button className="inspect-close-x" onClick={onPutDown} title="Close">
              ✕
            </button>
          )}
        </div>

        {/* Card Frames (1 on the right, or 2 centered side-by-side) */}
        <div className={`inspect-cards-grid ${isDual ? 'grid-dual' : 'grid-single'}`}>
          {displayCards.map((c, i) => {
            if (!c || !c.rank) return null;
            const svgSrc = getCardSvg(c.rank, c.suit);
            const power = powerForRank(c.rank);
            const ptBadge = getCardPointsBadge(c);
            const slotName = c.ownerName || (i === 0 ? 'CARD 1' : 'CARD 2');

            return (
              <div key={c.id || i} className="inspect-card-column">
                {isDual && <div className="inspect-slot-label">{slotName}</div>}

                <div className="inspect-card-frame">
                  <img
                    src={svgSrc}
                    alt={`${c.rank} of ${c.suit}`}
                    className="inspect-card-svg"
                    draggable={false}
                  />

                  {ptBadge && (
                    <span className={`inspect-special-badge ${ptBadge.className}`}>
                      {ptBadge.text}
                    </span>
                  )}
                </div>

                {power && (
                  <div className="inspect-power-pill">
                    ⚡ {POWER_TEXT[power]}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Drawn Card Quick Action Buttons (Available right on the dock, in addition to center ActionBar) */}
        {isDrawnCard && (
          <div className="inspect-drawn-actions">
            {isReplacing ? (
              <div className="inspect-replacing-box">
                <div className="inspect-replacing-msg">
                  🔄 Click one of your cards on the table to replace!
                </div>
                {onCancelReplace && (
                  <button className="btn-ghost inspect-mini-btn" onClick={onCancelReplace}>
                    <X size={14} /> Cancel Replace
                  </button>
                )}
              </div>
            ) : (
              <div className="inspect-btn-row">
                {onStartReplace && (
                  <button className="inspect-action-btn replace" onClick={onStartReplace}>
                    <RefreshCw size={14} /> Replace
                  </button>
                )}
                {onDiscardDrawn && (
                  <button className="inspect-action-btn discard" onClick={onDiscardDrawn}>
                    <Trash2 size={14} /> Discard
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer Action Button for Initial Memorization or Secret Peek */}
        {!isDrawnCard && onPutDown && (
          <div className="inspect-actions-footer">
            <button className="btn-retro-action" onClick={onPutDown}>
              <span>{isDual ? "I'VE MEMORIZED BOTH CARDS" : 'PUT CARD DOWN'}</span>
              <span className="retro-arrow">→</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
