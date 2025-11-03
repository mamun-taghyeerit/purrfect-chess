/**
 * Unit tests for Move Validator Module
 */

import { describe, it, expect } from 'vitest';
import { validateMove, sanToMove } from '../../src/game/move-validator.js';

describe('validateMove', () => {
  describe('valid moves', () => {
    it('should validate a simple pawn move', () => {
      const move = { from: 'e2', to: 'e4' };
      const result = validateMove(move);
      expect(result.valid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should validate knight moves', () => {
      const move = { from: 'g1', to: 'f3' };
      const result = validateMove(move);
      expect(result.valid).toBe(true);
    });

    it('should validate moves across the board', () => {
      const move = { from: 'a1', to: 'h8' };
      const result = validateMove(move);
      expect(result.valid).toBe(true);
    });

    it('should validate moves with extra properties', () => {
      const move = { from: 'e7', to: 'e8', promotion: 'q' };
      const result = validateMove(move);
      expect(result.valid).toBe(true);
    });
  });

  describe('invalid moves', () => {
    it('should reject null move', () => {
      const result = validateMove(null);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Move must be an object');
    });

    it('should reject undefined move', () => {
      const result = validateMove(undefined);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Move must be an object');
    });

    it('should reject move with invalid from square', () => {
      const move = { from: 'invalid', to: 'e4' };
      const result = validateMove(move);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invalid source square');
    });

    it('should reject move with invalid to square', () => {
      const move = { from: 'e2', to: 'invalid' };
      const result = validateMove(move);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invalid destination square');
    });

    it('should reject move with out of range squares', () => {
      expect(validateMove({ from: 'i1', to: 'e4' }).valid).toBe(false);
      expect(validateMove({ from: 'e2', to: 'e9' }).valid).toBe(false);
      expect(validateMove({ from: 'a0', to: 'e4' }).valid).toBe(false);
    });

    it('should reject move where from equals to', () => {
      const move = { from: 'e4', to: 'e4' };
      const result = validateMove(move);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Source and destination must be different');
    });

    it('should reject move with missing from', () => {
      const move = { to: 'e4' };
      const result = validateMove(move);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invalid source square');
    });

    it('should reject move with missing to', () => {
      const move = { from: 'e2' };
      const result = validateMove(move);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invalid destination square');
    });

    it('should reject move with non-string squares', () => {
      expect(validateMove({ from: 1, to: 'e4' }).valid).toBe(false);
      expect(validateMove({ from: 'e2', to: 4 }).valid).toBe(false);
      expect(validateMove({ from: null, to: 'e4' }).valid).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle boardState parameter (not used in basic validation)', () => {
      const move = { from: 'e2', to: 'e4' };
      const boardState = {}; // Not used, but should not cause errors
      const result = validateMove(move, boardState);
      expect(result.valid).toBe(true);
    });
  });
});

describe('sanToMove', () => {
  describe('pawn moves', () => {
    it('should parse simple pawn moves', () => {
      const move = sanToMove('e4');
      expect(move).not.toBeNull();
      expect(move.to).toBe('e4');
      expect(move.from).toBeNull(); // Cannot determine without board state
    });

    it('should parse various pawn moves', () => {
      expect(sanToMove('a3')?.to).toBe('a3');
      expect(sanToMove('h6')?.to).toBe('h6');
      expect(sanToMove('d5')?.to).toBe('d5');
    });

    it('should parse pawn captures', () => {
      const move = sanToMove('exd5');
      expect(move).not.toBeNull();
      expect(move.to).toBe('d5');
      expect(move.capture).toBe(true);
      expect(move.from).toBeNull();
    });

    it('should parse various pawn captures', () => {
      expect(sanToMove('axb3')?.to).toBe('b3');
      expect(sanToMove('fxe6')?.to).toBe('e6');
      expect(sanToMove('hxg7')?.to).toBe('g7');
    });
  });

  describe('piece moves', () => {
    it('should parse knight moves', () => {
      const move = sanToMove('Nf3');
      expect(move).not.toBeNull();
      expect(move.to).toBe('f3');
      expect(move.piece).toBe('n');
      expect(move.from).toBeNull();
    });

    it('should parse various piece moves', () => {
      expect(sanToMove('Bc4')?.to).toBe('c4');
      expect(sanToMove('Qd1')?.to).toBe('d1');
      expect(sanToMove('Rf1')?.to).toBe('f1');
      expect(sanToMove('Kg1')?.to).toBe('g1');
    });

    it('should parse piece captures', () => {
      const move = sanToMove('Nxf7');
      expect(move).not.toBeNull();
      expect(move.to).toBe('f7');
      expect(move.piece).toBe('n');
      expect(move.capture).toBe(true);
    });

    it('should parse various piece captures', () => {
      expect(sanToMove('Bxc6')?.to).toBe('c6');
      expect(sanToMove('Qxd8')?.to).toBe('d8');
      expect(sanToMove('Rxe1')?.to).toBe('e1');
    });
  });

  describe('castling', () => {
    it('should parse kingside castling (O-O)', () => {
      const move = sanToMove('O-O');
      expect(move).not.toBeNull();
      expect(move.castling).toBe('k');
    });

    it('should parse kingside castling (0-0)', () => {
      const move = sanToMove('0-0');
      expect(move).not.toBeNull();
      expect(move.castling).toBe('k');
    });

    it('should parse queenside castling (O-O-O)', () => {
      const move = sanToMove('O-O-O');
      expect(move).not.toBeNull();
      expect(move.castling).toBe('q');
    });

    it('should parse queenside castling (0-0-0)', () => {
      const move = sanToMove('0-0-0');
      expect(move).not.toBeNull();
      expect(move.castling).toBe('q');
    });
  });

  describe('promotions', () => {
    it('should parse promotion with equals sign', () => {
      const move = sanToMove('e8=Q');
      expect(move).not.toBeNull();
      expect(move.to).toBe('e8');
      expect(move.promotion).toBe('q');
    });

    it('should parse promotion without equals sign', () => {
      const move = sanToMove('e8Q');
      expect(move).not.toBeNull();
      expect(move.to).toBe('e8');
      expect(move.promotion).toBe('q');
    });

    it('should parse various promotions', () => {
      expect(sanToMove('a8=R')?.promotion).toBe('r');
      expect(sanToMove('h1=N')?.promotion).toBe('n');
      expect(sanToMove('b8=B')?.promotion).toBe('b');
      expect(sanToMove('d1Q')?.promotion).toBe('q');
    });
  });

  describe('notation symbols', () => {
    it('should strip check symbol (+)', () => {
      const move = sanToMove('Nf3+');
      expect(move).not.toBeNull();
      expect(move.to).toBe('f3');
    });

    it('should strip checkmate symbol (#)', () => {
      const move = sanToMove('Qh7#');
      expect(move).not.toBeNull();
      expect(move.to).toBe('h7');
    });

    it('should strip annotation symbols (!?)', () => {
      expect(sanToMove('e4!')?.to).toBe('e4');
      expect(sanToMove('Nf3?')?.to).toBe('f3');
      expect(sanToMove('Bc4!?')?.to).toBe('c4');
    });
  });

  describe('invalid SAN', () => {
    it('should return null for null input', () => {
      expect(sanToMove(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(sanToMove(undefined)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(sanToMove('')).toBeNull();
      expect(sanToMove('   ')).toBeNull();
    });

    it('should return null for invalid notation', () => {
      expect(sanToMove('invalid')).toBeNull();
      expect(sanToMove('Z4')).toBeNull(); // Invalid file
      expect(sanToMove('e9')).toBeNull(); // Invalid rank
      expect(sanToMove('Xe4')).toBeNull(); // Invalid piece
    });

    it('should return null for unsupported disambiguation', () => {
      // These require board state to parse correctly
      expect(sanToMove('Nbd7')).toBeNull();
      expect(sanToMove('R1a3')).toBeNull();
      expect(sanToMove('Qh4e1')).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle extra whitespace', () => {
      const move = sanToMove('  e4  ');
      expect(move).not.toBeNull();
      expect(move.to).toBe('e4');
    });

    it('should handle boardState parameter (not used in basic conversion)', () => {
      const boardState = {}; // Not used, but should not cause errors
      const move = sanToMove('e4', boardState);
      expect(move).not.toBeNull();
      expect(move.to).toBe('e4');
    });
  });

  describe('documented limitations', () => {
    it('returns null for from square on piece moves (requires board state)', () => {
      expect(sanToMove('Nf3')?.from).toBeNull();
      expect(sanToMove('Bc4')?.from).toBeNull();
    });

    it('returns null for from square on pawn moves (requires board state)', () => {
      expect(sanToMove('e4')?.from).toBeNull();
      expect(sanToMove('exd5')?.from).toBeNull();
    });

    it('does not validate move legality', () => {
      // Parser accepts syntactically valid moves regardless of legality
      const move = sanToMove('Nf3'); // Could be illegal depending on position
      expect(move).not.toBeNull(); // Just checks syntax
    });
  });
});
