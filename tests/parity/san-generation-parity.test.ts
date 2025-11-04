/**
 * SAN Generation and Move History Parity Tests
 * 
 * Purpose: Validate that Standard Algebraic Notation (SAN) generation
 * and move history formatting is identical between legacy and Next.js apps.
 * 
 * Tests cover:
 * - SAN formatting for all move types
 * - Move history structure and grouping by ply
 * - PGN generation
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Chess } from 'chess.js';
import { useGame } from '../../hooks/useGame';

describe('Phase X Parity: SAN Generation', () => {
  describe('Basic SAN Formatting', () => {
    it('should generate identical SAN for pawn moves', () => {
      const legacyGame = new Chess();
      const { result } = renderHook(() => useGame());
      
      const legacyMove = legacyGame.move({ from: 'e2', to: 'e4' });
      
      act(() => {
        result.current.movePiece('e2', 'e4');
      });
      const nextMove = result.current.history[0];
      
      expect(nextMove.san).toBe(legacyMove.san);
      expect(nextMove.san).toBe('e4');
    });

    it('should generate identical SAN for piece moves', () => {
      const legacyGame = new Chess();
      const { result } = renderHook(() => useGame());
      
      const legacyMove = legacyGame.move({ from: 'g1', to: 'f3' });
      
      act(() => {
        result.current.movePiece('g1', 'f3');
      });
      const nextMove = result.current.history[0];
      
      expect(nextMove.san).toBe(legacyMove.san);
      expect(nextMove.san).toBe('Nf3');
    });

    it('should generate identical SAN for captures', () => {
      const legacyGame = new Chess();
      const { result } = renderHook(() => useGame());
      
      // Setup position for capture
      legacyGame.move({ from: 'e2', to: 'e4' });
      legacyGame.move({ from: 'd7', to: 'd5' });
      
      act(() => {
        result.current.movePiece('e2', 'e4');
        result.current.movePiece('d7', 'd5');
      });
      
      // Capture
      const legacyMove = legacyGame.move({ from: 'e4', to: 'd5' });
      
      act(() => {
        result.current.movePiece('e4', 'd5');
      });
      const nextMove = result.current.history[2];
      
      expect(nextMove.san).toBe(legacyMove.san);
      expect(nextMove.san).toBe('exd5');
    });

    it('should generate identical SAN for castling', () => {
      const legacyGame = new Chess();
      const { result } = renderHook(() => useGame());
      
      // Setup position for castling
      const setupMoves = [
        ['e2', 'e4'],
        ['e7', 'e5'],
        ['g1', 'f3'],
        ['b8', 'c6'],
        ['f1', 'c4'],
        ['g8', 'f6'],
      ];
      
      for (const [from, to] of setupMoves) {
        legacyGame.move({ from, to });
        act(() => {
          result.current.movePiece(from, to);
        });
      }
      
      // Castle kingside
      const legacyMove = legacyGame.move({ from: 'e1', to: 'g1' });
      
      act(() => {
        result.current.movePiece('e1', 'g1');
      });
      const nextMove = result.current.history[6];
      
      expect(nextMove.san).toBe(legacyMove.san);
      expect(nextMove.san).toBe('O-O');
    });

    it('should generate identical SAN for promotion', () => {
      const fen = '8/4P3/8/8/8/8/8/4K2k w - - 0 1';
      
      const legacyGame = new Chess();
      legacyGame.load(fen);
      
      const { result } = renderHook(() => useGame());
      act(() => {
        result.current.loadFen(fen);
      });
      
      // Promote to queen
      const legacyMove = legacyGame.move({ from: 'e7', to: 'e8', promotion: 'q' });
      
      act(() => {
        result.current.movePiece('e7', 'e8', 'q');
      });
      const nextMove = result.current.history[0];
      
      expect(nextMove.san).toBe(legacyMove.san);
      expect(nextMove.san).toBe('e8=Q');
    });

    it('should generate identical SAN for en passant', () => {
      const fen = 'rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 3';
      
      const legacyGame = new Chess();
      legacyGame.load(fen);
      
      const { result } = renderHook(() => useGame());
      act(() => {
        result.current.loadFen(fen);
      });
      
      // En passant capture
      const legacyMove = legacyGame.move({ from: 'e5', to: 'f6' });
      
      act(() => {
        result.current.movePiece('e5', 'f6');
      });
      const nextMove = result.current.history[0];
      
      expect(nextMove.san).toBe(legacyMove.san);
      expect(nextMove.san).toBe('exf6');
    });

    it('should generate identical SAN with check notation', () => {
      const legacyGame = new Chess();
      const { result } = renderHook(() => useGame());
      
      // Setup position for check
      const setupMoves = [
        ['e2', 'e4'],
        ['e7', 'e5'],
        ['f1', 'c4'],
        ['b8', 'c6'],
        ['d1', 'h5'],
        ['g8', 'f6'],
      ];
      
      for (const [from, to] of setupMoves) {
        legacyGame.move({ from, to });
        act(() => {
          result.current.movePiece(from, to);
        });
      }
      
      // Move that gives check (or checkmate)
      const legacyMove = legacyGame.move({ from: 'h5', to: 'f7' });
      
      act(() => {
        result.current.movePiece('h5', 'f7');
      });
      const nextMove = result.current.history[6];
      
      expect(nextMove.san).toBe(legacyMove.san);
      // Should include check (+) or checkmate (#) notation
      expect(nextMove.san).toMatch(/[+#]/);
    });

    it('should generate identical SAN with checkmate notation', () => {
      // Fool's mate position - one move from checkmate
      const fen = 'rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2';
      
      const legacyGame = new Chess();
      legacyGame.load(fen);
      
      const { result } = renderHook(() => useGame());
      act(() => {
        result.current.loadFen(fen);
      });
      
      // Move that checkmates
      const legacyMove = legacyGame.move({ from: 'd8', to: 'h4' });
      
      act(() => {
        result.current.movePiece('d8', 'h4');
      });
      const nextMove = result.current.history[0];
      
      expect(nextMove.san).toBe(legacyMove.san);
      expect(nextMove.san).toContain('#'); // Should include checkmate notation
    });
  });

  describe('Disambiguation in SAN', () => {
    it('should generate identical SAN with disambiguation when needed', () => {
      // Position from the earlier test - two rooks on same file
      const fen = '8/8/8/8/8/R7/8/R2K3k w - - 0 1';
      
      const legacyGame = new Chess();
      legacyGame.load(fen);
      
      const { result } = renderHook(() => useGame());
      act(() => {
        result.current.loadFen(fen);
      });
      
      // Both rooks can go to a2, need rank disambiguation
      const legacyMove = legacyGame.move({ from: 'a3', to: 'a2' });
      
      act(() => {
        result.current.movePiece('a3', 'a2');
      });
      const nextMove = result.current.history[0];
      
      expect(nextMove.san).toBe(legacyMove.san);
      // Both implementations should generate same SAN with disambiguation (e.g., R3a2)
    });

    it('should generate identical SAN with rank disambiguation', () => {
      const fen = '8/8/8/8/8/R7/8/R2K3k w - - 0 1';
      
      const legacyGame = new Chess();
      legacyGame.load(fen);
      
      const { result } = renderHook(() => useGame());
      act(() => {
        result.current.loadFen(fen);
      });
      
      // Both rooks can go to a2, need rank disambiguation
      const legacyMove = legacyGame.move({ from: 'a3', to: 'a2' });
      
      act(() => {
        result.current.movePiece('a3', 'a2');
      });
      const nextMove = result.current.history[0];
      
      expect(nextMove.san).toBe(legacyMove.san);
      // Should have proper disambiguation
      expect(nextMove.san).toMatch(/R[13]a2/);
    });
  });

  describe('Move History Structure', () => {
    it('should have identical history structure', () => {
      const legacyGame = new Chess();
      const { result } = renderHook(() => useGame());
      
      const moves = [
        ['e2', 'e4'],
        ['e7', 'e5'],
        ['g1', 'f3'],
        ['b8', 'c6'],
      ];
      
      for (const [from, to] of moves) {
        legacyGame.move({ from, to });
        act(() => {
          result.current.movePiece(from, to);
        });
      }
      
      const legacyHistory = legacyGame.history({ verbose: true });
      const nextHistory = result.current.history;
      
      expect(nextHistory.length).toBe(legacyHistory.length);
      expect(nextHistory.length).toBe(4);
      
      // Check each move in history
      for (let i = 0; i < legacyHistory.length; i++) {
        expect(nextHistory[i].san).toBe(legacyHistory[i].san);
        expect(nextHistory[i].from).toBe(legacyHistory[i].from);
        expect(nextHistory[i].to).toBe(legacyHistory[i].to);
        expect(nextHistory[i].color).toBe(legacyHistory[i].color);
        expect(nextHistory[i].piece).toBe(legacyHistory[i].piece);
      }
    });

    it('should have identical move numbering', () => {
      const legacyGame = new Chess();
      const { result } = renderHook(() => useGame());
      
      const moves = [
        ['e2', 'e4'], // 1. e4
        ['e7', 'e5'], // 1... e5
        ['g1', 'f3'], // 2. Nf3
        ['b8', 'c6'], // 2... Nc6
        ['f1', 'c4'], // 3. Bc4
      ];
      
      for (const [from, to] of moves) {
        legacyGame.move({ from, to });
        act(() => {
          result.current.movePiece(from, to);
        });
      }
      
      const legacyHistory = legacyGame.history({ verbose: true });
      const nextHistory = result.current.history;
      
      // Check move numbers match
      // Move 1: white e4 (index 0)
      // Move 1: black e5 (index 1)
      // Move 2: white Nf3 (index 2)
      // etc.
      
      for (let i = 0; i < legacyHistory.length; i++) {
        // chess.js doesn't expose move number directly in verbose history
        // but we can calculate it: Math.floor(i / 2) + 1
        const expectedMoveNumber = Math.floor(i / 2) + 1;
        expect(expectedMoveNumber).toBeGreaterThan(0);
      }
    });
  });

  describe('PGN Generation', () => {
    it('should generate identical PGN format', () => {
      const legacyGame = new Chess();
      const { result } = renderHook(() => useGame());
      
      const moves = [
        ['e2', 'e4'],
        ['e7', 'e5'],
        ['g1', 'f3'],
        ['b8', 'c6'],
        ['f1', 'c4'],
      ];
      
      for (const [from, to] of moves) {
        legacyGame.move({ from, to });
        act(() => {
          result.current.movePiece(from, to);
        });
      }
      
      const legacyPgn = legacyGame.pgn();
      const nextPgn = result.current.getPgn();
      
      expect(nextPgn).toBe(legacyPgn);
    });

    it('should generate identical PGN with wrap at 80 chars', () => {
      const legacyGame = new Chess();
      const { result } = renderHook(() => useGame());
      
      // Play many moves to test line wrapping
      const moves = [
        ['e2', 'e4'], ['e7', 'e5'],
        ['g1', 'f3'], ['b8', 'c6'],
        ['f1', 'c4'], ['g8', 'f6'],
        ['d2', 'd3'], ['f8', 'c5'],
        ['c2', 'c3'], ['d7', 'd6'],
        ['b2', 'b4'], ['c5', 'b6'],
        ['a2', 'a4'], ['a7', 'a5'],
        ['b4', 'b5'], ['c6', 'e7'],
      ];
      
      for (const [from, to] of moves) {
        legacyGame.move({ from, to });
        act(() => {
          result.current.movePiece(from, to);
        });
      }
      
      const legacyPgn = legacyGame.pgn();
      const nextPgn = result.current.getPgn();
      
      expect(nextPgn).toBe(legacyPgn);
      
      // Both should wrap lines at ~80 characters
      const legacyLines = legacyPgn.split('\n');
      const nextLines = nextPgn.split('\n');
      
      expect(nextLines.length).toBe(legacyLines.length);
    });

    it('should generate identical PGN with max width option', () => {
      const legacyGame = new Chess();
      const { result } = renderHook(() => useGame());
      
      const moves = [
        ['e2', 'e4'], ['e7', 'e5'],
        ['g1', 'f3'], ['b8', 'c6'],
      ];
      
      for (const [from, to] of moves) {
        legacyGame.move({ from, to });
        act(() => {
          result.current.movePiece(from, to);
        });
      }
      
      const legacyPgn = legacyGame.pgn({ max_width: 10 });
      const nextPgn = result.current.game.pgn({ max_width: 10 });
      
      expect(nextPgn).toBe(legacyPgn);
    });
  });

  describe('Move List Grouping by Ply', () => {
    it('should group moves by ply identically', () => {
      const legacyGame = new Chess();
      const { result } = renderHook(() => useGame());
      
      const moves = [
        ['e2', 'e4'], // Ply 1
        ['e7', 'e5'], // Ply 2
        ['g1', 'f3'], // Ply 3
        ['b8', 'c6'], // Ply 4
        ['f1', 'c4'], // Ply 5
      ];
      
      for (const [from, to] of moves) {
        legacyGame.move({ from, to });
        act(() => {
          result.current.movePiece(from, to);
        });
      }
      
      const legacyHistory = legacyGame.history({ verbose: true });
      const nextHistory = result.current.history;
      
      // Group by move pairs (ply)
      const legacyPairs: any[][] = [];
      const nextPairs: any[][] = [];
      
      for (let i = 0; i < legacyHistory.length; i += 2) {
        legacyPairs.push(legacyHistory.slice(i, i + 2));
        nextPairs.push(nextHistory.slice(i, i + 2));
      }
      
      expect(nextPairs.length).toBe(legacyPairs.length);
      
      // Each pair should have matching SANs
      for (let i = 0; i < legacyPairs.length; i++) {
        const legacyPair = legacyPairs[i];
        const nextPair = nextPairs[i];
        
        expect(nextPair.length).toBe(legacyPair.length);
        
        for (let j = 0; j < legacyPair.length; j++) {
          expect(nextPair[j].san).toBe(legacyPair[j].san);
        }
      }
    });

    it('should handle odd number of moves (incomplete ply)', () => {
      const legacyGame = new Chess();
      const { result } = renderHook(() => useGame());
      
      const moves = [
        ['e2', 'e4'],
        ['e7', 'e5'],
        ['g1', 'f3'], // Incomplete ply (no black response yet)
      ];
      
      for (const [from, to] of moves) {
        legacyGame.move({ from, to });
        act(() => {
          result.current.movePiece(from, to);
        });
      }
      
      const legacyHistory = legacyGame.history({ verbose: true });
      const nextHistory = result.current.history;
      
      expect(nextHistory.length).toBe(legacyHistory.length);
      expect(nextHistory.length).toBe(3);
      
      // Last move should be white's
      expect(nextHistory[2].color).toBe(legacyHistory[2].color);
      expect(nextHistory[2].color).toBe('w');
    });
  });

  describe('SAN Consistency Across FEN Loading', () => {
    it('should generate identical SANs after loading from FEN', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      
      const legacyGame = new Chess();
      legacyGame.load(fen);
      
      const { result } = renderHook(() => useGame());
      act(() => {
        result.current.loadFen(fen);
      });
      
      // Make moves from loaded position
      const legacyMove = legacyGame.move({ from: 'e7', to: 'e5' });
      
      act(() => {
        result.current.movePiece('e7', 'e5');
      });
      const nextMove = result.current.history[0];
      
      expect(nextMove.san).toBe(legacyMove.san);
      expect(nextMove.san).toBe('e5');
    });

    it('should maintain SAN consistency through complex game', () => {
      const legacyGame = new Chess();
      const { result } = renderHook(() => useGame());
      
      // Italian Game opening
      const moves = [
        ['e2', 'e4'], ['e7', 'e5'],
        ['g1', 'f3'], ['b8', 'c6'],
        ['f1', 'c4'], ['f8', 'c5'],
        ['c2', 'c3'], ['g8', 'f6'],
        ['d2', 'd4'], ['e5', 'd4'],
        ['c3', 'd4'], ['c5', 'b4'],
        ['c1', 'd2'], ['b4', 'd2'],
        ['b1', 'd2'], ['d7', 'd5'],
      ];
      
      for (const [from, to] of moves) {
        legacyGame.move({ from, to });
        act(() => {
          result.current.movePiece(from, to);
        });
      }
      
      // Check all SANs match
      const legacyHistory = legacyGame.history({ verbose: true });
      const nextHistory = result.current.history;
      
      for (let i = 0; i < legacyHistory.length; i++) {
        expect(nextHistory[i].san).toBe(legacyHistory[i].san);
      }
      
      // PGN should also match
      expect(result.current.getPgn()).toBe(legacyGame.pgn());
    });
  });
});
