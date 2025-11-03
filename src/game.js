import { Chess } from 'chess.js';

const DEFAULT_TIME = { minutes: 5, increment: 0 };

const state = {
  game: new Chess(),
  onMove: null,
  onGameOver: null,
  whiteTime: DEFAULT_TIME.minutes * 60 * 1000,
  blackTime: DEFAULT_TIME.minutes * 60 * 1000,
  incrementMs: DEFAULT_TIME.increment * 1000,
  activeColor: 'w',
  lastMove: null,
  timerId: null,
  lastTick: null,
  gameOver: false,
  timeControl: { ...DEFAULT_TIME }
};

function getTimeControlSettings() {
  const minutes = Number.isFinite(state.timeControl?.minutes)
    ? state.timeControl.minutes
    : DEFAULT_TIME.minutes;
  const increment = Number.isFinite(state.timeControl?.increment)
    ? state.timeControl.increment
    : DEFAULT_TIME.increment;
  return { minutes, increment };
}

function stopTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

function tick() {
  if (state.gameOver) return;
  const now = Date.now();
  if (state.lastTick == null) {
    state.lastTick = now;
    return;
  }
  const delta = now - state.lastTick;
  state.lastTick = now;

  if (state.activeColor === 'w') {
    state.whiteTime = Math.max(0, state.whiteTime - delta);
    if (state.whiteTime === 0) {
      handleTimeout('b');
    }
  } else {
    state.blackTime = Math.max(0, state.blackTime - delta);
    if (state.blackTime === 0) {
      handleTimeout('w');
    }
  }
}

function startTimer() {
  stopTimer();
  state.lastTick = Date.now();
  state.timerId = setInterval(tick, 100);
}

function handleTimeout(winner) {
  state.gameOver = true;
  stopTimer();
  if (state.onGameOver) {
    state.onGameOver({ reason: 'timeout', winner });
  }
}

function evaluateGameEnd(move) {
  if (state.game.isCheckmate()) {
    state.gameOver = true;
    stopTimer();
    if (state.onGameOver) {
      state.onGameOver({ reason: 'checkmate', winner: move.color });
    }
    return 'checkmate';
  }

  if (state.game.isStalemate()) {
    state.gameOver = true;
    stopTimer();
    if (state.onGameOver) {
      state.onGameOver({ reason: 'stalemate' });
    }
    return 'stalemate';
  }

  if (state.game.isThreefoldRepetition()) {
    state.gameOver = true;
    stopTimer();
    if (state.onGameOver) {
      state.onGameOver({ reason: 'threefold' });
    }
    return 'threefold';
  }

  if (state.game.isInsufficientMaterial()) {
    state.gameOver = true;
    stopTimer();
    if (state.onGameOver) {
      state.onGameOver({ reason: 'insufficient' });
    }
    return 'insufficient';
  }

  if (state.game.isDraw()) {
    state.gameOver = true;
    stopTimer();
    if (state.onGameOver) {
      state.onGameOver({ reason: 'draw' });
    }
    return 'draw';
  }

  return null;
}

function notifyMove(move, status) {
  if (state.onMove) {
    state.onMove({
      move,
      fen: state.game.fen(),
      pgn: state.game.pgn(),
      clocks: getClocks(),
      status
    });
  }
}

export function initGame({ onMove, onGameOver } = {}) {
  state.onMove = onMove || null;
  state.onGameOver = onGameOver || null;

  return {
    startNewGame,
    attemptMove,
    getGame,
    getFen,
    getPgn,
    getClocks,
    getTimeControl
  };
}

export function getGame() {
  return state.game;
}

export function getFen() {
  return state.game.fen();
}

export function getPgn() {
  return state.game.pgn();
}

export function getClocks() {
  return {
    white: Math.max(0, Math.round(state.whiteTime)),
    black: Math.max(0, Math.round(state.blackTime)),
    active: state.activeColor
  };
}

export function getTimeControl() {
  return { ...state.timeControl };
}

export function startNewGame({ minutes, increment } = DEFAULT_TIME) {
  const minutesVal = Number.isFinite(minutes) ? minutes : DEFAULT_TIME.minutes;
  const incrementVal = Number.isFinite(increment) ? increment : DEFAULT_TIME.increment;

  stopTimer();
  state.timerId = null;

  state.timeControl = { minutes: minutesVal, increment: incrementVal };
  state.whiteTime = minutesVal * 60 * 1000;
  state.blackTime = minutesVal * 60 * 1000;
  state.incrementMs = incrementVal * 1000;
  state.activeColor = 'w';
  state.lastMove = null;
  state.game.reset();
  state.gameOver = false;
  state.lastTick = null;

  notifyMove(null, { type: 'reset' });
}

function resetAfterExternalLoad() {
  stopTimer();
  state.timerId = null;
  state.lastTick = null;
  const { minutes, increment } = getTimeControlSettings();
  state.whiteTime = minutes * 60 * 1000;
  state.blackTime = minutes * 60 * 1000;
  state.incrementMs = increment * 1000;
  state.lastMove = null;
  state.activeColor = state.game.turn();
  state.gameOver = state.game.isGameOver();
}

export function loadFen(fen) {
  if (typeof fen !== 'string' || fen.trim() === '') {
    return { success: false, message: 'FEN string is empty.' };
  }

  const trimmedFen = fen.trim();
  const newGame = new Chess();
  let loaded = false;
  try {
    loaded = newGame.load(trimmedFen);
  } catch (error) {
    loaded = false;
  }

  if (!loaded) {
    return { success: false, message: 'Unable to load FEN.' };
  }

  state.game = newGame;
  resetAfterExternalLoad();
  notifyMove(null, { type: 'load', source: 'fen' });
  return { success: true };
}

export function loadPgn(pgn) {
  if (typeof pgn !== 'string' || pgn.trim() === '') {
    return { success: false, message: 'PGN string is empty.' };
  }

  const trimmedPgn = pgn.trim();
  const newGame = new Chess();
  let loaded = false;
  try {
    loaded = newGame.loadPgn(trimmedPgn, { sloppy: true });
  } catch (error) {
    loaded = false;
  }

  if (!loaded) {
    return { success: false, message: 'Unable to load PGN.' };
  }

  state.game = newGame;
  resetAfterExternalLoad();
  notifyMove(null, { type: 'load', source: 'pgn' });
  return { success: true };
}

function attemptMove(from, to, { promotion } = {}) {
  if (state.gameOver) {
    return { success: false };
  }

  const movePayload = {
    from,
    to,
    promotion: promotion || 'q'
  };

  let move;
  try {
    move = state.game.move(movePayload);
  } catch (error) {
    move = null;
  }

  if (!move) {
    return { success: false };
  }

  state.lastMove = { from: move.from, to: move.to, san: move.san };

  if (move.color === 'w') {
    state.whiteTime += state.incrementMs;
  } else {
    state.blackTime += state.incrementMs;
  }

  state.activeColor = state.game.turn();

  const status = evaluateGameEnd(move);

  if (!state.gameOver) {
    if (!state.timerId) {
      startTimer();
    } else {
      state.lastTick = Date.now();
    }
  }

  notifyMove(move, { type: status || 'move' });

  return { success: true, move };
}

export { attemptMove };
