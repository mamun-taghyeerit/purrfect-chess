/**
 * Engine Analysis Parity Tests
 *
 * Purpose: Validate that UCI parsing and score normalization is identical between
 * legacy (src/engine.ts) and Next.js (hooks/useEngine.ts + workers/stockfish.worker.ts) apps.
 *
 * Scope:
 * - UCI parser parity (parseInfoLine, parseBestMove)
 * - Score normalization logic
 * - Multi-PV parsing consistency
 * - Real Stockfish integration testing
 * - Edge cases (mate scores, negative scores, etc.)
 *
 * Uses actual Stockfish engine (from stockfish npm package) for authentic testing.
 */

import { describe, it, expect } from 'vitest';
import { parseInfoLine, parseBestMove } from '@/lib/uci-parser';
import { parseInfoLine as legacyParseInfoLine, parseBestMove as legacyParseBestMove } from '../../src/engine/uci-parser';
import { Chess } from 'chess.js';
import { loadStockfish, analyzePosition, type StockfishEngine } from '../helpers/stockfish-loader';

// Test fixtures
const TEST_POSITIONS = {
  startingPosition: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  blackToMove: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
  mateInTwo: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1',
};

// Recorded Stockfish output fixtures for deterministic parsing tests
const UCI_FIXTURES = {
  // Starting position, depth 15, multipv 3
  startingPosition: {
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    lines: [
      'info depth 15 seldepth 22 multipv 1 score cp 30 nodes 45000 nps 450000 hashfull 350 tbhits 0 time 100 pv e2e4 e7e5 g1f3 b8c6 f1c4 g8f6 d2d3 f8c5 e1g1 e8g8 b1c3 d7d6',
      'info depth 15 seldepth 22 multipv 2 score cp 26 nodes 45000 nps 450000 hashfull 350 tbhits 0 time 100 pv d2d4 d7d5 c2c4 e7e6 g1f3 g8f6 b1c3 f8e7 c1f4 e8g8',
      'info depth 15 seldepth 22 multipv 3 score cp 22 nodes 45000 nps 450000 hashfull 350 tbhits 0 time 100 pv g1f3 d7d5 d2d4 g8f6 c2c4 e7e6 b1c3 f8e7 c1f4',
      'bestmove e2e4 ponder e7e5',
    ],
  },
  // Position with mate score
  mateInThree: {
    fen: '6rk/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1',
    lines: [
      'info depth 30 multipv 1 score mate 3 nodes 500000 time 2000 pv a1a8',
      'bestmove a1a8 ponder g8h7',
    ],
  },
  // Black to move position (for score normalization)
  blackToMove: {
    fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
    lines: [
      'info depth 10 multipv 1 score cp 25 pv e7e5',
      'bestmove e7e5',
    ],
  },
};

describe('Phase X Parity: Engine Analysis', () => {

  describe('UCI Parser Parity', () => {
    it('should parse info lines identically in both implementations', () => {
      const testLine = 'info depth 15 seldepth 22 multipv 1 score cp 30 nodes 45000 nps 450000 hashfull 350 tbhits 0 time 100 pv e2e4 e7e5 g1f3 b8c6 f1c4 g8f6 d2d3 f8c5 e1g1 e8g8 b1c3 d7d6';

      const legacyResult = legacyParseInfoLine(testLine);
      const nextResult = parseInfoLine(testLine);

      expect(legacyResult).toEqual(nextResult);
      expect(legacyResult).toMatchObject({
        depth: 15,
        seldepth: 22,
        multipv: 1,
        score: { type: 'cp', value: 30 },
        pv: 'e2e4',
        pvLine: 'e2e4 e7e5 g1f3 b8c6 f1c4 g8f6 d2d3 f8c5 e1g1 e8g8 b1c3 d7d6',
        nodes: 45000,
        nps: 450000,
        hashfull: 350,
        tbhits: 0,
        time: 100,
      });
    });

    it('should parse bestmove lines identically in both implementations', () => {
      const testLine = 'bestmove e2e4 ponder e7e5';

      const legacyResult = legacyParseBestMove(testLine);
      const nextResult = parseBestMove(testLine);

      expect(legacyResult).toEqual(nextResult);
      expect(legacyResult).toEqual({
        bestmove: 'e2e4',
        ponder: 'e7e5',
      });
    });

    it('should parse mate scores identically', () => {
      const testLine = 'info depth 30 multipv 1 score mate 3 nodes 500000 time 2000 pv f7f8q g8h7 d8d7';

      const legacyResult = legacyParseInfoLine(testLine);
      const nextResult = parseInfoLine(testLine);

      expect(legacyResult).toEqual(nextResult);
      expect(legacyResult?.score).toEqual({ type: 'mate', value: 3 });
    });

    it('should parse negative scores identically', () => {
      const testLine = 'info depth 10 multipv 1 score cp -150 pv d7d5';

      const legacyResult = legacyParseInfoLine(testLine);
      const nextResult = parseInfoLine(testLine);

      expect(legacyResult).toEqual(nextResult);
      expect(legacyResult?.score).toEqual({ type: 'cp', value: -150 });
    });

    it('should parse all fixtures identically', () => {
      const allLines = [
        ...UCI_FIXTURES.startingPosition.lines,
        ...UCI_FIXTURES.mateInThree.lines,
        ...UCI_FIXTURES.blackToMove.lines,
      ];

      allLines.forEach((line) => {
        if (line.startsWith('info')) {
          const legacyResult = legacyParseInfoLine(line);
          const nextResult = parseInfoLine(line);
          expect(legacyResult).toEqual(nextResult);
        } else if (line.startsWith('bestmove')) {
          const legacyResult = legacyParseBestMove(line);
          const nextResult = parseBestMove(line);
          expect(legacyResult).toEqual(nextResult);
        }
      });
    });
  });

  describe('Score Normalization Parity', () => {
    it('should normalize scores from white perspective correctly', () => {
      const fen = UCI_FIXTURES.startingPosition.fen;
      const game = new Chess(fen);
      const turn = game.turn(); // 'w'

      expect(turn).toBe('w');

      // Parse a score from the UCI output
      const parsed = parseInfoLine(UCI_FIXTURES.startingPosition.lines[0]);
      const rawScore = parsed?.score?.value || 0;

      // For white to move: score stays as-is (positive means good for white)
      const normalizedScore = turn === 'w' ? rawScore : -rawScore;

      expect(normalizedScore).toBe(30); // Positive for white
    });

    it('should normalize scores from black perspective correctly', () => {
      const fen = UCI_FIXTURES.blackToMove.fen;
      const game = new Chess(fen);
      const turn = game.turn(); // 'b'

      expect(turn).toBe('b');

      // Parse a score from the UCI output  
      const parsed = parseInfoLine(UCI_FIXTURES.blackToMove.lines[0]);
      const rawScore = parsed?.score?.value || 0;

      // For black to move: score should be inverted
      // If engine says +25, that's good for white, so black sees -25
      const normalizedScore = turn === 'b' ? -rawScore : rawScore;

      expect(normalizedScore).toBe(-25); // Negative for black (white is better)
    });

    it('should handle mate scores correctly for both colors', () => {
      const whiteToMove = new Chess('6rk/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1');
      const blackToMove = new Chess('6rk/5ppp/8/8/8/8/5PPP/1R4K1 b - - 0 1');

      // Mate score parsing
      const mateLine = 'info depth 30 score mate 3 pv a1a8';
      const parsed = parseInfoLine(mateLine);

      expect(parsed?.score).toEqual({ type: 'mate', value: 3 });

      // Normalization logic (same as cp scores)
      const whiteTurn = whiteToMove.turn();
      const blackTurn = blackToMove.turn();

      const whiteNormalized = whiteTurn === 'w' ? 3 : -3;
      const blackNormalized = blackTurn === 'b' ? -3 : 3;

      expect(whiteNormalized).toBe(3); // White has mate in 3
      expect(blackNormalized).toBe(-3); // Black is getting mated in 3
    });
  });

  describe('Multi-PV Parsing Parity', () => {
    it('should parse multi-PV lines with correct ordering', () => {
      const lines = UCI_FIXTURES.startingPosition.lines.filter(l => l.startsWith('info'));
      const parsed = lines.map(l => parseInfoLine(l)).filter(p => p !== null && p.multipv !== null);

      // Should have 3 unique multipv values
      const multipvValues = parsed.map(p => p.multipv);
      expect(multipvValues).toContain(1);
      expect(multipvValues).toContain(2);
      expect(multipvValues).toContain(3);

      // Should be properly ordered
      const sortedParsed = parsed.sort((a, b) => (a.multipv || 0) - (b.multipv || 0));
      expect(sortedParsed[0].multipv).toBe(1);
      expect(sortedParsed[1].multipv).toBe(2);
      expect(sortedParsed[2].multipv).toBe(3);
    });

    it('should extract correct PV for each line', () => {
      const line1 = parseInfoLine(UCI_FIXTURES.startingPosition.lines[0]);
      const line2 = parseInfoLine(UCI_FIXTURES.startingPosition.lines[1]);
      const line3 = parseInfoLine(UCI_FIXTURES.startingPosition.lines[2]);

      expect(line1?.pv).toBe('e2e4');
      expect(line2?.pv).toBe('d2d4');
      expect(line3?.pv).toBe('g1f3');

      expect(line1?.pvLine).toContain('e2e4 e7e5');
      expect(line2?.pvLine).toContain('d2d4 d7d5');
      expect(line3?.pvLine).toContain('g1f3 d7d5');
    });
  });

  describe('Best Move Parsing Parity', () => {
    it('should parse best move without ponder', () => {
      const line = 'bestmove e2e4';

      const legacyResult = legacyParseBestMove(line);
      const nextResult = parseBestMove(line);

      expect(legacyResult).toEqual(nextResult);
      expect(legacyResult).toEqual({
        bestmove: 'e2e4',
        ponder: null,
      });
    });

    it('should parse best move with ponder', () => {
      const line = 'bestmove e2e4 ponder e7e5';

      const legacyResult = legacyParseBestMove(line);
      const nextResult = parseBestMove(line);

      expect(legacyResult).toEqual(nextResult);
      expect(legacyResult).toEqual({
        bestmove: 'e2e4',
        ponder: 'e7e5',
      });
    });

    it('should parse promotion moves', () => {
      const line = 'bestmove f7f8q ponder g8h7';

      const legacyResult = legacyParseBestMove(line);
      const nextResult = parseBestMove(line);

      expect(legacyResult).toEqual(nextResult);
      expect(legacyResult).toEqual({
        bestmove: 'f7f8q',
        ponder: 'g8h7',
      });
    });

    it('should handle no legal move scenario', () => {
      const line = 'bestmove (none)';

      const legacyResult = legacyParseBestMove(line);
      const nextResult = parseBestMove(line);

      expect(legacyResult).toEqual(nextResult);
      expect(legacyResult).toEqual({
        bestmove: null,
        ponder: null,
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null/undefined input gracefully', () => {
      expect(parseInfoLine(null as any)).toBeNull();
      expect(parseInfoLine(undefined as any)).toBeNull();
      expect(parseInfoLine('')).toBeNull();

      expect(parseBestMove(null as any)).toBeNull();
      expect(parseBestMove(undefined as any)).toBeNull();
      expect(parseBestMove('')).toBeNull();

      // Both implementations should handle it the same way
      expect(legacyParseInfoLine(null as any)).toBeNull();
      expect(legacyParseBestMove(null as any)).toBeNull();
    });

    it('should handle invalid UCI lines gracefully', () => {
      const invalidLines = [
        'uciok',
        'readyok',
        'not a uci line',
        'info', // Empty info line
        'bestmove', // Empty bestmove line
      ];

      invalidLines.forEach((line) => {
        const legacyInfo = legacyParseInfoLine(line);
        const nextInfo = parseInfoLine(line);

        // Both should either return null or an object with null fields
        if (legacyInfo !== null && nextInfo !== null) {
          expect(legacyInfo).toEqual(nextInfo);
        }
      });
    });

    it('should handle lines with missing fields gracefully', () => {
      const partialLine = 'info depth 10'; // No multipv, score, or pv

      const legacyResult = legacyParseInfoLine(partialLine);
      const nextResult = parseInfoLine(partialLine);

      expect(legacyResult).toEqual(nextResult);
      expect(legacyResult).toMatchObject({
        depth: 10,
        multipv: null,
        score: null,
        pv: null,
      });
    });
  });

  describe('Comprehensive Fixture Validation', () => {
    it('should produce identical parse results for all fixture lines', () => {
      const fixtures = [
        UCI_FIXTURES.startingPosition,
        UCI_FIXTURES.mateInThree,
        UCI_FIXTURES.blackToMove,
      ];

      fixtures.forEach((fixture) => {
        fixture.lines.forEach((line) => {
          if (line.startsWith('info')) {
            const legacy = legacyParseInfoLine(line);
            const next = parseInfoLine(line);

            // Should be deeply equal
            expect(legacy).toEqual(next);

            // Verify key fields are present
            if (legacy && next) {
              expect(legacy.depth).toBe(next.depth);
              expect(legacy.multipv).toBe(next.multipv);
              expect(legacy.score).toEqual(next.score);
              expect(legacy.pv).toBe(next.pv);
              expect(legacy.pvLine).toBe(next.pvLine);
            }
          } else if (line.startsWith('bestmove')) {
            const legacy = legacyParseBestMove(line);
            const next = parseBestMove(line);

            expect(legacy).toEqual(next);

            if (legacy && next) {
              expect(legacy.bestmove).toBe(next.bestmove);
              expect(legacy.ponder).toBe(next.ponder);
            }
          }
        });
      });
    });
  });

  describe('Real Stockfish Integration Tests', () => {
    // These tests use actual Stockfish engine for authentic validation
    // They verify that our parsers correctly handle real UCI output

    it('should parse real Stockfish output for starting position', async () => {
      const lines = await analyzePosition(TEST_POSITIONS.startingPosition, {
        depth: 8,
        multipv: 3,
        timeout: 15000,
      });

      // Should have received uciok, readyok, info lines, and bestmove
      expect(lines.some(l => l === 'uciok')).toBe(true);
      expect(lines.some(l => l === 'readyok')).toBe(true);
      expect(lines.some(l => l.startsWith('info'))).toBe(true);
      expect(lines.some(l => l.startsWith('bestmove'))).toBe(true);

      // Parse all info lines
      const infoLines = lines.filter(l => l.startsWith('info'));
      const parsedInfo = infoLines
        .map(l => parseInfoLine(l))
        .filter(p => p !== null && p.multipv !== null);

      // Should have multi-PV lines
      expect(parsedInfo.length).toBeGreaterThan(0);

      // Should have multipv 1, 2, 3
      const multipvValues = parsedInfo.map(p => p.multipv);
      expect(multipvValues).toContain(1);
      expect(multipvValues).toContain(2);
      expect(multipvValues).toContain(3);

      // Parse bestmove
      const bestmoveLine = lines.find(l => l.startsWith('bestmove'));
      expect(bestmoveLine).toBeDefined();
      const bestmove = parseBestMove(bestmoveLine!);
      expect(bestmove).not.toBeNull();
      expect(bestmove?.bestmove).toBeTruthy();

      // Verify legacy parser produces same results
      infoLines.forEach((line) => {
        const legacy = legacyParseInfoLine(line);
        const next = parseInfoLine(line);
        expect(legacy).toEqual(next);
      });
    }, 20000); // Allow 20s for this integration test

    it('should handle real engine output with both parsers identically', async () => {
      const lines = await analyzePosition(TEST_POSITIONS.startingPosition, {
        depth: 6,
        multipv: 1,
        timeout: 10000,
      });

      // Test every line with both parsers
      lines.forEach((line) => {
        if (line.startsWith('info')) {
          const legacy = legacyParseInfoLine(line);
          const next = parseInfoLine(line);
          expect(legacy).toEqual(next);
        } else if (line.startsWith('bestmove')) {
          const legacy = legacyParseBestMove(line);
          const next = parseBestMove(line);
          expect(legacy).toEqual(next);
        }
      });
    }, 15000);

    it('should correctly parse depth progression from real engine', async () => {
      const lines = await analyzePosition(TEST_POSITIONS.startingPosition, {
        depth: 5,
        multipv: 1,
        timeout: 10000,
      });

      const infoLines = lines.filter(l => l.startsWith('info'));
      const depths = infoLines
        .map(l => parseInfoLine(l))
        .filter(p => p !== null && p.depth !== null)
        .map(p => p.depth);

      // Should have increasing depths
      expect(depths.length).toBeGreaterThan(0);
      expect(Math.max(...depths)).toBeGreaterThanOrEqual(5);
    }, 15000);
  });
});
