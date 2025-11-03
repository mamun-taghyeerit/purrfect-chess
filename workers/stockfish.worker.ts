/**
 * Stockfish Web Worker Scaffold
 *
 * This worker will eventually replace the engine integration from src/engine.ts
 *
 * Integration points from vanilla app:
 * - src/engine.ts: Stockfish worker integration
 * - src/engine/uci-parser.ts: UCI protocol parsing
 * - public/libs/stockfish.js: Stockfish binary
 * - public/libs/stockfish.wasm: Stockfish WebAssembly module
 *
 * TODO for future PRs:
 * 1. Load Stockfish from /public/libs/stockfish.js
 * 2. Implement UCI protocol communication
 * 3. Parse engine analysis (info lines, bestmove)
 * 4. Support multi-PV analysis (showing top 3 moves)
 * 5. Add depth control and analysis stopping
 * 6. Implement proper error handling
 * 7. Port UCI parsing logic from src/engine/uci-parser.ts
 *
 * Current status: STUB - Not functional yet
 * This is a placeholder to establish the worker structure.
 */

// @ts-ignore - Worker context
const ctx: Worker = self as any;

let stockfishEngine: Worker | null = null;
let isReady = false;

/**
 * Initialize Stockfish engine
 */
function initStockfish() {
  try {
    // TODO: Load the actual Stockfish worker from /public/libs/stockfish.js
    // For now, this is a stub that will be implemented in future PRs
    console.log('[Stockfish Worker] Initializing engine...');

    // Placeholder for loading Stockfish
    // stockfishEngine = new Worker('/libs/stockfish.js');

    // stockfishEngine.onmessage = (event) => {
    //   handleStockfishMessage(event.data);
    // };

    // Send UCI init command
    // sendCommand('uci');

    isReady = false; // Will be set to true when we receive 'uciok'
  } catch (error) {
    console.error('[Stockfish Worker] Failed to initialize:', error);
    ctx.postMessage({ type: 'error', error: 'Failed to initialize Stockfish' });
  }
}

/**
 * Handle messages from Stockfish engine
 */
function handleStockfishMessage(message: string) {
  console.log('[Stockfish Worker] Engine message:', message);

  if (message === 'uciok') {
    isReady = true;
    ctx.postMessage({ type: 'ready' });
    return;
  }

  if (message.startsWith('info')) {
    // TODO: Parse UCI info lines using logic from src/engine/uci-parser.ts
    ctx.postMessage({ type: 'info', data: message });
    return;
  }

  if (message.startsWith('bestmove')) {
    // TODO: Parse bestmove and send to main thread
    ctx.postMessage({ type: 'bestmove', data: message });
    return;
  }
}

/**
 * Send command to Stockfish engine
 */
function sendCommand(command: string) {
  if (stockfishEngine) {
    console.log('[Stockfish Worker] Sending command:', command);
    stockfishEngine.postMessage(command);
  } else {
    console.error('[Stockfish Worker] Engine not initialized');
  }
}

/**
 * Handle messages from main thread
 */
ctx.onmessage = (event: MessageEvent) => {
  const { type, data } = event.data;

  switch (type) {
    case 'init':
      initStockfish();
      break;

    case 'analyze':
      // TODO: Start analysis with specified depth
      console.log('[Stockfish Worker] Starting analysis...', data);
      // sendCommand('position fen ' + data.fen);
      // sendCommand('go depth ' + data.depth);
      break;

    case 'stop':
      // TODO: Stop current analysis
      console.log('[Stockfish Worker] Stopping analysis...');
      // sendCommand('stop');
      break;

    case 'command':
      // Send raw UCI command
      sendCommand(data);
      break;

    default:
      console.warn('[Stockfish Worker] Unknown message type:', type);
  }
};

// Log that the worker is loaded
console.log('[Stockfish Worker] Worker script loaded');

// Notify main thread that worker is ready to receive commands
ctx.postMessage({ type: 'worker-ready' });
