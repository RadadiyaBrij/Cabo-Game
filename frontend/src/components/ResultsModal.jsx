import React, { useEffect } from 'react';
import { Trophy, X, ArrowRight } from 'lucide-react';
import { SUITS } from '../utils/constants';
import { triggerConfetti } from '../utils/audio';

export default function ResultsModal({
  result,
  players,
  hostId,
  myId,
  onNextRound,
  onClose,
}) {
  const isHost = hostId === myId;

  useEffect(() => {
    triggerConfetti();
  }, []);

  if (!result) return null;

  const sortedScores = [...result.scores].sort((a, b) => a.score - b.score);
  const winnerNames = result.winners
    .map((wId) => players.find((p) => p.id === wId)?.name || 'Winner')
    .join(', ');

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.2)',
            paddingBottom: '12px',
            marginBottom: '16px',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            🏁 Round Finished!
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Winner Highlight */}
        <div
          style={{
            background: 'rgba(251, 191, 36, 0.2)',
            border: '2px solid #fbbf24',
            borderRadius: '12px',
            padding: '14px',
            textAlign: 'center',
            marginBottom: '16px',
          }}
        >
          <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.85 }}>
            Winner{result.winners.length > 1 ? 's' : ''} (Lowest Total Score)
          </div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#fde047', marginTop: '4px' }}>
            🏆 {winnerNames} (Score: {result.min})
          </div>
        </div>

        {/* Scoring Table */}
        <p style={{ margin: '0 0 8px 0', fontSize: '13px', opacity: 0.85 }}>
          All hands revealed:
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '20px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', textAlign: 'left', color: '#fde047' }}>
              <th style={{ padding: '8px' }}>Player</th>
              <th style={{ padding: '8px' }}>Cards</th>
              <th style={{ padding: '8px' }}>Round</th>
              <th style={{ padding: '8px' }}>Game Total</th>
            </tr>
          </thead>
          <tbody>
            {sortedScores.map((s) => {
              const isWinner = result.winners.includes(s.id);
              const playerObj = players.find((p) => p.id === s.id);
              return (
                <tr
                  key={s.id}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    background: isWinner ? 'rgba(251, 191, 36, 0.15)' : 'transparent',
                    fontWeight: isWinner ? 800 : 500,
                  }}
                >
                  <td style={{ padding: '8px' }}>
                    {s.name} {isWinner && '🏆'} {s.id === myId && '(You)'}
                  </td>
                  <td style={{ padding: '8px' }}>
                    {s.cards ? (
                      <span style={{ display: 'inline-flex', gap: '4px', flexWrap: 'wrap' }}>
                        {s.cards.map((c, i) => {
                          const isRed = c.suit === 'H' || c.suit === 'D';
                          return (
                            <span
                              key={i}
                              style={{
                                background: '#fff',
                                color: isRed ? '#dc2626' : '#0f172a',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 800,
                                fontSize: '12px',
                                border: '1px solid #ccc',
                              }}
                            >
                              {c.rank}
                              {SUITS[c.suit]}
                            </span>
                          );
                        })}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td style={{ padding: '8px', color: isWinner ? '#fde047' : '#fff', fontWeight: 800 }}>
                    {s.score}
                  </td>
                  <td style={{ padding: '8px' }}>{playerObj ? playerObj.total : s.score}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button className="btn-ghost" onClick={onClose}>
            View Table
          </button>
          {isHost ? (
            <button className="btn-primary" onClick={onNextRound}>
              Start Next Round <ArrowRight size={16} />
            </button>
          ) : (
            <span style={{ fontSize: '13px', opacity: 0.8, alignSelf: 'center' }}>
              Waiting for host to start next round...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

