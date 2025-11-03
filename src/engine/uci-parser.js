/**
 * UCI Parser Module
 * 
 * Extracts and parses UCI (Universal Chess Interface) protocol messages from Stockfish.
 * This module provides defensive parsing for:
 * - info lines (depth, multipv, score cp/mate, pv, nodes, time, etc.)
 * - bestmove lines (bestmove + optional ponder)
 */

/**
 * Parses a UCI "info" line and extracts relevant analysis data.
 * 
 * @param {string} line - The raw UCI info line (e.g., "info depth 20 multipv 1 score cp 25 pv e2e4 e7e5")
 * @returns {Object|null} Parsed info object or null if line is invalid/incomplete
 * 
 * Returned object structure:
 * {
 *   depth: number | null,
 *   multipv: number | null,
 *   score: { type: 'cp' | 'mate', value: number } | null,
 *   pv: string | null,           // First move in UCI format (e.g., "e2e4")
 *   pvLine: string | null,        // Full PV line, space-separated moves
 *   nodes: number | null,
 *   time: number | null,
 *   nps: number | null,           // Nodes per second
 *   hashfull: number | null,      // Hash table utilization (0-1000)
 *   seldepth: number | null,      // Selective search depth
 *   tbhits: number | null         // Tablebase hits
 * }
 */
export function parseInfoLine(line) {
  if (!line || typeof line !== 'string') {
    return null;
  }

  // Trim and verify it's an info line
  const trimmed = line.trim();
  if (!trimmed.startsWith('info')) {
    return null;
  }

  const result = {
    depth: null,
    multipv: null,
    score: null,
    pv: null,
    pvLine: null,
    nodes: null,
    time: null,
    nps: null,
    hashfull: null,
    seldepth: null,
    tbhits: null
  };

  // Extract depth
  const depthMatch = trimmed.match(/\bdepth\s+(\d+)/);
  if (depthMatch) {
    const depth = Number.parseInt(depthMatch[1], 10);
    if (Number.isFinite(depth)) {
      result.depth = depth;
    }
  }

  // Extract selective depth
  const seldepthMatch = trimmed.match(/\bseldepth\s+(\d+)/);
  if (seldepthMatch) {
    const seldepth = Number.parseInt(seldepthMatch[1], 10);
    if (Number.isFinite(seldepth)) {
      result.seldepth = seldepth;
    }
  }

  // Extract multipv
  const multipvMatch = trimmed.match(/\bmultipv\s+(\d+)/);
  if (multipvMatch) {
    const multipv = Number.parseInt(multipvMatch[1], 10);
    if (Number.isFinite(multipv)) {
      result.multipv = multipv;
    }
  }

  // Extract score (cp or mate)
  const scoreMatch = trimmed.match(/\bscore\s+(cp|mate)\s+(-?\d+)/);
  if (scoreMatch) {
    const value = Number.parseInt(scoreMatch[2], 10);
    if (Number.isFinite(value)) {
      result.score = {
        type: scoreMatch[1],
        value: value
      };
    }
  }

  // Extract PV (principal variation)
  const pvMatch = trimmed.match(/\bpv\s+(.+?)(?:\s+(?:bmc|wdl|string|refutation|currline)|$)/);
  if (pvMatch) {
    const rawPv = pvMatch[1].trim();
    // Filter tokens to only include valid UCI moves (4-5 characters: e2e4, e7e8q, etc.)
    const tokens = rawPv.split(/\s+/);
    const moves = tokens.filter(token => /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(token));
    
    if (moves.length > 0) {
      result.pv = moves[0];           // First move
      result.pvLine = moves.join(' '); // Full PV line (moves only)
    }
  }

  // Extract nodes
  const nodesMatch = trimmed.match(/\bnodes\s+(\d+)/);
  if (nodesMatch) {
    const nodes = Number.parseInt(nodesMatch[1], 10);
    if (Number.isFinite(nodes)) {
      result.nodes = nodes;
    }
  }

  // Extract time (milliseconds)
  const timeMatch = trimmed.match(/\btime\s+(\d+)/);
  if (timeMatch) {
    const time = Number.parseInt(timeMatch[1], 10);
    if (Number.isFinite(time)) {
      result.time = time;
    }
  }

  // Extract nps (nodes per second)
  const npsMatch = trimmed.match(/\bnps\s+(\d+)/);
  if (npsMatch) {
    const nps = Number.parseInt(npsMatch[1], 10);
    if (Number.isFinite(nps)) {
      result.nps = nps;
    }
  }

  // Extract hashfull (hash table utilization, 0-1000)
  const hashfullMatch = trimmed.match(/\bhashfull\s+(\d+)/);
  if (hashfullMatch) {
    const hashfull = Number.parseInt(hashfullMatch[1], 10);
    if (Number.isFinite(hashfull)) {
      result.hashfull = hashfull;
    }
  }

  // Extract tbhits (tablebase hits)
  const tbhitsMatch = trimmed.match(/\btbhits\s+(\d+)/);
  if (tbhitsMatch) {
    const tbhits = Number.parseInt(tbhitsMatch[1], 10);
    if (Number.isFinite(tbhits)) {
      result.tbhits = tbhits;
    }
  }

  return result;
}

/**
 * Parses a UCI "bestmove" line.
 * 
 * @param {string} line - The raw UCI bestmove line (e.g., "bestmove e2e4" or "bestmove e2e4 ponder e7e5")
 * @returns {Object|null} Parsed bestmove object or null if invalid
 * 
 * Returned object structure:
 * {
 *   bestmove: string,      // Best move in UCI format (e.g., "e2e4")
 *   ponder: string | null  // Ponder move in UCI format (e.g., "e7e5"), or null if not present
 * }
 */
export function parseBestMove(line) {
  if (!line || typeof line !== 'string') {
    return null;
  }

  // Trim and verify it's a bestmove line
  const trimmed = line.trim();
  if (!trimmed.startsWith('bestmove')) {
    return null;
  }

  // Extract bestmove
  const bestmoveMatch = trimmed.match(/^bestmove\s+([a-h][1-8][a-h][1-8][qrbn]?|none|null|\(none\))/);
  if (!bestmoveMatch) {
    return null;
  }

  const bestmove = bestmoveMatch[1];
  
  // Handle special cases (no legal move available)
  if (bestmove === 'none' || bestmove === 'null' || bestmove === '(none)') {
    return {
      bestmove: null,
      ponder: null
    };
  }

  // Extract optional ponder move
  let ponder = null;
  const ponderMatch = trimmed.match(/\bponder\s+([a-h][1-8][a-h][1-8][qrbn]?)/);
  if (ponderMatch) {
    ponder = ponderMatch[1];
  }

  return {
    bestmove: bestmove,
    ponder: ponder
  };
}
