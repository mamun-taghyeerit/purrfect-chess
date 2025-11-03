import { Chess } from 'chess.js';
import { parseInfoLine, parseBestMove } from './engine/uci-parser';
import type { EngineAnalysisLine } from './types';

let worker: Worker | null = null;
let readyPromise = null;
let isReady = false;
let analyzeResolver = null;
let analyzeRejecter = null;
let currentAnalysis = null;
let onAnalysisProgress = null;

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

  // Parse the info line using the UCI parser
  const parsed = parseInfoLine(line);
  if (!parsed) return;

  // Report progress if depth is available and callback is set
  if (parsed.depth !== null) {
    currentAnalysis.currentDepth = parsed.depth;
    if (onAnalysisProgress && typeof onAnalysisProgress === 'function') {
      onAnalysisProgress({ depth: parsed.depth });
    }
  }

  // Only process lines with multipv
  if (parsed.multipv === null) return;

  const index = parsed.multipv;
  const entry = currentAnalysis.partials.get(index) || {
    multipv: index,
    pv: null,
    pvLine: null,
    score: null,
    result: null
  };

  // Update PV if available
  if (parsed.pv) {
    entry.pv = parsed.pv;
    entry.pvLine = parsed.pvLine;
    console.log('[ENGINE] PV extracted:', { multipv: index, pv: entry.pv, pvLine: entry.pvLine });
  }

  // Update score if available
  if (parsed.score) {
    entry.score = parsed.score;
    console.log('[ENGINE] Score extracted:', { multipv: index, score: entry.score });
  }

  // Build result if we have both pv and score
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
    .filter((entry: any) => entry.result)
    .sort((a: any, b: any) => a.multipv - b.multipv)
    .map((entry: any) => entry.result);

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

export function analyze(
  fen: string, 
  options: { 
    depth?: number; 
    multipv?: number; 
    movetime?: number | null; 
    onProgress?: ((data: { depth: number }) => void) | null;
  } = {}
): Promise<EngineAnalysisLine[]> {
  const { depth = 16, multipv = 3, movetime = null, onProgress = null } = options;
  if (!worker || !isReady) {
    throw new Error('Engine not initialized');
  }

  if (analyzeRejecter) {
    analyzeRejecter(new Error('Analysis superseded'));
  }

  post('stop');

  const safeMultipv = Math.max(1, Number.parseInt(String(multipv), 10) || 1);
  const searchDepth = Math.max(4, Number.parseInt(String(depth), 10) || 4);

  // Set progress callback
  onAnalysisProgress = onProgress;

  currentAnalysis = {
    fen,
    turn: new Chess(fen).turn(),
    multipv: safeMultipv,
    partials: new Map(),
    currentDepth: 0,
    maxDepth: movetime !== null ? null : searchDepth
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
  onAnalysisProgress = null;
}
