import React from 'react';
import { POWER_TEXT, powerForRank } from '../utils/constants';
import { RefreshCw, Trash2, Zap, ArrowRight, ShieldCheck, Check } from 'lucide-react';

export default function ActionBar({
  turn,
  isMyTurn,
  pendingGive,
  players,
  caboCallerId,
  selectedCards,
  isReplacing,
  setIsReplacing,
  initialPeekSecondsLeft,
  onDismissInitialPeek,
  onAct,
}) {
  const getPlayerName = (id) => players.find((p) => p.id === id)?.name || '?';

  // 1. Initial 10-Second Memorization Window
  if (initialPeekSecondsLeft > 0) {
    return (
      <div
        className="glass-panel bar"
        style={{
          padding: '16px 20px',
          margin: '12px 0',
          textAlign: 'center',
          background: 'rgba(15, 23, 42, 0.92)',
          border: '2px solid #38bdf8',
          boxShadow: '0 0 25px rgba(56, 189, 248, 0.35)',
        }}
      >
        <div className="retro-assignment-tag">YOUR FIRST ASSIGNMENT</div>
        <div className="retro-headline" style={{ color: '#fde047', margin: '4px 0 6px', fontSize: '20px' }}>
          🧠 MEMORIZE YOUR TWO BOTTOM CARDS ({initialPeekSecondsLeft}S REMAINING)
        </div>
        <div className="retro-subtext" style={{ marginBottom: '12px' }}>
          Both bottom cards are revealed in the modal above and highlighted on the table. They flip face-down when the timer ends!
        </div>
        <div style={{ maxWidth: '340px', margin: '0 auto' }}>
          <button className="btn-retro-action" onClick={onDismissInitialPeek}>
            <span>I'VE MEMORIZED THEM</span>
            <span className="retro-arrow">→</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. Compensation Card Pending (Rule 6.D)
  if (pendingGive) {
    const isMeGiver = pendingGive.from === turn?.playerId;
    return (
      <div
        className="glass-panel bar"
        style={{
          padding: '16px',
          margin: '10px 0',
          textAlign: 'center',
          background: 'linear-gradient(90deg, #0f766e, #065f46)',
          border: '2px solid #34d399',
        }}
      >
        <div className="say" style={{ fontSize: '15px', fontWeight: 800, color: '#fde047' }}>
          {isMeGiver
            ? `✅ Opponent card matched! Click one of YOUR cards to give to ${getPlayerName(pendingGive.to)} as compensation.`
            : `Waiting for ${getPlayerName(pendingGive.from)} to give a compensation card to ${getPlayerName(pendingGive.to)}...`}
        </div>
      </div>
    );
  }

  if (!turn) return null;

  // 3. Not My Turn
  if (!isMyTurn) {
    const activePlayerName = getPlayerName(turn.playerId);
    const isFinalPhase = turn.phase === 'final';
    return (
      <div className="glass-panel bar" style={{ padding: '12px 16px', margin: '10px 0', textAlign: 'center' }}>
        <div className="say" style={{ fontSize: '14px', opacity: 0.9 }}>
          Waiting for <strong>{activePlayerName}</strong>
          {isFinalPhase ? ' (CABO Final Opportunity Window)' : ''}...
          <div style={{ fontSize: '12px', opacity: 0.75, marginTop: '3px' }}>
            💡 You can click "⚡ Match Discard" (or press M) to match any card with the discard pile!
          </div>
        </div>
      </div>
    );
  }

  // 4. My Turn: Draw Phase
  if (turn.phase === 'draw') {
    return (
      <div className="glass-panel bar" style={{ padding: '14px', margin: '10px 0', textAlign: 'center' }}>
        <div className="say" style={{ fontSize: '15px', fontWeight: 800, color: '#fde047' }}>
          👉 Your turn: Click the Draw Deck in the center to draw a card.
        </div>
        <div style={{ fontSize: '12px', opacity: 0.75, marginTop: '2px' }}>
          (Any player can still click "Match Discard" or press M to match the top discard)
        </div>
      </div>
    );
  }

  // 5. My Turn: Decide Phase (Drawn a card - Replace or Discard)
  if (turn.phase === 'decide') {
    const power = turn.drawn ? powerForRank(turn.drawn.rank) : null;

    if (isReplacing) {
      return (
        <div
          className="glass-panel bar"
          style={{
            padding: '16px',
            margin: '10px 0',
            textAlign: 'center',
            background: 'rgba(6, 182, 212, 0.15)',
            border: '2px solid #06b6d4',
          }}
        >
          <div className="say" style={{ fontSize: '16px', fontWeight: 800, color: '#22d3ee', marginBottom: '8px' }}>
            🔄 Click one of YOUR cards to replace it with the drawn card ({turn.drawn?.rank})
          </div>
          <button className="btn-ghost" onClick={() => setIsReplacing(false)}>
            Cancel Replace
          </button>
        </div>
      );
    }

    return (
      <div className="glass-panel bar" style={{ padding: '16px', margin: '10px 0', textAlign: 'center' }}>
        <div className="say" style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>
          You drew <span style={{ color: '#fde047', fontSize: '18px' }}>{turn.drawn?.rank}</span>. Choose an action:
        </div>
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => setIsReplacing(true)}>
            <RefreshCw size={18} /> Replace One of My Cards
          </button>
          <button
            className="btn-primary"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff' }}
            onClick={() => onAct('discard')}
          >
            <Trash2 size={18} /> Discard Drawn Card
          </button>
        </div>
        {power && (
          <div style={{ fontSize: '12px', color: '#fde047', marginTop: '8px' }}>
            ⚡ Note: Discarding will give you the option to activate its special power ({POWER_TEXT[power]})!
          </div>
        )}
      </div>
    );
  }

  // 6. My Turn: Power Prompt (Card was discarded, choose to Use or Skip power)
  if (turn.phase === 'power_prompt') {
    const pw = turn.power;
    return (
      <div
        className="glass-panel bar"
        style={{
          padding: '16px',
          margin: '10px 0',
          textAlign: 'center',
          background: 'rgba(245, 158, 11, 0.15)',
          border: '2px solid #f59e0b',
        }}
      >
        <div className="say" style={{ fontSize: '16px', fontWeight: 800, color: '#fde047', marginBottom: '6px' }}>
          ⚡ Card discarded! Special power available: {POWER_TEXT[pw]}
        </div>
        <div style={{ fontSize: '12.5px', opacity: 0.85, marginBottom: '12px' }}>
          Match window is open right now! You can click any matching card, or activate your power:
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => onAct('usePower')}>
            <Zap size={18} /> ✨ Use Power
          </button>
          <button className="btn-ghost" onClick={() => onAct('skipPower')}>
            Skip Power
          </button>
        </div>
      </div>
    );
  }

  // 7. My Turn: Power Active Execution Phase
  if (turn.phase === 'power') {
    const pw = turn.power;
    const st = turn.stage;

    // Queen stage 1 check
    let isTargetCabo = false;
    let targetOwnerName = '';
    if (pw === 'queen' && st === 1 && turn.target) {
      for (const p of players) {
        if (p.cards?.some((c) => c.id === turn.target)) {
          isTargetCabo = p.id === caboCallerId;
          targetOwnerName = p.name;
          break;
        }
      }
    }

    // King stage 1 check
    let isKingOtherCabo = false;
    let kingOtherOwnerName = '';
    if (pw === 'king' && st === 1 && turn.kOther) {
      for (const p of players) {
        if (p.cards?.some((c) => c.id === turn.kOther)) {
          isKingOtherCabo = p.id === caboCallerId;
          kingOtherOwnerName = p.name;
          break;
        }
      }
    }

    return (
      <div className={`glass-panel bar power-bar-${pw}`} style={{ padding: '16px', margin: '10px 0', textAlign: 'center', border: '2px solid', borderRadius: '14px' }}>
        <div className="say" style={{ fontSize: '15px', fontWeight: 800, color: '#fde047', marginBottom: '8px' }}>
          ⚡ Power Active: {POWER_TEXT[pw]}
        </div>

        {pw === 'own' && (
          <div className="say" style={{ fontSize: '14px' }}>
            → <strong style={{ color: '#a78bfa' }}>Purple-highlighted</strong> cards are yours — click one to secretly peek at it for 5 seconds.
          </div>
        )}

        {pw === 'other' && (
          <div className="say" style={{ fontSize: '14px' }}>
            → <strong style={{ color: '#fb923c' }}>Orange-highlighted</strong> cards belong to opponents — click one to secretly peek (CABO caller cards can also be looked at).
          </div>
        )}

        {pw === 'jack' && (
          <div>
            <div className="say" style={{ fontSize: '14px', marginBottom: '8px' }}>
              → <strong style={{ color: '#38bdf8' }}>Blue = your cards</strong>, <strong style={{ color: '#f472b6' }}>Pink = opponent cards</strong>.
              Select one of yours ({selectedCards.own ? '✓' : '○'}) and one of theirs ({selectedCards.other ? '✓' : '○'}) to blind-swap, or drag one onto the other.
            </div>
            {selectedCards.own && selectedCards.other && (
              <button
                className="btn-primary"
                onClick={() => onAct('power', { own: selectedCards.own, other: selectedCards.other })}
              >
                🔀 Swap Cards (Blind)
              </button>
            )}
          </div>
        )}

        {pw === 'queen' && (
          <div>
            {st === 0 ? (
              <div className="say" style={{ fontSize: '14px' }}>
                → <strong style={{ color: '#fb923c' }}>Orange-highlighted</strong> opponent cards — click one to peek at it (then decide whether to swap).
              </div>
            ) : isTargetCabo ? (
              <div>
                <div className="say" style={{ fontSize: '14px', marginBottom: '8px' }}>
                  👀 You peeked at {targetOwnerName}'s card. Because they called CABO, their cards are locked from swapping!
                </div>
                <button className="btn-primary" onClick={() => onAct('power', { swapOwn: null })}>
                  Done
                </button>
              </div>
            ) : (
              <div>
                <div className="say" style={{ fontSize: '14px', marginBottom: '8px' }}>
                  👀 You peeked at the card. <strong style={{ color: '#34d399' }}>Green-highlighted</strong> cards are yours — click one to swap it, or keep your hand.
                </div>
                <button className="btn-ghost" onClick={() => onAct('power', { swapOwn: null })}>
                  Keep Hand (Don't Swap)
                </button>
              </div>
            )}
          </div>
        )}

        {pw === 'king' && (
          <div>
            {st === 0 ? (
              <div>
                <div className="say" style={{ fontSize: '14px', marginBottom: '8px' }}>
                  → <strong style={{ color: '#a78bfa' }}>Purple = your cards</strong>, <strong style={{ color: '#fb923c' }}>Orange = opponent cards</strong>.
                  Select one of each ({selectedCards.own ? '✓' : '○'} own, {selectedCards.other ? '✓' : '○'} other) to peek at both.
                </div>
                {selectedCards.own && selectedCards.other && (
                  <button
                    className="btn-primary"
                    onClick={() => onAct('power', { own: selectedCards.own, other: selectedCards.other })}
                  >
                    🔍 Peek at Both Cards
                  </button>
                )}
              </div>
            ) : isKingOtherCabo ? (
              <div>
                <div className="say" style={{ fontSize: '14px', marginBottom: '8px' }}>
                  👀 You peeked at both cards. Because {kingOtherOwnerName} called CABO, their cards are locked from swapping!
                </div>
                <button className="btn-primary" onClick={() => onAct('power', { swap: false })}>
                  Done
                </button>
              </div>
            ) : (
              <div>
                <div className="say" style={{ fontSize: '14px', marginBottom: '8px' }}>
                  👀 Swap the two cards you looked at?
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button className="btn-primary" onClick={() => onAct('power', { swap: true })}>
                    Swap Cards
                  </button>
                  <button className="btn-ghost" onClick={() => onAct('power', { swap: false })}>
                    Keep Cards (Don't Swap)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: '10px' }}>
          <button className="btn-ghost" style={{ fontSize: '12px' }} onClick={() => onAct('power', { skip: true })}>
            Skip Power
          </button>
        </div>
      </div>
    );
  }

  // 8. My Turn: End Turn / Call CABO Phase
  if (turn.phase === 'end') {
    return (
      <div className="glass-panel bar" style={{ padding: '16px', margin: '10px 0', textAlign: 'center' }}>
        <div className="say" style={{ fontSize: '15px', marginBottom: '12px' }}>
          Turn complete. Others can still match the discard. End your turn
          {caboCallerId ? '.' : ', or call CABO if you believe you have the lowest score!'}
        </div>
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => onAct('endTurn')}>
            End Turn <ArrowRight size={16} />
          </button>
          {!caboCallerId && (
            <button
              className="btn-cabo"
              onClick={() => {
                if (window.confirm('Call CABO? Your cards lock from changes and all other players get one final turn!')) {
                  onAct('callCabo');
                }
              }}
            >
              📣 Call CABO!
            </button>
          )}
        </div>
      </div>
    );
  }

  // 9. My Turn: CABO Final Window
  if (turn.phase === 'final') {
    return (
      <div className="glass-panel bar" style={{ padding: '16px', margin: '10px 0', textAlign: 'center' }}>
        <div className="say" style={{ fontSize: '16px', color: '#fde047', fontWeight: 900, marginBottom: '6px' }}>
          ⭐ CABO Final Opportunity Window
        </div>
        <div className="say" style={{ fontSize: '14px', marginBottom: '12px' }}>
          Click any matching card from your hand to discard it against the top of the discard pile, then click Finish
          Round!
        </div>
        <button className="btn-primary" style={{ fontSize: '16px', padding: '12px 26px' }} onClick={() => onAct('finish')}>
          🏁 Finish Round & Reveal Hands
        </button>
      </div>
    );
  }

  return null;
}
