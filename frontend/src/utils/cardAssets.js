/**
 * cardAssets.js
 * Imports all 52 playing card SVGs + BACK.svg from src/Cards
 */
const cardSvgModules = import.meta.glob('../Cards/*.svg', { eager: true, import: 'default' });

const SUIT_MAP = {
  S: 'SPADE',
  H: 'HEART',
  D: 'DIAMOND',
  C: 'CLUB',
};

const RANK_MAP = {
  A: '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '10': '10',
  J: '11-JACK',
  Q: '12-QUEEN',
  K: '13-KING',
};

/**
 * Returns the SVG asset URL for a card back
 */
export function getCardBackSvg() {
  return cardSvgModules['../Cards/BACK.svg'] || '';
}

/**
 * Returns the SVG asset URL for a given rank and suit.
 * rank: 'A' | '2'..'10' | 'J' | 'Q' | 'K'
 * suit: 'S' | 'H' | 'D' | 'C'
 */
export function getCardSvg(rank, suit) {
  if (!rank || !suit) return getCardBackSvg();
  const suitName = SUIT_MAP[suit.toUpperCase()];
  const rankName = RANK_MAP[String(rank).toUpperCase()];
  if (!suitName || !rankName) return getCardBackSvg();

  const key = `../Cards/${suitName}-${rankName}.svg`;
  return cardSvgModules[key] || getCardBackSvg();
}

