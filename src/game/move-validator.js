/**
 * Move validation utilities for Purrfect Chess
 * 
 * Provides basic move validation and SAN (Standard Algebraic Notation) parsing.
 * Note: This module provides conservative validation and does NOT implement full
 * chess engine legality checks (e.g., king-in-check). Use chess.js for full validation.
 */

/**
 * Validate a move with basic sanity checks
 * 
 * Performs conservative validation:
 * - Source and destination squares must be in valid range (a1-h8)
 * - Source and destination must be different
 * - Basic format checks
 * 
 * Does NOT check:
 * - Full chess legality (e.g., whether move puts king in check)
 * - Piece movement rules
 * - Turn order
 * 
 * @param {Object} move - Move object
 * @param {string} move.from - Source square (e.g., 'e2')
 * @param {string} move.to - Destination square (e.g., 'e4')
 * @param {Object} [boardState] - Optional board state (not used in basic validation)
 * @returns {Object} Validation result
 * @property {boolean} valid - Whether move passes basic validation
 * @property {string} [reason] - Reason for failure if invalid
 */
export function validateMove(move, boardState) {
  // Check move object exists
  if (!move || typeof move !== 'object') {
    return { valid: false, reason: 'Move must be an object' };
  }

  // Check from square
  if (typeof move.from !== 'string' || !isValidSquare(move.from)) {
    return { valid: false, reason: 'Invalid source square' };
  }

  // Check to square
  if (typeof move.to !== 'string' || !isValidSquare(move.to)) {
    return { valid: false, reason: 'Invalid destination square' };
  }

  // Check that source and destination are different
  if (move.from === move.to) {
    return { valid: false, reason: 'Source and destination must be different' };
  }

  // Basic validation passed
  return { valid: true };
}

/**
 * Check if a square name is valid (a1-h8)
 * 
 * @param {string} square - Square name to validate
 * @returns {boolean} True if valid square name
 */
function isValidSquare(square) {
  if (typeof square !== 'string' || square.length !== 2) {
    return false;
  }

  const file = square[0];
  const rank = square[1];

  return file >= 'a' && file <= 'h' && rank >= '1' && rank <= '8';
}

/**
 * Convert basic SAN notation to move object
 * 
 * Supports common cases:
 * - Pawn moves: e4, e5, d4
 * - Piece moves: Nf3, Bc4, Qd1
 * - Captures: exd5, Nxf7
 * - Castling: O-O (kingside), O-O-O (queenside)
 * - Promotions: e8=Q, e8Q
 * 
 * Limitations (documented for future enhancement):
 * - Does not handle disambiguation (Nbd7, R1a3)
 * - Does not validate move legality
 * - Does not determine source square for piece moves (returns null)
 * - Check (+) and checkmate (#) symbols are stripped but not validated
 * 
 * @param {string} san - SAN notation string
 * @param {Object} [boardState] - Optional board state (not used in basic conversion)
 * @returns {Object|null} Move object or null if cannot parse. Note: disambiguation 
 *   (Nbd7, R1a3) is not supported - returns null for such moves.
 * @property {string|null} from - Source square (null for piece moves without board state)
 * @property {string} to - Destination square
 * @property {string} [promotion] - Promotion piece type if applicable
 * @property {boolean} [castling] - True if castling move
 */
export function sanToMove(san, boardState) {
  if (typeof san !== 'string' || !san.trim()) {
    return null;
  }

  const sanitized = san.trim().replace(/[+#!?]/g, ''); // Remove check/mate/annotation symbols

  // Handle castling
  if (sanitized === 'O-O' || sanitized === '0-0') {
    // Kingside castling - actual squares depend on board state/color
    return { from: null, to: null, castling: 'k' };
  }
  if (sanitized === 'O-O-O' || sanitized === '0-0-0') {
    // Queenside castling
    return { from: null, to: null, castling: 'q' };
  }

  // Handle promotions (e.g., e8=Q or e8Q)
  const promotionMatch = sanitized.match(/([a-h][18])(?:=)?([QRBN])/i);
  if (promotionMatch) {
    return {
      from: null, // Would need board state to determine
      to: promotionMatch[1],
      promotion: promotionMatch[2].toLowerCase(),
    };
  }

  // Handle piece moves (e.g., Nf3, Bc4)
  const pieceMatch = sanitized.match(/^([KQRBN])([a-h][1-8])$/);
  if (pieceMatch) {
    return {
      from: null, // Cannot determine without board state
      to: pieceMatch[2],
      piece: pieceMatch[1].toLowerCase(),
    };
  }

  // Handle piece captures (e.g., Nxf7, Bxc6)
  const pieceCaptureMatch = sanitized.match(/^([KQRBN])x([a-h][1-8])$/);
  if (pieceCaptureMatch) {
    return {
      from: null, // Cannot determine without board state
      to: pieceCaptureMatch[2],
      piece: pieceCaptureMatch[1].toLowerCase(),
      capture: true,
    };
  }

  // Handle pawn moves (e.g., e4, d5)
  const pawnMatch = sanitized.match(/^([a-h][1-8])$/);
  if (pawnMatch) {
    return {
      from: null, // Would need board state to determine source rank
      to: pawnMatch[1],
    };
  }

  // Handle pawn captures (e.g., exd5, fxe6)
  const pawnCaptureMatch = sanitized.match(/^([a-h])x([a-h][1-8])$/);
  if (pawnCaptureMatch) {
    return {
      from: null, // Would need board state to determine source rank
      to: pawnCaptureMatch[2],
      capture: true,
    };
  }

  // Could not parse
  return null;
}
