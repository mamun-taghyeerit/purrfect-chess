/**
 * Position utilities for Purrfect Chess
 * 
 * Provides helpers for parsing and generating FEN (Forsyth-Edwards Notation) strings
 * and converting them to/from board representations.
 */

/**
 * Parse a FEN string into a plain JS object representing board state
 * 
 * @param {string} fen - FEN string to parse
 * @returns {Object|null} Board state object or null if invalid
 * @property {string} piecePlacement - Piece placement data (ranks separated by /)
 * @property {string} activeColor - Active color ('w' or 'b')
 * @property {string} castling - Castling availability (KQkq or -)
 * @property {string} enPassant - En passant target square (e.g., 'e3' or '-')
 * @property {number} halfmove - Halfmove clock
 * @property {number} fullmove - Fullmove number
 */
export function parseFEN(fen) {
  if (typeof fen !== 'string' || !fen.trim()) {
    return null;
  }

  const parts = fen.trim().split(/\s+/);
  if (parts.length < 4) {
    return null; // Minimum required: piece placement, active color, castling, en passant
  }

  const [piecePlacement, activeColor, castling, enPassant, halfmoveStr, fullmoveStr] = parts;

  // Validate piece placement (should have 8 ranks separated by /)
  const ranks = piecePlacement.split('/');
  if (ranks.length !== 8) {
    return null;
  }

  // Validate active color
  if (activeColor !== 'w' && activeColor !== 'b') {
    return null;
  }

  // Parse halfmove and fullmove (defaults if not present)
  const halfmove = halfmoveStr ? parseInt(halfmoveStr, 10) : 0;
  const fullmove = fullmoveStr ? parseInt(fullmoveStr, 10) : 1;

  return {
    piecePlacement,
    activeColor,
    castling,
    enPassant,
    halfmove: Number.isNaN(halfmove) ? 0 : halfmove,
    fullmove: Number.isNaN(fullmove) ? 1 : fullmove,
  };
}

/**
 * Generate a FEN string from a board state object
 * 
 * @param {Object} boardState - Board state object
 * @param {string} boardState.piecePlacement - Piece placement data
 * @param {string} boardState.activeColor - Active color ('w' or 'b')
 * @param {string} boardState.castling - Castling availability
 * @param {string} boardState.enPassant - En passant target square
 * @param {number} [boardState.halfmove=0] - Halfmove clock
 * @param {number} [boardState.fullmove=1] - Fullmove number
 * @returns {string|null} FEN string or null if invalid
 */
export function generateFEN(boardState) {
  if (!boardState || typeof boardState !== 'object') {
    return null;
  }

  const {
    piecePlacement,
    activeColor,
    castling,
    enPassant,
    halfmove = 0,
    fullmove = 1,
  } = boardState;

  // Validate required fields
  if (typeof piecePlacement !== 'string' || !piecePlacement) {
    return null;
  }
  if (activeColor !== 'w' && activeColor !== 'b') {
    return null;
  }
  if (typeof castling !== 'string') {
    return null;
  }
  if (typeof enPassant !== 'string') {
    return null;
  }

  // Validate halfmove and fullmove numbers
  if (typeof halfmove === 'number' && (!Number.isFinite(halfmove) || Math.floor(halfmove) < 0)) {
    return null;
  }
  if (typeof fullmove === 'number' && (!Number.isFinite(fullmove) || Math.floor(fullmove) < 1)) {
    return null;
  }

  const halfmoveNum = typeof halfmove === 'number' ? Math.floor(halfmove) : 0;
  const fullmoveNum = typeof fullmove === 'number' ? Math.floor(fullmove) : 1;

  return `${piecePlacement} ${activeColor} ${castling} ${enPassant} ${halfmoveNum} ${fullmoveNum}`;
}

/**
 * Convert a FEN string to a board array suitable for rendering
 * 
 * This is a convenience function that parses the FEN and extracts
 * the piece placement into an 8x8 array structure.
 * 
 * @param {string} fen - FEN string
 * @returns {Array<Array<Object|null>>|null} 8x8 board array or null if invalid
 * Each cell contains {type: string, color: string} or null for empty squares
 */
export function boardFromFEN(fen) {
  const state = parseFEN(fen);
  if (!state) {
    return null;
  }

  const board = [];
  const ranks = state.piecePlacement.split('/');

  for (const rank of ranks) {
    const row = [];
    for (const char of rank) {
      if (char >= '1' && char <= '8') {
        // Empty squares
        const count = parseInt(char, 10);
        for (let i = 0; i < count; i++) {
          row.push(null);
        }
      } else {
        // Piece
        const color = char === char.toUpperCase() ? 'w' : 'b';
        const type = char.toLowerCase();
        row.push({ type, color });
      }
    }
    board.push(row);
  }

  return board.length === 8 ? board : null;
}
