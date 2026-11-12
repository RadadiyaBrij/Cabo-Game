import React from 'react';
import { getCardSvg, getCardBackSvg } from '../utils/cardAssets';
import { isRedCard } from '../utils/constants';

/**
 * powerTarget: null | 'own' | 'other' | 'jack_own' | 'jack_other' | 'queen_other' | 'queen_own' | 'king_own' | 'king_other' | 'give'
 * Highlight styles so players visually understand what cards they can interact with.
 */
const POWER_TARGET_STYLES = {
  own:         { outline: '3px solid #a78bfa', shadow: '0 0 20px rgba(167,139,250,0.85)', label: '👁️ Peek', labelBg: '#7c3aed' },
  other:       { outline: '3px solid #fb923c', shadow: '0 0 20px rgba(251,146,60,0.85)',  label: '🕵️ Peek', labelBg: '#ea580c' },
  jack_own:    { outline: '3px solid #38bdf8', shadow: '0 0 20px rgba(56,189,248,0.80)',  label: '🔀 Swap', labelBg: '#0284c7' },
  jack_other:  { outline: '3px solid #f472b6', shadow: '0 0 20px rgba(244,114,182,0.85)', label: '🔀 Swap', labelBg: '#db2777' },
  queen_other: { outline: '3px solid #fb923c', shadow: '0 0 20px rgba(251,146,60,0.85)',  label: '🔍 Peek', labelBg: '#ea580c' },
  queen_own:   { outline: '3px solid #34d399', shadow: '0 0 20px rgba(52,211,153,0.85)',  label: '🔄 Swap?', labelBg: '#059669' },
  king_own:    { outline: '3px solid #a78bfa', shadow: '0 0 20px rgba(167,139,250,0.85)', label: '👁️ Select', labelBg: '#7c3aed' },
  king_other:  { outline: '3px solid #fb923c', shadow: '0 0 20px rgba(251,146,60,0.85)',  label: '👁️ Select', labelBg: '#ea580c' },
  give:        { outline: '3px solid #f87171', shadow: '0 0 20px rgba(248,113,113,0.85)', label: '🎁 Give', labelBg: '#dc2626' },
};

export default function Card({
  card,
  peekFace = null,
  isBig = false,
  isSelected = false,
  isLocked = false,
  isGlow = false,
  isEmpty = false,
  isMatchTarget = false,
  powerTarget = null,
  actionHighlight = null, // 'swap' | 'peek' | 'match' | 'fumble' | 'draw'
  highlightLabel = null,   // custom label text like "🔀 Swapping" or "👁️ Bob Peeking"
  draggable = false,
  onDragStart,
  onDragOver,
  onDrop,
  onClick,
}) {
  if (isEmpty) {
    return (
      <div className={`cabo-card card-empty ${isBig ? 'big' : ''}`}>
        <div style={{ margin: 'auto', opacity: 0.4, fontSize: '11px', fontWeight: 700 }}>Empty</div>
      </div>
    );
  }

  // Card is ONLY face-up if explicitly revealed by server (end of round / drawn / discard)
  // OR actively peeked right now!
  const face = card?.rank ? card : peekFace;
  const isFaceUp = Boolean(face && face.rank);
  const isRed = isFaceUp && isRedCard(face.suit);
  const isBlackKing = isFaceUp && face.rank === 'K' && !isRed;
  const isActivelyPeeked = Boolean(!card?.rank && peekFace);

  const pt = powerTarget && !isLocked ? POWER_TARGET_STYLES[powerTarget] : null;

  const classNames = [
    'cabo-card',
    'cabo-svg-card',
    isBig ? 'big' : '',
    isFaceUp ? 'card-face' : 'card-back',
    isActivelyPeeked ? 'card-known ring-2 ring-amber-400' : '',
    isSelected ? 'card-selected' : '',
    isLocked ? 'card-locked' : '',
    isGlow ? 'card-glow' : '',
    isMatchTarget ? 'card-match-target' : '',
    pt ? 'card-power-target' : '',
    actionHighlight ? `action-highlight-${actionHighlight}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const extraStyle = pt
    ? {
        outline: pt.outline,
        outlineOffset: '2px',
        boxShadow: pt.shadow,
      }
    : {};

  // Image source from src/Cards
  const imgSrc = isFaceUp ? getCardSvg(face.rank, face.suit) : getCardBackSvg();

  return (
    <div
      className={classNames}
      style={{ cursor: draggable ? 'grab' : 'pointer', ...extraStyle }}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onClick}
      title={
        isLocked
          ? "CABO caller's cards are locked from interference"
          : pt
          ? pt.label
          : isMatchTarget
          ? 'Click to match this card with the discard pile'
          : undefined
      }
    >
      {/* Real Card SVG from src/Cards */}
      <img
        src={imgSrc}
        alt={isFaceUp ? `${face.rank} of ${face.suit}` : 'Card Back'}
        className="card-vector-img"
        draggable={false}
      />

      {card?.penalty && !isFaceUp && <span className="penalty-card-mark">P</span>}

      {/* Special Cabo Point Badges for Kings */}
      {isBlackKing && <span className="special-badge-cabo-blackking">13</span>}

      {/* CABO Caller Locked Overlay */}
      {isLocked && <span className="card-lock-badge">🔒</span>}

      {/* Actively Peeked Badge */}
      {isActivelyPeeked && <div className="card-peek-badge">PEEKED</div>}

      {/* Action Highlight Badge (e.g. "🔀 Swapping" or "👁️ Bob Peeking") */}
      {highlightLabel && (
        <div className={`card-action-banner banner-${actionHighlight || 'info'}`}>
          {highlightLabel}
        </div>
      )}

      {/* Power Target Interactive Badge */}
      {pt && !highlightLabel && (
        <div
          className="card-target-badge"
          style={{ background: pt.labelBg }}
        >
          {pt.label}
        </div>
      )}

      {/* Match Discard Target Badge */}
      {isMatchTarget && !highlightLabel && (
        <div className="card-match-badge">
          ⚡ Match?
        </div>
      )}
    </div>
  );
}
