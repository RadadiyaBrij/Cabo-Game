import React from 'react';
import { X, Trophy, Eye, RefreshCw, ShieldAlert, Award } from 'lucide-react';

export default function RulesModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '12px', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', color: '#fde047' }}>
            <span>📖</span> Complete CABO Game Rules
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Section 1 */}
        <div style={{ marginBottom: '18px' }}>
          <h3 style={{ color: '#fde047', fontSize: '16px', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Trophy size={18} /> 1. Objective of the Game
          </h3>
          <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.5, opacity: 0.9 }}>
            CABO is a multiplayer card game for 2 or more players. The objective is to <strong>minimize the total value of your cards</strong>.
            The player with the lowest score at the end of the round wins. Negative scores are allowed!
          </p>
        </div>

        {/* Section 2 */}
        <div style={{ marginBottom: '18px' }}>
          <h3 style={{ color: '#fde047', fontSize: '16px', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Eye size={18} /> 2. Starting the Game
          </h3>
          <ul style={{ margin: '0 0 0 18px', padding: 0, fontSize: '13.5px', lineHeight: 1.5, opacity: 0.9 }}>
            <li>Each player receives 4 cards placed face down in a <strong>2×2 grid</strong>.</li>
            <li>At the start of the round, you secretly peek at and memorize your <strong>two bottom cards</strong>.</li>
            <li>The two top cards remain unknown to you until revealed by a power or at the end of the round.</li>
          </ul>
        </div>

        {/* Section 3 */}
        <div style={{ marginBottom: '18px' }}>
          <h3 style={{ color: '#fde047', fontSize: '16px', margin: '0 0 6px 0' }}>
            3. Card Values & Scoring
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', margin: '6px 0' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', textAlign: 'left', color: '#fde047' }}>
                <th style={{ padding: '6px' }}>Card</th>
                <th style={{ padding: '6px' }}>Value</th>
                <th style={{ padding: '6px' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(239,68,68,0.15)' }}>
                <td style={{ padding: '6px', fontWeight: 800 }}>Red King (Hearts ♥, Diamonds ♦)</td>
                <td style={{ padding: '6px', color: '#f87171', fontWeight: 900 }}>-1</td>
                <td style={{ padding: '6px' }}>Best card in the game! Reduces your total score.</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <td style={{ padding: '6px' }}>Ace</td>
                <td style={{ padding: '6px', fontWeight: 800 }}>1</td>
                <td style={{ padding: '6px' }}>Low value card.</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <td style={{ padding: '6px' }}>2 to 10</td>
                <td style={{ padding: '6px', fontWeight: 800 }}>Face value (2–10)</td>
                <td style={{ padding: '6px' }}>Cards 7 & 8 have Peek Own; 9 & 10 have Peek Other.</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <td style={{ padding: '6px' }}>Jack</td>
                <td style={{ padding: '6px', fontWeight: 800 }}>11</td>
                <td style={{ padding: '6px' }}>Blind swap power.</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <td style={{ padding: '6px' }}>Queen</td>
                <td style={{ padding: '6px', fontWeight: 800 }}>12</td>
                <td style={{ padding: '6px' }}>Peek opponent card & decide swap.</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <td style={{ padding: '6px' }}>Black King (Spades ♠, Clubs ♣)</td>
                <td style={{ padding: '6px', fontWeight: 900, color: '#94a3b8' }}>13</td>
                <td style={{ padding: '6px' }}>Highest card. Has peek both & decide swap power.</td>
              </tr>
            </tbody>
          </table>
          <p style={{ fontSize: '12px', opacity: 0.8, margin: '4px 0 0 0' }}>
            * Matching is strictly by numerical value: Red King (-1) and Black King (13) do not match each other.
          </p>
        </div>

        {/* Section 4 & 5 */}
        <div style={{ marginBottom: '18px' }}>
          <h3 style={{ color: '#fde047', fontSize: '16px', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={18} /> 4. Turn Structure & Special Powers
          </h3>
          <p style={{ margin: '0 0 6px 0', fontSize: '13.5px', lineHeight: 1.5, opacity: 0.9 }}>
            On your turn, draw one card from the draw pile. Then choose:
          </p>
          <ul style={{ margin: '0 0 8px 18px', padding: 0, fontSize: '13.5px', lineHeight: 1.5, opacity: 0.9 }}>
            <li><strong>Option A (Replace):</strong> Replace any of your cards with the drawn card. Replaced card goes to the discard pile face up.</li>
            <li><strong>Option B (Use Power):</strong> Discard the drawn card face up to activate its power:</li>
          </ul>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <td style={{ padding: '5px', fontWeight: 700, width: '90px' }}>7 or 8</td>
                <td style={{ padding: '5px' }}>Secretly look at one of your own cards.</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <td style={{ padding: '5px', fontWeight: 700 }}>9 or 10</td>
                <td style={{ padding: '5px' }}>Secretly look at one card of another player (including CABO caller).</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <td style={{ padding: '5px', fontWeight: 700 }}>Jack</td>
                <td style={{ padding: '5px' }}>Blind swap one of your cards with an opponent (CABO caller is locked).</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <td style={{ padding: '5px', fontWeight: 700 }}>Queen</td>
                <td style={{ padding: '5px' }}>Look at an opponent card, then decide whether to swap it with one of yours.</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <td style={{ padding: '5px', fontWeight: 700 }}>King</td>
                <td style={{ padding: '5px' }}>Look at one of your cards and one opponent card, then decide whether to swap.</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 6 */}
        <div style={{ marginBottom: '18px' }}>
          <h3 style={{ color: '#fde047', fontSize: '16px', margin: '0 0 6px 0' }}>
            5. Discarding Matching Cards (Anytime Rule)
          </h3>
          <ul style={{ margin: '0 0 0 18px', padding: 0, fontSize: '13.5px', lineHeight: 1.5, opacity: 0.9 }}>
            <li><strong>Your own matching card:</strong> Whenever a card is placed in the discard pile, anyone with a matching numerical value can discard it immediately!</li>
            <li><strong>Mistake penalty:</strong> Discarding a card that does not match incurs keeping your card plus <strong>+1 penalty card</strong> from the deck.</li>
            <li><strong>First come, first served:</strong> Only the first player to match gets to discard. Late attempts incur a penalty card.</li>
            <li><strong>Opponent's matching card:</strong> You can discard an opponent's known card if it matches, but you must give them one of your own cards as compensation.</li>
          </ul>
        </div>

        {/* Section 7 */}
        <div style={{ marginBottom: '18px' }}>
          <h3 style={{ color: '#fde047', fontSize: '16px', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldAlert size={18} /> 6. Calling CABO & Card Locking
          </h3>
          <ul style={{ margin: '0 0 0 18px', padding: 0, fontSize: '13.5px', lineHeight: 1.5, opacity: 0.9 }}>
            <li>Call CABO at the end of your turn if you believe your total card score is lowest.</li>
            <li><strong>🔒 Card Locking:</strong> The CABO caller's cards are protected from changes. Opponents cannot swap, replace, or discard any of the caller's cards.</li>
            <li><strong>Peeking permitted:</strong> Other players CAN still look at the CABO caller's cards with 9/10, Queen, or King powers. Swapping with them is prohibited.</li>
            <li><strong>Final turns:</strong> Every other player gets exactly one final turn.</li>
            <li><strong>⭐ CABO caller's final opportunity:</strong> Turn returns to the CABO caller. The caller does not draw, but gets one final opportunity to discard own matching cards before the final reveal!</li>
          </ul>
        </div>

        {/* Section 8 & 9 */}
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ color: '#fde047', fontSize: '16px', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award size={18} /> 7. Final Scoring & Tie Rule
          </h3>
          <p style={{ margin: '0 0 6px 0', fontSize: '13.5px', lineHeight: 1.5, opacity: 0.9 }}>
            All cards are revealed and summed. Lowest score wins! If two or more players have the same lowest score, all of them are declared winners.
          </p>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', fontSize: '12.5px' }}>
            <strong>Example:</strong>
            <br />• Player 1: 2, 4, 7, 10 = Total 23
            <br />• Player 2: A, 3, K♥ (-1), 5 = Total 8 🏆 (Winner)
            <br />• Player 3: 1, 2, 3, 4 = Total 10
          </div>
        </div>

        {/* Close button */}
        <div style={{ textAlign: 'right', marginTop: '16px' }}>
          <button className="btn-primary" onClick={onClose}>
            Got it, Let's Play!
          </button>
        </div>
      </div>
    </div>
  );
}

