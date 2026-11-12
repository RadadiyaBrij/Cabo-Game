export const SUITS = {
  S: '♠',
  H: '♥',
  D: '♦',
  C: '♣',
};

export const SUIT_NAMES = {
  S: 'Spades',
  H: 'Hearts',
  D: 'Diamonds',
  C: 'Clubs',
};

export const POWER_TEXT = {
  own: 'Secretly peek at one of your own cards (7 or 8)',
  other: "Secretly peek at one card of another player (9 or 10) — CABO caller's cards can also be looked at!",
  jack: "Blindly swap one of your cards with another player's card (Jack) — CABO caller is locked from swapping",
  queen: "Peek at another player's card, then decide whether to swap it with one of yours (Queen)",
  king: "Peek at one of your own cards and one opponent card, then decide whether to swap them (King)",
};

export const POWER_NAMES = {
  own: 'Peek Own (7/8)',
  other: 'Peek Other (9/10)',
  jack: 'Blind Swap (Jack)',
  queen: 'Peek & Swap (Queen)',
  king: 'Peek Both & Swap (King)',
};

export function isRedCard(suit) {
  return suit === 'H' || suit === 'D';
}

export function powerForRank(rank) {
  if (rank === '7' || rank === '8') return 'own';
  if (rank === '9' || rank === '10') return 'other';
  if (rank === 'J') return 'jack';
  if (rank === 'Q') return 'queen';
  if (rank === 'K') return 'king';
  return null;
}

