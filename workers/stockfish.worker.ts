/**
 * Stockfish Web Worker
 *
 * Integrates Stockfish 17.1 (lite-single WASM variant) for engine analysis.
 * Uses the chess.com maintained stockfish binaries loaded from /public/libs/
 *
 * Stockfish Details:
 * - Version: 17.1 (hash: 03e3232)
 * - Variant: Lite Single-threaded WASM
 * - Size: ~7MB WASM + ~21KB JS wrapper
 * - Threading: Single-threaded (no SharedArrayBuffer required)
 * - CORS: Does not require special CORS headers
 * - Strength: Weaker than full version but suitable for browser-based analysis
 * - NNUE: Smaller neural network evaluation
 *
 * This variant was chosen for:
 * 1. No CORS header requirements (works in all deployment scenarios)
 * 2. Reasonable file size (~7MB vs ~75MB for full version)
 * 3. Full WASM support (faster than asm.js fallback)
 * 4. Single-threaded (simpler threading model, better compatibility)
 *
 * Key features:
 * - UCI protocol implementation
 * - Multi-PV analysis support
 * - Depth-based and time-based analysis
 * - Real-time analysis updates
 */

import { parseInfoLine, parseBestMove } from '@/lib/uci-parser';
import type { UciInfoResult } from '@/lib/uci-parser';

// @ts-ignore - Worker context
const ctx: Worker = self as any;

let stockfishEngine: Worker | null = null;
let isReady = false;
let isAnalyzing = false;

/**
 * Initialize Stockfish engine from public/libs/
 */
function initStockfish() {
  try {
    console.log(
      '[Stockfish Worker] Initializing Stockfish 17.1 (lite-single WASM)...'
    );

    // Load the stockfish worker from public/libs/
    // Using lite-single variant: single-threaded WASM, ~7MB, no CORS required
    stockfishEngine = new Worker('/libs/stockfish-lite-single.js');

    // Set up message handler
    stockfishEngine.onmessage = (event: MessageEvent) => {
      handleStockfishMessage(event.data);
    };

    stockfishEngine.onerror = (error: ErrorEvent) => {
      console.error('[Stockfish Worker] Engine error:', error);
      ctx.postMessage({
        type: 'error',
        error: 'Stockfish engine error: ' + error.message,
      });
    };

    // Send UCI init command
    sendCommand('uci');
  } catch (error) {
    console.error('[Stockfish Worker] Failed to initialize:', error);
    ctx.postMessage({
      type: 'error',
      error: 'Failed to initialize Stockfish: ' + (error as Error).message,
    });
  }
}

/**
 * Handle messages from Stockfish engine
 */
function handleStockfishMessage(message: string | { data?: string }) {
  // Handle both string messages and object messages
  const trimmed =
    typeof message === 'string' ? message.trim() : (message.data || '').trim();

  if (!trimmed) return;

  // Log raw UCI messages for debugging (commented out for production)
  // console.log('[Stockfish Worker] UCI:', trimmed);

  if (trimmed === 'uciok') {
    // Engine initialized, send isready
    sendCommand('isready');
    return;
  }

  if (trimmed === 'readyok') {
    if (!isReady) {
      isReady = true;
      console.log(
        '[Stockfish Worker] Engine ready (Stockfish 17.1 lite-single WASM)'
      );
      ctx.postMessage({ type: 'ready' });
    }
    return;
  }

  if (trimmed.startsWith('info')) {
    // Parse and forward info lines
    const parsed = parseInfoLine(trimmed);
    if (parsed) {
      ctx.postMessage({ type: 'info', data: parsed });
    }
    return;
  }

  if (trimmed.startsWith('bestmove')) {
    // Parse and forward bestmove
    const parsed = parseBestMove(trimmed);
    if (parsed) {
      isAnalyzing = false;
      ctx.postMessage({ type: 'bestmove', data: parsed });
    }
    return;
  }
}

/**
 * Send command to Stockfish engine
 */
function sendCommand(command: string) {
  if (stockfishEngine) {
    // console.log('[Stockfish Worker] Sending command:', command);
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

    case 'analyze': {
      if (!isReady) {
        ctx.postMessage({
          type: 'error',
          error: 'Engine not ready',
        });
        return;
      }

      const { fen, depth = 16, multipv = 3, movetime = null } = data;

      console.log(
        `[Stockfish Worker] Starting analysis: depth=${depth}, multipv=${multipv}`
      );

      isAnalyzing = true;

      // Stop any ongoing analysis
      sendCommand('stop');

      // Small delay to ensure stop is processed
      setTimeout(() => {
        // Configure and start new analysis
        sendCommand('ucinewgame');
        sendCommand(`setoption name MultiPV value ${multipv}`);
        sendCommand(`position fen ${fen}`);

        if (movetime !== null && Number.isFinite(movetime) && movetime > 0) {
          sendCommand(`go movetime ${movetime}`);
        } else {
          sendCommand(`go depth ${depth}`);
        }
      }, 10);
      break;
    }

    case 'stop':
      console.log('[Stockfish Worker] Stopping analysis');
      if (isAnalyzing) {
        sendCommand('stop');
        isAnalyzing = false;
      }
      break;

    case 'command':
      // Send raw UCI command (for advanced use)
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
