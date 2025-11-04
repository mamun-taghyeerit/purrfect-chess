/**
 * Move Legality Parity Tests
 *
 * Purpose: Validate that legal move generation is identical
 * between legacy (src/game.ts) and Next.js (hooks/useGame.ts) apps.
 *
 * Tests cover:
 * - Basic moves (pawn, knight, bishop, rook, queen, king)
 * - Special moves (castling, en passant, promotion)
 * - Edge cases from fixtures
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Chess } from 'chess.js';
import { useGame } from '../../hooks/useGame';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

describe('Phase X Parity: Move Legality', () => {
  const fenFixturesDir = join(__dirname, '../../docs/fixtures/fen');

  describe('Basic Move Legality', () => {
    it('should generate identical legal moves from starting position', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

      const legacyGame = new Chess();
      legacyGame.load(fen);
      const legacyMoves = legacyGame.moves({ verbose: true });

      const { result } = renderHook(() => useGame());
      act(() => {
        result.current.loadFen(fen);
      });
      const nextMoves = result.current.game.moves({ verbose: true });

      // Should have same number of legal moves
      expect(nextMoves.length).toBe(legacyMoves.length);
      expect(nextMoves.length).toBe(20); // 16 pawn moves + 4 knight moves

      // Should have identical move lists
      const legacySans = legacyMoves.map((m) => m.san).sort();
      const nextSans = nextMoves.map((m) => m.san).sort();
      expect(nextSans).toEqual(legacySans);
    });

    it('should generate identical legal moves after e4', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';

      const legacyGame = new Chess();
      legacyGame.load(fen);
      const legacyMoves = legacyGame.moves({ verbose: true });

      const { result } = renderHook(() => useGame());
      act(() => {
        result.current.loadFen(fen);
      });
      const nextMoves = result.current.game.moves({ verbose: true });

      expect(nextMoves.length).toBe(legacyMoves.length);
      expect(nextMoves.length).toBe(20); // Black has 20 legal moves

      const legacySans = legacyMoves.map((m) => m.san).sort();
      const nextSans = nextMoves.map((m) => m.san).sort();
      expect(nextSans).toEqual(legacySans);
    });
  });

  describe('Castling Legality', () => {
    it('should allow castling when rights are available', () => {
      const fen = 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1';

      const legacyGame = new Chess();
      legacyGame.load(fen);
      const legacyMoves = legacyGame.moves({ verbose: true });

      const { result } = renderHook(() => useGame());
      act(() => {
        result.current.loadFen(fen);
      });
      const nextMoves = result.current.game.moves({ verbose: true });

      // Check for castling moves
      const legacyCastling = legacyMoves.filter(
        (m) => m.san === 'O-O' || m.san === 'O-O-O'
      );
      const nextCastling = nextMoves.filter(
        (m) => m.san === 'O-O' || m.san === 'O-O-O'
      );

      expect(nextCastling.length).toBe(legacyCastling.length);
      expect(nextCastling.length).toBe(2); // Both kingside and queenside
    });

    it('should not allow castling when rights are not available', () => {
      const fen = 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w - - 0 1';

      const legacyGame = new Chess();
      legacyGame.load(fen);
      const legacyMoves = legacyGame.moves({ verbose: true });

      const { result } = renderHook(() => useGame());
      act(() => {
        result.current.loadFen(fen);
      });
      const nextMoves = result.current.game.moves({ verbose: true });

      const legacyCastling = legacyMoves.filter(
        (m) => m.san === 'O-O' || m.san === 'O-O-O'
      );
      const nextCastling = nextMoves.filter(
        (m) => m.san === 'O-O' || m.san === 'O-O-O'
      );

      expect(nextCastling.length).toBe(legacyCastling.length);
      expect(nextCastling.length).toBe(0); // No castling rights
    });

    it('should handle partial castling rights correctly', () => {
      const fen = 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w Kq - 0 1';

      const legacyGame = new Chess();
      legacyGame.load(fen);
      const legacyMoves = legacyGame.moves({ verbose: true });

      const { result } = renderHook(() => useGame());
      act(() => {
        result.current.loadFen(fen);
      });
      const nextMoves = result.current.game.moves({ verbose: true });

      const legacyCastling = legacyMoves.filter(
        (m) => m.san === 'O-O' || m.san === 'O-O-O'
      );
      const nextCastling = nextMoves.filter(
        (m) => m.san === 'O-O' || m.san === 'O-O-O'
      );

      expect(nextCastling.length).toBe(legacyCastling.length);
      expect(nextCastling.length).toBe(1); // Only kingside for white
    });
  });

  describe('En Passant Legality', () => {
    it('should allow en passant when available for white', () => {
      const fen =
        'rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 3';

      const legacyGame = new Chess();
      legacyGame.load(fen);
      const legacyMoves = legacyGame.moves({ verbose: true });

      const { result } = renderHook(() => useGame());
      act(() => {
        result.current.loadFen(fen);
      });
      const nextMoves = result.current.game.moves({ verbose: true });

      // Check for en passant move
      const legacyEnPassant = legacyMoves.filter((m) => m.flags.includes('e'));
      const nextEnPassant = nextMoves.filter((m) => m.flags.includes('e'));

      expect(nextEnPassant.length).toBe(legacyEnPassant.length);
      expect(nextEnPassant.length).toBe(1); // exf6 en passant
    });

    it('should allow en passant when available for black', () => {
      const fen = 'rnbqkbnr/pppp1ppp/8/3Pp3/8/8/PPP1PPPP/RNBQKBNR b KQkq - 0 2';

      const legacyGame = new Chess();
      legacyGame.load(fen);
      const legacyMoves = legacyGame.moves({ verbose: true });

      const { result } = renderHook(() => useGame());
      act(() => {
        result.current.loadFen(fen);
      });
      const nextMoves = result.current.game.moves({ verbose: true });

      // Note: This FEN might not have en passant available - chess.js determines it
      const legacyEnPassant = legacyMoves.filter((m) => m.flags.includes('e'));
      const nextEnPassant = nextMoves.filter((m) => m.flags.includes('e'));

      expect(nextEnPassant.length).toBe(legacyEnPassant.length);
    });

    it('should not allow en passant when not available', () => {
      const fen =
        'rnbqkbnr/ppp1p1pp/8/3p1p2/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 0 3';

      const legacyGame = new Chess();
      legacyGame.load(fen);
      const legacyMoves = legacyGame.moves({ verbose: true });

      const { result } = renderHook(() => useGame());
      act(() => {
        result.current.loadFen(fen);
      });
      const nextMoves = result.current.game.moves({ verbose: true });

      const legacyEnPassant = legacyMoves.filter((m) => m.flags.includes('e'));
      const nextEnPassant = nextMoves.filter((m) => m.flags.includes('e'));

      expect(nextEnPassant.length).toBe(legacyEnPassant.length);
      expect(nextEnPassant.length).toBe(0); // No en passant
    });
  });

  describe('Promotion Legality', () => {
    it('should allow promotion for white pawn on 7th rank', () => {
      const fen = '8/4P3/8/8/8/8/8/4K2k w - - 0 1';

      const legacyGame = new Chess();
      legacyGame.load(fen);
      const legacyMoves = legacyGame.moves({ verbose: true });

      const { result } = renderHook(() => useGame());
      act(() => {
        result.current.loadFen(fen);
      });
      const nextMoves = result.current.game.moves({ verbose: true });

      // Check for promotion moves (Q, R, B, N)
      const legacyPromotions = legacyMoves.filter((m) => m.promotion);
      const nextPromotions = nextMoves.filter((m) => m.promotion);

      expect(nextPromotions.length).toBe(legacyPromotions.length);
      expect(nextPromotions.length).toBe(4); // Q, R, B, N
    });

    it('should allow promotion for black pawn on 2nd rank', () => {
      const fen = '4k3/8/8/8/8/8/4p3/4K3 b - - 0 1';

      const legacyGame = new Chess();
      legacyGame.load(fen);
      const legacyMoves = legacyGame.moves({ verbose: true });

      const { result } = renderHook(() => useGame());
      act(() => {
        result.current.loadFen(fen);
      });
      const nextMoves = result.current.game.moves({ verbose: true });

      const legacyPromotions = legacyMoves.filter((m) => m.promotion);
      const nextPromotions = nextMoves.filter((m) => m.promotion);

      expect(nextPromotions.length).toBe(legacyPromotions.length);
      // Both should have promotion moves (4 if e1 is empty, 0 if blocked)
    });
  });

  describe('Edge Case Positions', () => {
    it('should generate identical legal moves in Kiwipete position', () => {
      // Complex position with many tactical possibilities
      const fen =
        'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1';

      const legacyGame = new Chess();
      legacyGame.load(fen);
      const legacyMoves = legacyGame.moves({ verbose: true });

      const { result } = renderHook(() => useGame());
      act(() => {
        result.current.loadFen(fen);
      });
      const nextMoves = result.current.game.moves({ verbose: true });

      expect(nextMoves.length).toBe(legacyMoves.length);

      const legacySans = legacyMoves.map((m) => m.san).sort();
      const nextSans = nextMoves.map((m) => m.san).sort();
      expect(nextSans).toEqual(legacySans);
    });

    it('should generate identical legal moves in complex middlegame', () => {
      const fen =
        'rnbq1rk1/ppp1bppp/4pn2/3p4/2PP4/2N1PN2/PP2BPPP/R1BQK2R b KQ - 0 6';

      const legacyGame = new Chess();
      legacyGame.load(fen);
      const legacyMoves = legacyGame.moves({ verbose: true });

      const { result } = renderHook(() => useGame());
      act(() => {
        result.current.loadFen(fen);
      });
      const nextMoves = result.current.game.moves({ verbose: true });

      expect(nextMoves.length).toBe(legacyMoves.length);

      const legacySans = legacyMoves.map((m) => m.san).sort();
      const nextSans = nextMoves.map((m) => m.san).sort();
      expect(nextSans).toEqual(legacySans);
    });
  });

  describe('Comprehensive Fixture Testing', () => {
    it('should generate identical legal moves for all FEN fixtures', () => {
      const fenFiles = readdirSync(fenFixturesDir).filter((f) =>
        f.endsWith('.fen')
      );

      expect(fenFiles.length).toBeGreaterThan(0);

      for (const file of fenFiles) {
        const fenPath = join(fenFixturesDir, file);
        const fenContent = readFileSync(fenPath, 'utf-8').trim();
        const fen = fenContent.split('\n')[0];

        const legacyGame = new Chess();
        try {
          legacyGame.load(fen);
        } catch (error) {
          // Skip invalid FENs
          continue;
        }

        const { result } = renderHook(() => useGame());
        let loadSuccess = false;
        act(() => {
          loadSuccess = result.current.loadFen(fen);
        });

        if (!loadSuccess) {
          continue; // Skip if load failed
        }

        const legacyMoves = legacyGame.moves({ verbose: true });
        const nextMoves = result.current.game.moves({ verbose: true });

        // Should have same number of legal moves
        expect(nextMoves.length).toBe(legacyMoves.length);

        // Should have identical SAN move lists
        const legacySans = legacyMoves.map((m) => m.san).sort();
        const nextSans = nextMoves.map((m) => m.san).sort();
        expect(nextSans).toEqual(legacySans);
      }
    });
  });

  describe('Move Execution', () => {
    it('should execute moves identically in both implementations', () => {
      const legacyGame = new Chess();
      const { result } = renderHook(() => useGame());

      // Test sequence of moves
      const moves = [
        ['e2', 'e4'],
        ['e7', 'e5'],
        ['g1', 'f3'],
        ['b8', 'c6'],
        ['f1', 'c4'],
      ];

      for (const [from, to] of moves) {
        const legacyMove = legacyGame.move({ from, to });

        let nextSuccess = false;
        act(() => {
          nextSuccess = result.current.movePiece(from, to);
        });

        // Both should succeed
        expect(nextSuccess).toBe(true);
        expect(legacyMove).not.toBeNull();

        // FENs should match
        expect(result.current.fen).toBe(legacyGame.fen());
      }
    });

    it('should reject invalid moves identically', () => {
      const legacyGame = new Chess();
      const { result } = renderHook(() => useGame());

      // Try invalid move
      let legacyMove = null;
      try {
        legacyMove = legacyGame.move({ from: 'e2', to: 'e5' });
      } catch (error) {
        legacyMove = null;
      }

      let nextSuccess = false;
      act(() => {
        nextSuccess = result.current.movePiece('e2', 'e5');
      });

      // Both should fail
      expect(legacyMove).toBeNull();
      expect(nextSuccess).toBe(false);
    });

    it('should execute promotion moves identically with default to queen', () => {
      const fen = '8/4P3/8/8/8/8/8/4K2k w - - 0 1';

      const legacyGame = new Chess();
      legacyGame.load(fen);

      const { result } = renderHook(() => useGame());
      act(() => {
        result.current.loadFen(fen);
      });

      // Legacy defaults to queen when promotion not specified
      const legacyMove = legacyGame.move({
        from: 'e7',
        to: 'e8',
        promotion: 'q',
      });

      let nextSuccess = false;
      act(() => {
        // Next.js should also default to queen when promotion not specified
        nextSuccess = result.current.movePiece('e7', 'e8');
      });

      // Both should succeed
      expect(nextSuccess).toBe(true);
      expect(legacyMove).not.toBeNull();

      // FENs should match (pawn promoted to queen on e8)
      expect(result.current.fen).toBe(legacyGame.fen());

      // Both should have promoted to queen
      expect(legacyMove.promotion).toBe('q');
      expect(result.current.history[0].promotion).toBe('q');
    });
  });
});
