import React from 'react';
import Card from './Card';

export default function CenterTable({
  deckCount,
  discardTop,
  opp,
  turn,
  isMyTurn,
  caboCallerName,
  onDrawClick,
  matchMode = false,
  onToggleMatch,
}) {
  const canDraw = isMyTurn && turn?.phase === 'draw';
  const isMatchOpen = opp && opp.state === 'open';

  return (
    <div style={{ margin: '14px 0' }}>
      {/* CABO Notification Banner */}
      {caboCallerName && (
        <div className="table-center-cabo-banner" style={{ margin: '0 auto 10px' }}>
          <div className="cabo-banner-badge">🚨 CABO CALLED</div>
          <div className="cabo-banner-main">
            <span className="cabo-caller-name">{caboCallerName.toUpperCase()}</span>
            <span className="cabo-banner-desc">CALLED CABO · CARDS LOCKED · FINAL ROUND</span>
          </div>
        </div>
      )}

      {/* Match Opportunity Banner */}
      {isMatchOpen && (
        <div
          style={{
            background: 'linear-gradient(90deg, #0f766e, #065f46)',
            border: '1px solid #34d399',
            borderRadius: '12px',
            padding: '10px 16px',
            textAlign: 'center',
            fontWeight: 800,
            fontSize: '14px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}>
            <span>⚡ MATCH WINDOW OPEN!</span>
            <span style={{ fontWeight: 500 }}>
              Numerical value: <strong style={{ color: '#fde047', fontSize: '16px' }}>{opp.value}</strong>.
              Anyone with a {opp.value} can discard it now!
            </span>
          </div>
          {onToggleMatch && (
            <button
              className={`btn-primary ${matchMode ? 'active' : ''}`}
              style={{
                padding: '6px 14px',
                fontSize: '13px',
                background: matchMode ? '#dc2626' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#fff',
                border: 'none',
              }}
              onClick={onToggleMatch}
            >
              {matchMode ? '❌ Cancel Match' : '⚡ Match Discard'}
            </button>
          )}
        </div>
      )}

      {/* Center Table Card Piles */}
      <div
        style={{
          display: 'flex',
          gap: '28px',
          justifyContent: 'center',
          alignItems: 'flex-end',
          margin: '12px 0',
        }}
      >
        {/* Draw Pile */}
        <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: 600 }}>
          <Card
            isBig
            isGlow={canDraw}
            onClick={onDrawClick}
          />
          <div style={{ marginTop: '4px', opacity: 0.9 }}>
            Draw Deck ({deckCount})
            {canDraw && <div style={{ color: '#fbbf24', fontSize: '11px', fontWeight: 700 }}>Click to draw!</div>}
          </div>
        </div>

        {/* Discard Pile */}
        <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: 600 }}>
          {discardTop ? (
            <Card card={discardTop} isBig />
          ) : (
            <Card isEmpty isBig />
          )}
          <div style={{ marginTop: '4px', opacity: 0.9 }}>
            Discard Pile
            {isMatchOpen && <div style={{ color: '#34d399', fontSize: '11px', fontWeight: 700 }}>⚡ Match open!</div>}
          </div>
        </div>

        {/* Drawn Card (If current player drew one) */}
        {isMyTurn && turn?.drawn && (
          <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: 600 }}>
            <Card card={turn.drawn} isBig isGlow />
            <div style={{ marginTop: '4px', color: '#fbbf24', fontWeight: 700 }}>
              You drew this
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

