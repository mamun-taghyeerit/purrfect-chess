import { Chess } from 'chess.js';

let worker = null;
let readyPromise = null;
let isReady = false;
let analyzeResolver = null;
let analyzeRejecter = null;
let currentAnalysis = null;

function ensureWorker() {
  if (worker) return;
  worker = new Worker('/libs/stockfish.js');
  worker.addEventListener('message', handleMessage);
}

function post(command) {
  if (worker) {
    worker.postMessage(command);
  }
}

function handleMessage(event) {
  const line = typeof event.data === 'string' ? event.data : event.data?.data;
  if (!line) {
    return;
  }

  // [DIAGNOSTIC] Log all engine messages
  console.log('[ENGINE] Raw UCI:', line);

  if (line === 'uciok') {
    post('isready');
    return;
  }

  if (line === 'readyok') {
    if (!isReady) {
      isReady = true;
      if (readyPromise) {
        readyPromise.resolve();
      }
    }
    return;
  }

  if (line.startsWith('info')) {
    handleInfo(line);
    return;
  }

  if (line.startsWith('bestmove')) {
    console.log('[ENGINE] Best move received:', line);
    finalizeAnalysis();
  }
}

function handleInfo(line) {
  if (!currentAnalysis) return;

  const multipvMatch = line.match(/multipv\s+(\d+)/);
  if (!multipvMatch) return;

  const index = Number.parseInt(multipvMatch[1], 10);
  if (!Number.isFinite(index)) return;

  const entry = currentAnalysis.partials.get(index) || {
    multipv: index,
    pv: null,
    pvLine: null,
    score: null,
    result: null
  };

  const pvMatch = line.match(/pv\s+(.+)$/);
  if (pvMatch) {
    const fullPv = pvMatch[1].trim();
    const moves = fullPv.split(/\s+/);
    entry.pv = moves[0]; // First move
    entry.pvLine = fullPv; // Full PV line
    console.log('[ENGINE] PV extracted:', { multipv: index, pv: entry.pv, pvLine: entry.pvLine });
  }

  const scoreMatch = line.match(/score\s+(cp|mate)\s+(-?\d+)/);
  if (scoreMatch) {
    entry.score = {
      type: scoreMatch[1],
      value: Number.parseInt(scoreMatch[2], 10)
    };
    console.log('[ENGINE] Score extracted:', { multipv: index, score: entry.score });
  }

  if (entry.pv && entry.score) {
    const result = buildResult(entry);
    if (result) {
      entry.result = result;
      console.log('[ENGINE] Result built:', { multipv: index, result });
    } else {
      console.warn('[ENGINE] Failed to build result for entry:', entry);
    }
  }

  currentAnalysis.partials.set(index, entry);
}

function buildResult(entry) {
  const { pv, pvLine, score, multipv } = entry;
  if (!pv) {
    // If pv is missing, we can't build a result
    return null;
  }
  
  const moves = pv.split(/\s+/);
  const uci = moves[0];
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promotion = uci.length > 4 ? uci.slice(4).toLowerCase() : undefined;

  const tempGame = new Chess(currentAnalysis.fen);
  let san = uci;
  try {
    const move = tempGame.move({ from, to, promotion });
    if (move && move.san) {
      san = move.san;
    }
  } catch (error) {
    san = uci;
  }

  let normalizedScore = score.value;
  if (score.type === 'cp' || score.type === 'mate') {
    if (currentAnalysis.turn === 'b') {
      normalizedScore = -normalizedScore;
    }
  }

  return {
    multipv,
    uci,
    from,
    to,
    san,
    score: normalizedScore,
    scoreType: score.type,
    rawScore: score.value,
    pvLine: pvLine || pv
  };
}

function finalizeAnalysis() {
  if (!currentAnalysis) return;

  const results = Array.from(currentAnalysis.partials.values())
    .filter((entry) => entry.result)
    .sort((a, b) => a.multipv - b.multipv)
    .map((entry) => entry.result);

  console.log('[ENGINE] Finalized analysis results:', results);

  if (analyzeResolver) {
    analyzeResolver(results);
  }

  analyzeResolver = null;
  analyzeRejecter = null;
  currentAnalysis = null;
}

export function initEngine() {
  if (readyPromise) {
    return readyPromise.promise;
  }
  ensureWorker();
  post('uci');
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  readyPromise = { promise, resolve, reject };
  return promise;
}

export function analyze(fen, { depth = 16, multipv = 3, movetime = null } = {}) {
  if (!worker || !isReady) {
    throw new Error('Engine not initialized');
  }

  if (analyzeRejecter) {
    analyzeRejecter(new Error('Analysis superseded'));
  }

  post('stop');

  const safeMultipv = Math.max(1, Number.parseInt(multipv, 10) || 1);
  const searchDepth = Math.max(4, Number.parseInt(depth, 10) || 4);

  currentAnalysis = {
    fen,
    turn: new Chess(fen).turn(),
    multipv: safeMultipv,
    partials: new Map()
  };

  post('ucinewgame');
  post(`setoption name MultiPV value ${safeMultipv}`);
  post(`position fen ${fen}`);

  return new Promise((resolve, reject) => {
    analyzeResolver = resolve;
    analyzeRejecter = reject;
    if (movetime !== null && Number.isFinite(movetime) && movetime > 0) {
      post(`go movetime ${movetime}`);
    } else {
      post(`go depth ${searchDepth}`);
    }
  });
}

export function stop() {
  if (!worker) return;
  post('stop');
  post('ucinewgame');
  if (analyzeResolver) {
    analyzeResolver([]);
  }
  if (analyzeRejecter) {
    analyzeRejecter(new Error('Analysis stopped'));
  }
  analyzeResolver = null;
  analyzeRejecter = null;
  currentAnalysis = null;
}
