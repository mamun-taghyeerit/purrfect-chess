/**
 * Unit tests for Position Utils Module
 */

import { describe, it, expect } from 'vitest';
import {
  parseFEN,
  generateFEN,
  boardFromFEN,
} from '../../src/game/position-utils.ts';

// Standard starting position FEN
const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

describe('parseFEN', () => {
  describe('valid FEN strings', () => {
    it('should parse the starting position correctly', () => {
      const result = parseFEN(STARTING_FEN);
      expect(result).not.toBeNull();
      expect(result.piecePlacement).toBe(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'
      );
      expect(result.activeColor).toBe('w');
      expect(result.castling).toBe('KQkq');
      expect(result.enPassant).toBe('-');
      expect(result.halfmove).toBe(0);
      expect(result.fullmove).toBe(1);
    });

    it('should parse a position after e4', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      const result = parseFEN(fen);
      expect(result).not.toBeNull();
      expect(result.piecePlacement).toBe(
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR'
      );
      expect(result.activeColor).toBe('b');
      expect(result.castling).toBe('KQkq');
      expect(result.enPassant).toBe('e3');
      expect(result.halfmove).toBe(0);
      expect(result.fullmove).toBe(1);
    });

    it('should parse a mid-game position', () => {
      const fen =
        'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4';
      const result = parseFEN(fen);
      expect(result).not.toBeNull();
      expect(result.activeColor).toBe('w');
      expect(result.castling).toBe('KQkq');
      expect(result.enPassant).toBe('-');
      expect(result.halfmove).toBe(4);
      expect(result.fullmove).toBe(4);
    });

    it('should handle no castling rights', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1';
      const result = parseFEN(fen);
      expect(result).not.toBeNull();
      expect(result.castling).toBe('-');
    });

    it('should handle partial castling rights', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w Kq - 0 1';
      const result = parseFEN(fen);
      expect(result).not.toBeNull();
      expect(result.castling).toBe('Kq');
    });

    it('should default halfmove and fullmove if not present', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -';
      const result = parseFEN(fen);
      expect(result).not.toBeNull();
      expect(result.halfmove).toBe(0);
      expect(result.fullmove).toBe(1);
    });
  });

  describe('invalid FEN strings', () => {
    it('should return null for null input', () => {
      expect(parseFEN(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(parseFEN(undefined)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(parseFEN('')).toBeNull();
      expect(parseFEN('   ')).toBeNull();
    });

    it('should return null for incomplete FEN (missing fields)', () => {
      expect(
        parseFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR')
      ).toBeNull();
      expect(
        parseFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w')
      ).toBeNull();
      expect(
        parseFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq')
      ).toBeNull();
    });

    it('should return null for invalid rank count', () => {
      expect(
        parseFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP w KQkq - 0 1')
      ).toBeNull(); // 7 ranks
      expect(
        parseFEN('rnbqkbnr/pppppppp/8/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
      ).toBeNull(); // 9 ranks
    });

    it('should return null for invalid active color', () => {
      expect(
        parseFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR x KQkq - 0 1')
      ).toBeNull();
      expect(
        parseFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR W KQkq - 0 1')
      ).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle extra whitespace', () => {
      const fen =
        '  rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR   w   KQkq   -   0   1  ';
      const result = parseFEN(fen);
      expect(result).not.toBeNull();
      expect(result.activeColor).toBe('w');
    });

    it('should handle non-numeric halfmove/fullmove', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - x y';
      const result = parseFEN(fen);
      expect(result).not.toBeNull();
      expect(result.halfmove).toBe(0);
      expect(result.fullmove).toBe(1);
    });
  });
});

describe('generateFEN', () => {
  describe('valid board states', () => {
    it('should generate FEN for starting position', () => {
      const state = {
        piecePlacement: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',
        activeColor: 'w',
        castling: 'KQkq',
        enPassant: '-',
        halfmove: 0,
        fullmove: 1,
      };
      expect(generateFEN(state)).toBe(STARTING_FEN);
    });

    it('should generate FEN with different values', () => {
      const state = {
        piecePlacement: 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R',
        activeColor: 'b',
        castling: 'KQkq',
        enPassant: '-',
        halfmove: 3,
        fullmove: 3,
      };
      expect(generateFEN(state)).toBe(
        'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3'
      );
    });

    it('should handle en passant square', () => {
      const state = {
        piecePlacement: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR',
        activeColor: 'b',
        castling: 'KQkq',
        enPassant: 'e3',
        halfmove: 0,
        fullmove: 1,
      };
      expect(generateFEN(state)).toBe(
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
      );
    });

    it('should default halfmove and fullmove if not provided', () => {
      const state = {
        piecePlacement: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',
        activeColor: 'w',
        castling: 'KQkq',
        enPassant: '-',
      };
      expect(generateFEN(state)).toBe(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      );
    });

    it('should handle zero halfmove', () => {
      const state = {
        piecePlacement: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',
        activeColor: 'w',
        castling: 'KQkq',
        enPassant: '-',
        halfmove: 0,
        fullmove: 1,
      };
      expect(generateFEN(state)).toBe(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      );
    });

    it('should handle large move numbers', () => {
      const state = {
        piecePlacement: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',
        activeColor: 'w',
        castling: 'KQkq',
        enPassant: '-',
        halfmove: 50,
        fullmove: 100,
      };
      expect(generateFEN(state)).toBe(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 50 100'
      );
    });
  });

  describe('invalid board states', () => {
    it('should return null for negative halfmove', () => {
      const state = {
        piecePlacement: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',
        activeColor: 'w',
        castling: 'KQkq',
        enPassant: '-',
        halfmove: -5,
        fullmove: 1,
      };
      expect(generateFEN(state)).toBeNull();
    });

    it('should return null for negative fullmove', () => {
      const state = {
        piecePlacement: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',
        activeColor: 'w',
        castling: 'KQkq',
        enPassant: '-',
        halfmove: 0,
        fullmove: -10,
      };
      expect(generateFEN(state)).toBeNull();
    });

    it('should return null for zero fullmove', () => {
      const state = {
        piecePlacement: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',
        activeColor: 'w',
        castling: 'KQkq',
        enPassant: '-',
        halfmove: 0,
        fullmove: 0,
      };
      expect(generateFEN(state)).toBeNull();
    });
  });

  describe('invalid board states', () => {
    it('should return null for null input', () => {
      expect(generateFEN(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(generateFEN(undefined)).toBeNull();
    });

    it('should return null for missing piece placement', () => {
      const state = {
        activeColor: 'w',
        castling: 'KQkq',
        enPassant: '-',
      };
      expect(generateFEN(state)).toBeNull();
    });

    it('should return null for invalid active color', () => {
      const state = {
        piecePlacement: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',
        activeColor: 'x',
        castling: 'KQkq',
        enPassant: '-',
      };
      expect(generateFEN(state)).toBeNull();
    });

    it('should return null for non-string castling', () => {
      const state = {
        piecePlacement: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',
        activeColor: 'w',
        castling: null,
        enPassant: '-',
      };
      expect(generateFEN(state)).toBeNull();
    });
  });
});

describe('boardFromFEN', () => {
  describe('valid conversions', () => {
    it('should convert starting position to 8x8 board', () => {
      const board = boardFromFEN(STARTING_FEN);
      expect(board).not.toBeNull();
      expect(board.length).toBe(8);
      expect(board[0].length).toBe(8);

      // Check first rank (black pieces)
      expect(board[0][0]).toEqual({ type: 'r', color: 'b' });
      expect(board[0][4]).toEqual({ type: 'k', color: 'b' });

      // Check second rank (black pawns)
      expect(board[1][0]).toEqual({ type: 'p', color: 'b' });

      // Check middle ranks (empty)
      expect(board[3][3]).toBeNull();
      expect(board[4][4]).toBeNull();

      // Check seventh rank (white pawns)
      expect(board[6][0]).toEqual({ type: 'p', color: 'w' });

      // Check eighth rank (white pieces)
      expect(board[7][0]).toEqual({ type: 'r', color: 'w' });
      expect(board[7][4]).toEqual({ type: 'k', color: 'w' });
    });

    it('should handle position with mixed pieces and empty squares', () => {
      const fen =
        'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4';
      const board = boardFromFEN(fen);
      expect(board).not.toBeNull();
      expect(board.length).toBe(8);

      // Check specific positions
      expect(board[0][0]).toEqual({ type: 'r', color: 'b' }); // a8
      expect(board[0][1]).toBeNull(); // b8 empty
      expect(board[2][2]).toEqual({ type: 'n', color: 'b' }); // c6
    });

    it('should handle all empty ranks correctly', () => {
      const fen = '8/8/8/8/8/8/8/8 w - - 0 1';
      const board = boardFromFEN(fen);
      expect(board).not.toBeNull();
      expect(board.length).toBe(8);
      board.forEach((rank) => {
        expect(rank.length).toBe(8);
        rank.forEach((square) => {
          expect(square).toBeNull();
        });
      });
    });
  });

  describe('invalid conversions', () => {
    it('should return null for invalid FEN', () => {
      expect(boardFromFEN(null)).toBeNull();
      expect(boardFromFEN('')).toBeNull();
      expect(boardFromFEN('invalid fen')).toBeNull();
    });

    it('should return null for malformed FEN', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP w KQkq - 0 1'; // Only 7 ranks
      expect(boardFromFEN(fen)).toBeNull();
    });
  });
});

describe('round-trip conversion', () => {
  it('should preserve FEN through parse -> generate cycle', () => {
    const fens = [
      STARTING_FEN,
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
      'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1',
    ];

    fens.forEach((fen) => {
      const parsed = parseFEN(fen);
      expect(parsed).not.toBeNull();
      const generated = generateFEN(parsed);
      expect(generated).toBe(fen);
    });
  });
});
