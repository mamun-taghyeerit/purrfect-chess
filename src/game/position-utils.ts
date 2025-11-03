/**
 * Position utilities for Purrfect Chess
 *
 * Provides helpers for parsing and generating FEN (Forsyth-Edwards Notation) strings
 * and converting them to/from board representations.
 */

/**
 * Board state from FEN parsing
 */
export interface FenBoardState {
  piecePlacement: string;
  activeColor: 'w' | 'b';
  castling: string;
  enPassant: string;
  halfmove: number;
  fullmove: number;
}

/**
 * Chess piece representation
 */
export interface Piece {
  type: string;
  color: 'w' | 'b';
}

/**
 * Parse a FEN string into a plain JS object representing board state
 *
 * @param fen - FEN string to parse
 * @returns Board state object or null if invalid
 */
export function parseFEN(fen: string): FenBoardState | null {
  if (typeof fen !== 'string' || !fen.trim()) {
    return null;
  }

  const parts = fen.trim().split(/\s+/);
  if (parts.length < 4) {
    return null; // Minimum required: piece placement, active color, castling, en passant
  }

  const [
    piecePlacement,
    activeColor,
    castling,
    enPassant,
    halfmoveStr,
    fullmoveStr,
  ] = parts;

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
 * @param boardState - Board state object
 * @returns FEN string or null if invalid
 */
export function generateFEN(boardState: Partial<FenBoardState>): string | null {
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
  if (
    typeof halfmove === 'number' &&
    (!Number.isFinite(halfmove) || Math.floor(halfmove) < 0)
  ) {
    return null;
  }
  if (
    typeof fullmove === 'number' &&
    (!Number.isFinite(fullmove) || Math.floor(fullmove) < 1)
  ) {
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
 * @param fen - FEN string
 * @returns 8x8 board array or null if invalid. Each cell contains {type: string, color: string} or null for empty squares
 */
export function boardFromFEN(fen: string): (Piece | null)[][] | null {
  const state = parseFEN(fen);
  if (!state) {
    return null;
  }

  const board: (Piece | null)[][] = [];
  const ranks = state.piecePlacement.split('/');

  for (const rank of ranks) {
    const row: (Piece | null)[] = [];
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
