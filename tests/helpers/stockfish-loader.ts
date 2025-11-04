/**
 * Stockfish Engine Loader for Tests
 *
 * Provides a way to load the actual Stockfish engine in Node.js/test environment
 * using the stockfish npm package's official loadEngine helper.
 */

import { join } from 'path';

// Use CommonJS require for the loadEngine helper
const loadEngineHelper = require('../../node_modules/stockfish/examples/loadEngine.js');

export interface StockfishEngine {
  send: (
    command: string,
    onDone?: (data: string) => void,
    onStream?: (data: string) => void
  ) => void;
  quit: () => void;
  stream?: (line: string) => void;
  loaded?: boolean;
  ready?: boolean;
}

/**
 * Loads Stockfish engine using the official loadEngine helper
 * Uses the lite-single variant (stockfish-17.1-lite-single-03e3232.js)
 */
export function loadStockfish(): StockfishEngine {
  const stockfishPath = join(
    __dirname,
    '../../node_modules/stockfish/src/stockfish-17.1-lite-single-03e3232.js'
  );

  const engine = loadEngineHelper(stockfishPath);

  return engine;
}

/**
 * Helper to analyze a position and return all UCI output lines
 */
export async function analyzePosition(
  fen: string,
  options: {
    depth?: number;
    multipv?: number;
    timeout?: number;
  } = {}
): Promise<string[]> {
  const { depth = 10, multipv = 3, timeout = 10000 } = options;

  const engine = loadStockfish();
  const lines: string[] = [];
  let isReady = false;

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      engine.quit();
      reject(new Error(`Analysis timeout after ${timeout}ms`));
    }, timeout);

    // Stream all output
    engine.stream = (line: string) => {
      lines.push(line);

      // Check for readyok to know engine is initialized
      if (line === 'readyok' && !isReady) {
        isReady = true;
        // Start analysis
        engine.send('ucinewgame');
        engine.send(`setoption name MultiPV value ${multipv}`);
        engine.send(`position fen ${fen}`);
        engine.send(`go depth ${depth}`);
        return;
      }

      // Check for bestmove to know analysis is complete
      if (line.startsWith('bestmove')) {
        clearTimeout(timer);
        engine.quit();
        resolve(lines);
      }
    };

    // Initialize engine
    engine.send('uci');
    engine.send('isready');
  });
}
