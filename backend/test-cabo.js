'use strict';
const assert = require('assert');
const {
  rooms, newRoom, makePlayer, startRound, advance, endRound,
  handleAct, handleMatch, handlePower, cardValue, powerOf, total,
  makeDeck, drawFromDeck, swapCards, findCard, stateFor, penalty
} = require('./server.js');

console.log('--- RUNNING CABO GAME ENGINE TESTS ---');

// 1. Test Card Values
assert.strictEqual(cardValue('A', 'S'), 1);
assert.strictEqual(cardValue('2', 'H'), 2);
assert.strictEqual(cardValue('10', 'D'), 10);
assert.strictEqual(cardValue('J', 'C'), 11);
assert.strictEqual(cardValue('Q', 'S'), 12);
assert.strictEqual(cardValue('K', 'S'), 13, 'Black King Spades should be 13');
assert.strictEqual(cardValue('K', 'C'), 13, 'Black King Clubs should be 13');
assert.strictEqual(cardValue('K', 'H'), -1, 'Red King Hearts should be -1');
assert.strictEqual(cardValue('K', 'D'), -1, 'Red King Diamonds should be -1');
console.log('✓ Card values verified (Red Kings = -1, Black Kings = 13)');

// 2. Setup mock players and room
const fakeSocket = (id) => ({ id, join: () => {}, data: {} });
const p1 = makePlayer(fakeSocket('s1'), 'Alice');
const p2 = makePlayer(fakeSocket('s2'), 'Bob');
const p3 = makePlayer(fakeSocket('s3'), 'Charlie');
const room = newRoom(p1);
room.players.push(p2, p3);

assert.strictEqual(room.players.length, 3);
console.log('✓ Room creation & players verified');

// 3. Test Start Round
startRound(room);
assert.strictEqual(room.phase, 'playing');
assert.strictEqual(room.players[0].cards.length, 4);
assert.strictEqual(room.players[1].cards.length, 4);
assert.strictEqual(room.players[2].cards.length, 4);
console.log('✓ Round start & 4 cards dealt per player verified');

// 4. Test Draw & Replace (Option A)
const activePlayer = room.players.find((p) => p.id === room.turn.playerId);
assert.strictEqual(room.turn.phase, 'draw');

// Draw card
const drawErr = handleAct(room, activePlayer, { type: 'draw' });
assert.strictEqual(drawErr, null);
assert.strictEqual(room.turn.phase, 'decide');
assert.ok(room.turn.drawn, 'Card was drawn');

// Replace card 0
const replacedCard = activePlayer.cards[0];
const drawnCard = room.turn.drawn;
const repErr = handleAct(room, activePlayer, { type: 'replace', cardId: replacedCard.id });
assert.strictEqual(repErr, null);
assert.strictEqual(activePlayer.cards[0].id, drawnCard.id);
assert.strictEqual(room.discard[room.discard.length - 1].id, replacedCard.id);
assert.ok(room.opp && room.opp.state === 'open' && room.opp.value === replacedCard.value, 'Match window open for replaced card');
assert.strictEqual(room.turn.phase, 'end');
console.log('✓ Draw and replace verified');

// 4b. Test Discarding Ace-6 without replacing (non-compulsory replace)
activePlayer.cards[0] = { id: 'test_c0', rank: '2', suit: 'S', value: 2 };
room.turn = { playerId: activePlayer.id, phase: 'decide', drawn: { id: 'd_four', rank: '4', suit: 'H', value: 4 }, power: null, stage: 0 };
const discardErr = handleAct(room, activePlayer, { type: 'discard' });
assert.strictEqual(discardErr, null, 'Can discard 4 without replacing');
assert.strictEqual(room.turn.phase, 'end');
assert.strictEqual(room.discard[room.discard.length - 1].id, 'd_four');
console.log('✓ Ace-6 can be freely discarded without replacing');

// 4c. Test Discarding 8 -> power_prompt -> anytime match during power_prompt -> use power
room.turn = { playerId: activePlayer.id, phase: 'decide', drawn: { id: 'd_eight', rank: '8', suit: 'D', value: 8 }, power: null, stage: 0 };
const discEightErr = handleAct(room, activePlayer, { type: 'discard' });
assert.strictEqual(discEightErr, null);
assert.strictEqual(room.turn.phase, 'power_prompt', 'Phase is power_prompt waiting for choice');
assert.strictEqual(room.opp.state, 'open', 'Match window is OPEN immediately upon discard');
assert.strictEqual(room.opp.value, 8);

// Opponent Bob has an 8, Alice matches Bob's 8 right now while in power_prompt!
p2.cards[0] = { id: 'bob_eight', rank: '8', suit: 'C', value: 8 };
const matchBobErr = handleMatch(room, activePlayer, { cardId: 'bob_eight' });
assert.strictEqual(matchBobErr, null, 'Alice can match Bob card during power_prompt');
assert.ok(room.pendingGive && room.pendingGive.from === activePlayer.id && room.pendingGive.to === p2.id);

// Alice gives compensation card to Bob
handleAct(room, activePlayer, { type: 'give', cardId: activePlayer.cards[0].id });
assert.strictEqual(room.pendingGive, null, 'Compensation card transferred');

// Alice can now activate the 8 power!
assert.strictEqual(room.turn.phase, 'power_prompt');
handleAct(room, activePlayer, { type: 'usePower' });
assert.strictEqual(room.turn.phase, 'power');
assert.strictEqual(room.turn.power, 'own');
handleAct(room, activePlayer, { type: 'skipPower' });
assert.strictEqual(room.turn.phase, 'end');
console.log('✓ Discard 8 -> match opponent card during power_prompt -> compensation -> use power verified!');

// 5. Test Anytime Match on Replaced Card
// Give p2 a card with the same value as replacedCard
const matchVal = replacedCard.value;
room.opp = { state: 'open', value: matchVal };
p2.cards[0] = { id: 'test_m1', rank: '8', suit: 'S', value: matchVal };
p3.cards[0] = { id: 'test_m2', rank: '3', suit: 'D', value: matchVal === 3 ? 4 : 3 };

// P3 tries to match wrong card -> gets penalty!
const origP3Cards = p3.cards.length;
handleMatch(room, p3, { cardId: 'test_m2' });
assert.strictEqual(p3.cards.length, origP3Cards + 1, 'P3 takes penalty card for wrong match');
assert.strictEqual(room.opp.state, 'open', 'Match window still open after wrong match');

// P2 matches correctly
const origP2Cards = p2.cards.length;
handleMatch(room, p2, { cardId: 'test_m1' });
assert.strictEqual(p2.cards.length, origP2Cards - 1, 'P2 discarded matching card');
assert.strictEqual(room.opp.state, 'claimed', 'Match window claimed');

// P1 tries to match late -> takes penalty!
const origP1Cards = activePlayer.cards.length;
p1.cards[1] = { id: 'test_m3', rank: '8', suit: 'H', value: matchVal };
handleMatch(room, activePlayer, { cardId: 'test_m3' });
assert.strictEqual(activePlayer.cards.length, origP1Cards + 1, 'P1 takes penalty card for late match');
console.log('✓ Anytime matching (correct, wrong, and late) verified');

// End turn
handleAct(room, activePlayer, { type: 'endTurn' });
const nextPlayer = room.players.find((p) => p.id === room.turn.playerId);
assert.notStrictEqual(nextPlayer.id, activePlayer.id);
console.log('✓ Turn advanced to next player');

// 6. Test Calling CABO
// Make next player call CABO
room.turn.phase = 'decide';
room.turn.drawn = { id: 't_cabo_draw', rank: 'A', suit: 'H', value: 1 };
handleAct(room, nextPlayer, { type: 'replace', cardId: nextPlayer.cards[0].id });
assert.strictEqual(room.turn.phase, 'end');

// Call CABO
const caboErr = handleAct(room, nextPlayer, { type: 'callCabo' });
assert.strictEqual(caboErr, null);
assert.strictEqual(room.caller, nextPlayer.id);
console.log(`✓ CABO called by ${nextPlayer.name}`);

// 7. Verify CABO Player's Cards are Locked from Swaps and Other Player Discards
const otherPlayer = room.players.find((p) => p.id === room.turn.playerId);
assert.notStrictEqual(otherPlayer.id, room.caller);

// Other player tries to discard CABO caller's card in matching
room.opp = { state: 'open', value: nextPlayer.cards[1].value };
const lockedMatchErr = handleMatch(room, otherPlayer, { cardId: nextPlayer.cards[1].id });
assert.ok(lockedMatchErr && lockedMatchErr.includes('locked'), 'Cannot discard CABO player card');
console.log("✓ Other players cannot discard CABO player's card");

// Jack power: Cannot blind-swap with CABO caller
room.turn.phase = 'power';
room.turn.power = 'jack';
const jackErr = handlePower(room, otherPlayer, room.turn, { own: otherPlayer.cards[0].id, other: nextPlayer.cards[1].id });
assert.ok(jackErr && jackErr.includes('locked'), 'Jack cannot swap with CABO player');
console.log("✓ Jack cannot swap with CABO player");

// 9/10 power: CAN look at CABO caller's card!
room.turn.phase = 'power';
room.turn.power = 'other';
const peekErr = handlePower(room, otherPlayer, room.turn, { other: nextPlayer.cards[1].id });
assert.strictEqual(peekErr, null, '9/10 CAN look at CABO player card');
console.log("✓ 9/10 power CAN look at CABO player's card");

// Queen power: CAN look at CABO caller's card, but CANNOT swap it!
room.turn.phase = 'power';
room.turn.power = 'queen';
room.turn.stage = 0;
const qLookErr = handlePower(room, otherPlayer, room.turn, { other: nextPlayer.cards[1].id });
assert.strictEqual(qLookErr, null, 'Queen stage 0 can look at CABO player card');
assert.strictEqual(room.turn.stage, 1);
const qSwapErr = handlePower(room, otherPlayer, room.turn, { swapOwn: otherPlayer.cards[0].id });
assert.ok(qSwapErr && qSwapErr.includes('locked'), 'Queen cannot swap with CABO player');
console.log("✓ Queen can look at CABO player's card, but cannot swap it");

// King power: CAN look at CABO caller's card, but CANNOT swap it!
room.turn.phase = 'power';
room.turn.power = 'king';
room.turn.stage = 0;
const kLookErr = handlePower(room, otherPlayer, room.turn, { own: otherPlayer.cards[0].id, other: nextPlayer.cards[1].id });
assert.strictEqual(kLookErr, null, 'King stage 0 can look at CABO player card');
assert.strictEqual(room.turn.stage, 1);
const kSwapErr = handlePower(room, otherPlayer, room.turn, { swap: true });
assert.ok(kSwapErr && kSwapErr.includes('locked'), 'King cannot swap with CABO player');
console.log("✓ King can look at CABO player's card, but cannot swap it");

// 8. Test Final Turns & CABO Caller's Final Opportunity
// Complete remaining players' turns until it reaches CABO caller
let turnsLeft = room.players.length;
while (room.turn.playerId !== room.caller && turnsLeft-- > 0) {
  room.turn.phase = 'end';
  advance(room);
}
assert.strictEqual(room.turn.playerId, room.caller, 'Turn returned to CABO caller');
assert.strictEqual(room.turn.phase, 'final', 'CABO caller is in final phase');
console.log("✓ Final round returned to CABO caller in 'final' phase");

// CABO caller gets final opportunity to discard own matching cards
const caboCaller = nextPlayer;
const topDiscard = room.discard[room.discard.length - 1];
caboCaller.cards.push({ id: 'final_cabo_match', rank: topDiscard.rank, suit: 'H', value: topDiscard.value });

const caboMatchErr = handleMatch(room, caboCaller, { cardId: 'final_cabo_match' });
assert.strictEqual(caboMatchErr, null, 'CABO caller successfully matched in final window');
console.log('✓ CABO caller matched in final opportunity window');

// Finish round
handleAct(room, caboCaller, { type: 'finish' });
assert.strictEqual(room.phase, 'over', 'Round is now over');
assert.ok(room.result, 'Round results generated');
assert.ok(room.result.winners.length >= 1, 'Winners declared');
console.log('✓ Round ended, results and winners computed correctly');

console.log('\nALL ENGINE TESTS PASSED SUCCESSFULLY! 🎯');

