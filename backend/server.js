'use strict';
/**
 * CABO online - multiplayer server (Express + Socket.IO)
 * All game state is held in memory, one object per room.
 */
const express = require('express');
const http = require('http');
const path = require('path');
const crypto = require('crypto');
const { Server } = require('socket.io');

const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
const localDist = path.join(__dirname, 'dist');

app.get('/health', (_req, res) => res.send('ok'));

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => res.sendFile(path.join(frontendDist, 'index.html')));
} else if (fs.existsSync(localDist)) {
  app.use(express.static(localDist));
  app.get('*', (_req, res) => res.sendFile(path.join(localDist, 'index.html')));
} else {
  app.get('/', (_req, res) => res.json({ name: 'CABO Online Backend API', status: 'running', ws: 'socket.io' }));
}

const PORT = process.env.PORT || 3000;
const MAX_PLAYERS = 8;
const rooms = new Map();

/* ---------------------------- cards & helpers ---------------------------- */
const SUITS = ['S', 'H', 'D', 'C'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SYM = { S: '♠', H: '♥', D: '♦', C: '♣' };
let cardSeq = 0;
const rid = (n = 8) => crypto.randomBytes(n).toString('hex');

function cardValue(rank, suit) {
  if (rank === 'A') return 1;
  if (rank === 'J') return 11;
  if (rank === 'Q') return 12;
  if (rank === 'K') return suit === 'H' || suit === 'D' ? -1 : 13;
  return parseInt(rank, 10);
}
function powerOf(rank) {
  if (rank === '7' || rank === '8') return 'own';
  if (rank === '9' || rank === '10') return 'other';
  if (rank === 'J') return 'jack';
  if (rank === 'Q') return 'queen';
  if (rank === 'K') return 'king';
  return null;
}
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function makeDeck() {
  const d = [];
  for (const s of SUITS)
    for (const r of RANKS) d.push({ id: 'c' + ++cardSeq, rank: r, suit: s, value: cardValue(r, s) });
  return shuffle(d);
}
const cname = (c) => c.rank + SYM[c.suit];
const total = (p) => p.cards.reduce((s, c) => s + c.value, 0);

function makeCode() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let c;
  do {
    c = Array.from({ length: 4 }, () => A[crypto.randomInt(A.length)]).join('');
  } while (rooms.has(c));
  return c;
}
function log(room, text) {
  room.log.push(text);
  if (room.log.length > 100) room.log.shift();
}
function findCard(room, id) {
  for (const p of room.players) {
    const i = p.cards.findIndex((c) => c.id === id);
    if (i >= 0) return { owner: p, idx: i, card: p.cards[i] };
  }
  return null;
}
function swapCards(a, b) {
  const ca = a.card, cb = b.card;
  a.owner.cards[a.idx] = cb;
  b.owner.cards[b.idx] = ca;
}
function drawFromDeck(room) {
  if (room.deck.length === 0) {
    if (room.discard.length <= 1) return null;
    const top = room.discard.pop();
    room.deck = shuffle(room.discard);
    room.discard = [top];
    log(room, 'The draw pile ran out - discard pile reshuffled.');
  }
  return room.deck.pop();
}
function peek(p, card) {
  if (p.socketId) io.to(p.socketId).emit('peek', card);
}

/* ------------------------------ room lifecycle --------------------------- */
function newRoom(hostPlayer) {
  const code = makeCode();
  const room = {
    code,
    hostId: hostPlayer.id,
    players: [hostPlayer],
    phase: 'lobby', // lobby | playing | over
    settings: { aid: true }, // aid = client keeps showing cards you know
    round: 0,
    deck: [],
    discard: [],
    turn: null,
    opp: null, // match opportunity {state:'open'|'claimed', value}
    pendingGive: null,
    caller: null,
    result: null,
    log: [],
    lastActive: Date.now(),
  };
  rooms.set(code, room);
  return room;
}
function makePlayer(socket, name, room) {
  const taken = room ? room.players.map((p) => p.name) : [];
  let nm = (String(name || 'Player').trim().slice(0, 16)) || 'Player';
  let base = nm, n = 2;
  while (taken.includes(nm)) nm = `${base} ${n++}`;
  return { id: rid(4), token: rid(16), name: nm, socketId: socket.id, connected: true, cards: [], total: 0, wins: 0 };
}
function bind(socket, room, p) {
  socket.data.code = room.code;
  socket.data.pid = p.id;
  socket.join(room.code);
}
function ensureHost(room) {
  const host = room.players.find((p) => p.id === room.hostId);
  if (!host || !host.connected) {
    const next = room.players.find((p) => p.connected);
    if (next) room.hostId = next.id;
  }
}

function startRound(room) {
  room.players = room.players.filter((p) => p.connected);
  room.round++;
  room.deck = makeDeck();
  room.discard = [];
  room.opp = null;
  room.pendingGive = null;
  room.caller = null;
  room.result = null;
  room.initialPeekUntil = Date.now() + 10000;
  for (const p of room.players) {
    p.cards = [];
    for (let i = 0; i < 4; i++) p.cards.push(room.deck.pop());
  }
  const first = room.players[(room.round - 1) % room.players.length];
  room.turn = { playerId: first.id, phase: 'draw', drawn: null, power: null, stage: 0 };
  room.phase = 'playing';
  log(room, `Round ${room.round} started. ${first.name} goes first. Memorise your two bottom cards (10s)!`);
  broadcast(room);
  // state first, then the private peeks of the two bottom cards
  for (const p of room.players) {
    peek(p, p.cards[2]);
    peek(p, p.cards[3]);
  }
}

function advance(room) {
  const ps = room.players;
  const i = ps.findIndex((x) => x.id === room.turn.playerId);
  const next = ps[(i + 1) % ps.length];
  if (room.caller && next.id === room.caller) {
    room.turn = { playerId: next.id, phase: 'final', drawn: null, power: null, stage: 0 };
    // Open a match opportunity for the CABO player on the top discard card if available
    if (room.discard.length > 0) {
      room.opp = { state: 'open', value: room.discard[room.discard.length - 1].value };
    }
    log(room, `Final window: ${next.name} (CABO) may discard matching cards, then finish the round.`);
    return;
  }
  room.turn = { playerId: next.id, phase: 'draw', drawn: null, power: null, stage: 0 };
}

function endRound(room) {
  room.phase = 'over';
  room.pendingGive = null;
  const scores = room.players.map((p) => ({
    id: p.id,
    name: p.name,
    score: total(p),
    cards: p.cards.map((c) => ({ ...c }))
  }));
  const min = Math.min(...scores.map((s) => s.score));
  const winners = scores.filter((s) => s.score === min).map((s) => s.id);
  for (const p of room.players) {
    p.total += scores.find((s) => s.id === p.id).score;
    if (winners.includes(p.id)) p.wins++;
  }
  room.result = { scores, winners, min };
  log(room, `Round over! Winner${winners.length > 1 ? 's' : ''}: ${scores.filter((s) => winners.includes(s.id)).map((s) => s.name).join(', ')} (${min}).`);
}

/* ------------------------------ state for clients ------------------------ */
function stateFor(room, viewer) {
  const over = room.phase === 'over';
  const t = room.turn;
  return {
    code: room.code,
    phase: room.phase,
    round: room.round,
    hostId: room.hostId,
    settings: room.settings,
    you: viewer.id,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      connected: p.connected,
      total: p.total,
      wins: p.wins,
      score: over ? total(p) : null,
      cards: p.cards.map((c) => (over ? { ...c } : { id: c.id })),
    })),
    turn: t && {
      playerId: t.playerId,
      phase: t.phase,
      power: t.power,
      stage: t.stage,
      target: t.target,
      kOwn: t.kOwn,
      kOther: t.kOther,
      drawn: t.playerId === viewer.id ? t.drawn : null,
      hasDrawn: !!t.drawn,
    },
    deckCount: room.deck.length,
    discardTop: room.discard.length ? room.discard[room.discard.length - 1] : null,
    opp: room.opp ? { state: room.opp.state, value: room.opp.value } : null,
    pendingGive: room.pendingGive,
    caller: room.caller,
    result: room.result,
    initialPeekUntil: room.initialPeekUntil || 0,
    log: room.log.slice(-40),
  };
}
function broadcast(room) {
  room.lastActive = Date.now();
  for (const p of room.players) if (p.socketId) io.to(p.socketId).emit('state', stateFor(room, p));
}

// Broadcast a visible animation event to all players in the room.
// 'type' - the kind of action, 'actorId' - who did it, rest is payload (no private card data!).
function animBroadcast(room, payload) {
  io.to(room.code).emit('anim', payload);
}

/* ------------------------------ game actions ----------------------------- */
function penalty(room, p, why) {
  const c = drawFromDeck(room);
  if (c) p.cards.push(c);
  log(room, `${p.name} ${why} and takes a penalty card.`);
}

function handleMatch(room, p, m) {
  if (!room.opp) return 'Nothing to match right now';
  const f = findCard(room, m.cardId);
  if (!f) return 'Card not found';
  const isCaller = room.caller === p.id;
  const inFinal = room.turn && room.turn.phase === 'final';

  if (inFinal) {
    if (!isCaller) return 'Only the CABO player has the final matching opportunity';
    if (f.owner.id !== p.id) return 'You can only discard your own cards in the final window';
  } else if (isCaller) {
    return 'CABO player cards are locked and can only match in the final window';
  } else if (f.owner.id === room.caller) {
    return "The CABO player's cards are locked from interference";
  }

  if (room.opp.state === 'claimed') {
    penalty(room, p, `tried to match ${f.owner.id === p.id ? 'their' : f.owner.name + "'s"} ${cname(f.card)}, but was too late (already claimed)`);
    animBroadcast(room, { type: 'fumble', actorId: p.id, actorName: p.name, targetId: f.owner.id, cardIdx: f.idx });
    return null;
  }
  if (f.card.value !== room.opp.value) {
    penalty(room, p, `fumbled! Tried to match with ${f.owner.id === p.id ? 'their' : f.owner.name + "'s"} ${cname(f.card)} (value: ${f.card.value}), but needed value ${room.opp.value}`);
    animBroadcast(room, { type: 'fumble', actorId: p.id, actorName: p.name, targetId: f.owner.id, cardIdx: f.idx });
    return null;
  }
  // success
  const targetId = f.owner.id;
  const cardIdx = f.idx;
  f.owner.cards.splice(f.idx, 1);
  room.discard.push(f.card);
  animBroadcast(room, { type: 'match', actorId: p.id, actorName: p.name, targetId, cardIdx });
  if (inFinal && isCaller) {
    room.opp = { state: 'open', value: f.card.value };
    log(room, `🎯 ${p.name} (CABO) matched and discarded ${cname(f.card)} (value: ${f.card.value}) in the final window!`);
  } else {
    room.opp.state = 'claimed';
    if (f.owner.id === p.id) {
      log(room, `🎯 ${p.name} successfully matched their own ${cname(f.card)} (value: ${f.card.value})!`);
    } else {
      log(room, `🎯 ${p.name} successfully matched ${f.owner.name}'s ${cname(f.card)} (value: ${f.card.value})!`);
      if (p.cards.length > 0) {
        room.pendingGive = { from: p.id, to: f.owner.id };
        log(room, `👉 ${p.name} must now give a compensation card from their hand to ${f.owner.name}.`);
      }
    }
  }
  return null;
}

function handlePower(room, p, t, m) {
  const done = () => { t.phase = 'end'; t.power = null; t.stage = 0; t.target = null; t.kOwn = null; t.kOther = null; };
  if (m.skip) { log(room, `${p.name} skipped the power.`); done(); return null; }
  const own = (id) => { const f = findCard(room, id); return f && f.owner === p ? f : null; };
  const anyOther = (id) => { const f = findCard(room, id); return f && f.owner !== p ? f : null; };

  switch (t.power) {
    case 'own': {
      const f = own(m.own);
      if (!f) return 'Click one of your own cards';
      peek(p, f.card);
      log(room, `${p.name} looked at one of their own cards.`);
      animBroadcast(room, { type: 'peek_own', actorId: p.id, actorName: p.name, cardIdx: f.idx });
      done();
      return null;
    }
    case 'other': {
      const f = anyOther(m.other);
      if (!f) return "Click another player's card";
      peek(p, f.card);
      log(room, `${p.name} looked at one of ${f.owner.name}'s cards.`);
      // Only broadcast WHO peeked and WHOSE card — NOT the card value (stays private)
      animBroadcast(room, { type: 'peek_other', actorId: p.id, actorName: p.name, targetId: f.owner.id, targetName: f.owner.name, cardIdx: f.idx });
      done();
      return null;
    }
    case 'jack': {
      const a = own(m.own);
      if (!a) return 'Pick one of your own cards';
      const b = anyOther(m.other);
      if (!b) return "Pick another player's card";
      if (b.owner.id === room.caller) return "The CABO player's cards are locked from swapping";
      swapCards(a, b);
      log(room, `${p.name} blind-swapped a card with ${b.owner.name}.`);
      animBroadcast(room, { type: 'swap', actorId: p.id, actorName: p.name, targetId: b.owner.id, targetName: b.owner.name, ownIdx: a.idx, otherIdx: b.idx });
      done();
      return null;
    }
    case 'queen': {
      if (t.stage === 0) {
        const f = anyOther(m.other);
        if (!f) return "Click another player's card to look at";
        peek(p, f.card);
        t.target = f.card.id;
        t.stage = 1;
        log(room, `${p.name} looked at one of ${f.owner.name}'s cards.`);
        animBroadcast(room, { type: 'peek_other', actorId: p.id, actorName: p.name, targetId: f.owner.id, targetName: f.owner.name, cardIdx: f.idx });
        return null;
      }
      if (m.swapOwn == null) { log(room, `${p.name} chose not to swap.`); done(); return null; }
      const a = own(m.swapOwn);
      if (!a) return 'Pick one of your own cards, or choose not to swap';
      const b = findCard(room, t.target);
      if (!b || b.owner === p) { done(); return 'That card is no longer available'; }
      if (b.owner.id === room.caller) {
        done();
        return "The CABO player's cards are locked from swapping";
      }
      swapCards(a, b);
      log(room, `${p.name} swapped a card with ${b.owner.name}.`);
      animBroadcast(room, { type: 'swap', actorId: p.id, actorName: p.name, targetId: b.owner.id, targetName: b.owner.name, ownIdx: a.idx, otherIdx: b.idx });
      done();
      return null;
    }
    case 'king': {
      if (t.stage === 0) {
        const a = own(m.own), b = anyOther(m.other);
        if (!a || !b) return "Pick one of your cards and one of another player's cards";
        peek(p, a.card);
        peek(p, b.card);
        t.kOwn = a.card.id;
        t.kOther = b.card.id;
        t.stage = 1;
        log(room, `${p.name} looked at one of their cards and one of ${b.owner.name}'s.`);
        animBroadcast(room, { type: 'peek_both', actorId: p.id, actorName: p.name, targetId: b.owner.id, targetName: b.owner.name, ownIdx: a.idx, otherIdx: b.idx });
        return null;
      }
      if (!m.swap) { log(room, `${p.name} chose not to swap.`); done(); return null; }
      const a = own(t.kOwn);
      const b = findCard(room, t.kOther);
      if (!a || !b || b.owner === p) { done(); return 'Those cards changed - no swap'; }
      if (b.owner.id === room.caller) {
        done();
        return "The CABO player's cards are locked from swapping";
      }
      swapCards(a, b);
      log(room, `${p.name} swapped a card with ${b.owner.name}.`);
      animBroadcast(room, { type: 'swap', actorId: p.id, actorName: p.name, targetId: b.owner.id, targetName: b.owner.name, ownIdx: a.idx, otherIdx: b.idx });
      done();
      return null;
    }
  }
  done();
  return null;
}

function handleAct(room, p, m) {
  if (room.phase !== 'playing') return 'The round is not in progress';
  const t = room.turn;
  const mine = t.playerId === p.id;
  switch (m.type) {
    case 'draw': {
      if (!mine || t.phase !== 'draw') return 'You cannot draw now';
      if (room.pendingGive) return 'Waiting for a card to be given first';
      room.opp = null; // previous match window closes when the next player draws
      const c = drawFromDeck(room);
      if (!c) { log(room, 'No cards left to draw - turn skipped.'); t.phase = 'end'; return null; }
      t.drawn = c;
      t.phase = 'decide';
      log(room, `${p.name} drew a card.`);
      animBroadcast(room, { type: 'draw', actorId: p.id, actorName: p.name });
      return null;
    }
    case 'replace': {
      if (!mine || t.phase !== 'decide') return 'Not now';
      const f = findCard(room, m.cardId);
      if (!f || f.owner !== p) return 'Pick one of your own cards';
      const old = f.card;
      p.cards[f.idx] = t.drawn;
      room.discard.push(old);
      room.opp = { state: 'open', value: old.value };
      t.drawn = null;
      t.phase = 'end';
      log(room, `${p.name} put the drawn card in their hand and discarded ${cname(old)}.`);
      animBroadcast(room, { type: 'replace', actorId: p.id, actorName: p.name, cardIdx: f.idx });
      return null;
    }
    case 'discard': {
      if (!mine || t.phase !== 'decide') return 'Not now';
      const d = t.drawn;
      const pw = powerOf(d.rank);
      room.discard.push(d);
      room.opp = { state: 'open', value: d.value };
      t.drawn = null;
      animBroadcast(room, { type: 'discard', actorId: p.id, actorName: p.name });
      if (pw) {
        t.power = pw;
        t.stage = 0;
        t.phase = 'power_prompt';
        log(room, `${p.name} discarded ${cname(d)}. Special power is available!`);
      } else {
        t.power = null;
        t.stage = 0;
        t.phase = 'end';
        log(room, `${p.name} discarded ${cname(d)}.`);
      }
      return null;
    }
    case 'usePower': {
      if (!mine || t.phase !== 'power_prompt') return 'Not now';
      t.phase = 'power';
      log(room, `${p.name} activated the special power.`);
      return null;
    }
    case 'skipPower': {
      if (!mine || (t.phase !== 'power_prompt' && t.phase !== 'power')) return 'Not now';
      t.phase = 'end';
      t.power = null;
      t.stage = 0;
      log(room, `${p.name} skipped the special power.`);
      return null;
    }
    case 'power': {
      if (!mine || t.phase !== 'power') return 'No power to use now';
      return handlePower(room, p, t, m);
    }
    case 'endTurn': {
      if (!mine || t.phase !== 'end') return 'Not now';
      advance(room);
      return null;
    }
    case 'callCabo': {
      if (!mine || t.phase !== 'end' || room.caller) return 'You cannot call CABO now';
      room.caller = p.id;
      log(room, `📣 ${p.name} called CABO! Their cards are locked - everyone else gets one last turn.`);
      advance(room);
      return null;
    }
    case 'finish': {
      if (!mine || t.phase !== 'final' || room.caller !== p.id) return 'Not now';
      if (room.pendingGive) return 'Waiting for a card to be given first';
      endRound(room);
      return null;
    }
    case 'match':
      return handleMatch(room, p, m);
    case 'give': {
      const g = room.pendingGive;
      if (!g || g.from !== p.id) return 'Nothing to give';
      const idx = p.cards.findIndex((c) => c.id === m.cardId);
      const target = room.players.find((x) => x.id === g.to);
      if (idx < 0 || !target) return 'Pick one of your own cards';
      target.cards.push(p.cards.splice(idx, 1)[0]);
      room.pendingGive = null;
      log(room, `${p.name} gave a card to ${target.name}.`);
      animBroadcast(room, { type: 'give', actorId: p.id, actorName: p.name, targetId: target.id, cardIdx: idx });
      return null;
    }
  }
  return 'Unknown action';
}

/* -------------------------------- sockets -------------------------------- */
io.on('connection', (socket) => {
  const getCtx = () => {
    const room = rooms.get(socket.data.code);
    const p = room && room.players.find((x) => x.id === socket.data.pid);
    return { room, p };
  };

  socket.on('create', (d, cb = () => {}) => {
    const p = makePlayer(socket, d && d.name, null);
    const room = newRoom(p);
    bind(socket, room, p);
    log(room, `${p.name} created the room.`);
    cb({ ok: true, code: room.code, token: p.token });
    broadcast(room);
  });

  socket.on('join', (d, cb = () => {}) => {
    const code = String((d && d.code) || '').toUpperCase().trim();
    const room = rooms.get(code);
    if (!room) return cb({ error: 'Room not found' });
    if (room.phase !== 'lobby') return cb({ error: 'That game has already started' });
    if (room.players.length >= MAX_PLAYERS) return cb({ error: `Room is full (max ${MAX_PLAYERS})` });
    const p = makePlayer(socket, d.name, room);
    room.players.push(p);
    bind(socket, room, p);
    log(room, `${p.name} joined.`);
    cb({ ok: true, code, token: p.token });
    broadcast(room);
  });

  socket.on('resume', (d, cb = () => {}) => {
    const room = rooms.get(String((d && d.code) || '').toUpperCase());
    const p = room && room.players.find((x) => x.token === (d && d.token));
    if (!p) return cb({ error: 'Session expired' });
    p.socketId = socket.id;
    p.connected = true;
    bind(socket, room, p);
    ensureHost(room);
    cb({ ok: true });
    broadcast(room);
  });

  socket.on('settings', (d) => {
    const { room, p } = getCtx();
    if (!room || room.hostId !== p.id || room.phase === 'playing') return;
    room.settings.aid = !!(d && d.aid);
    broadcast(room);
  });

  socket.on('start', (_d, cb = () => {}) => {
    const { room, p } = getCtx();
    if (!room || room.hostId !== p.id) return cb({ error: 'Only the host can start' });
    if (room.phase !== 'lobby') return cb({ error: 'Already started' });
    if (room.players.filter((x) => x.connected).length < 2) return cb({ error: 'Need at least 2 players' });
    startRound(room);
    cb({ ok: true });
  });

  socket.on('nextRound', (_d, cb = () => {}) => {
    const { room, p } = getCtx();
    if (!room || room.hostId !== p.id || room.phase !== 'over') return cb({ error: 'Not now' });
    if (room.players.filter((x) => x.connected).length < 2) return cb({ error: 'Need at least 2 players' });
    startRound(room);
    cb({ ok: true });
  });

  socket.on('act', (msg, cb = () => {}) => {
    const { room, p } = getCtx();
    if (!room || !p) return cb({ error: 'Not in a room' });
    try {
      const err = handleAct(room, p, msg || {});
      broadcast(room);
      cb(err ? { error: err } : { ok: true });
    } catch (e) {
      console.error(e);
      cb({ error: 'Server error' });
    }
  });

  socket.on('leave', () => {
    const { room, p } = getCtx();
    if (!room || !p) return;
    socket.leave(room.code);
    socket.data = {};
    if (room.phase === 'lobby') {
      room.players = room.players.filter((x) => x.id !== p.id);
      log(room, `${p.name} left.`);
    } else {
      p.connected = false;
      p.socketId = null;
    }
    ensureHost(room);
    if (room.players.every((x) => !x.connected)) rooms.delete(room.code);
    else broadcast(room);
  });

  socket.on('disconnect', () => {
    const { room, p } = getCtx();
    if (!room || !p || p.socketId !== socket.id) return;
    p.connected = false;
    p.socketId = null;
    ensureHost(room);
    broadcast(room);
    if (room.phase === 'lobby') {
      setTimeout(() => {
        if (!p.connected && room.phase === 'lobby') {
          room.players = room.players.filter((x) => x.id !== p.id);
          if (room.players.length === 0) rooms.delete(room.code);
          else { ensureHost(room); broadcast(room); }
        }
      }, 30000);
    }
  });
});

// remove abandoned rooms
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms)
    if (room.players.every((p) => !p.connected) && now - room.lastActive > 30 * 60 * 1000) rooms.delete(code);
}, 10 * 60 * 1000);
if (cleanupInterval.unref) cleanupInterval.unref();

if (require.main === module) {
  server.listen(PORT, () => console.log(`CABO server running on port ${PORT}`));
}

module.exports = {
  app, server, io, rooms, newRoom, makePlayer, startRound, advance, endRound,
  handleAct, handleMatch, handlePower, cardValue, powerOf, total, makeDeck,
  drawFromDeck, swapCards, findCard, stateFor, penalty
};
