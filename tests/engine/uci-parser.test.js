/**
 * Unit tests for UCI Parser Module
 */

import { describe, it, expect } from 'vitest';
import { parseInfoLine, parseBestMove } from '../../src/engine/uci-parser.js';

describe('parseInfoLine', () => {
  describe('basic parsing', () => {
    it('should return null for null input', () => {
      expect(parseInfoLine(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(parseInfoLine(undefined)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(parseInfoLine('')).toBeNull();
    });

    it('should return null for non-info line', () => {
      expect(parseInfoLine('uciok')).toBeNull();
      expect(parseInfoLine('readyok')).toBeNull();
      expect(parseInfoLine('bestmove e2e4')).toBeNull();
    });

    it('should return object with null fields for info line with no data', () => {
      const result = parseInfoLine('info');
      expect(result).not.toBeNull();
      expect(result.depth).toBeNull();
      expect(result.multipv).toBeNull();
      expect(result.score).toBeNull();
      expect(result.pv).toBeNull();
    });
  });

  describe('depth parsing', () => {
    it('should extract depth correctly', () => {
      const result = parseInfoLine('info depth 20');
      expect(result.depth).toBe(20);
    });

    it('should extract depth from complex line', () => {
      const result = parseInfoLine('info depth 15 seldepth 22 multipv 1');
      expect(result.depth).toBe(15);
    });

    it('should handle depth 0', () => {
      const result = parseInfoLine('info depth 0');
      expect(result.depth).toBe(0);
    });
  });

  describe('multipv parsing', () => {
    it('should extract multipv correctly', () => {
      const result = parseInfoLine('info multipv 1');
      expect(result.multipv).toBe(1);
    });

    it('should extract multipv 3', () => {
      const result = parseInfoLine('info depth 10 multipv 3');
      expect(result.multipv).toBe(3);
    });
  });

  describe('score parsing - centipawn (cp)', () => {
    it('should parse positive cp score', () => {
      const result = parseInfoLine('info depth 20 score cp 25');
      expect(result.score).toEqual({
        type: 'cp',
        value: 25
      });
    });

    it('should parse negative cp score', () => {
      const result = parseInfoLine('info depth 15 score cp -150');
      expect(result.score).toEqual({
        type: 'cp',
        value: -150
      });
    });

    it('should parse zero cp score', () => {
      const result = parseInfoLine('info depth 10 score cp 0');
      expect(result.score).toEqual({
        type: 'cp',
        value: 0
      });
    });

    it('should parse cp score with pv', () => {
      const result = parseInfoLine('info depth 20 multipv 1 score cp 25 pv e2e4 e7e5');
      expect(result.score).toEqual({
        type: 'cp',
        value: 25
      });
      expect(result.pv).toBe('e2e4');
      expect(result.pvLine).toBe('e2e4 e7e5');
    });
  });

  describe('score parsing - mate', () => {
    it('should parse positive mate score', () => {
      const result = parseInfoLine('info depth 25 score mate 3');
      expect(result.score).toEqual({
        type: 'mate',
        value: 3
      });
    });

    it('should parse negative mate score', () => {
      const result = parseInfoLine('info depth 30 score mate -5');
      expect(result.score).toEqual({
        type: 'mate',
        value: -5
      });
    });

    it('should parse mate in 1', () => {
      const result = parseInfoLine('info depth 20 score mate 1 pv f7f8q');
      expect(result.score).toEqual({
        type: 'mate',
        value: 1
      });
      expect(result.pv).toBe('f7f8q');
    });
  });

  describe('pv (principal variation) parsing', () => {
    it('should parse single move pv', () => {
      const result = parseInfoLine('info depth 10 pv e2e4');
      expect(result.pv).toBe('e2e4');
      expect(result.pvLine).toBe('e2e4');
    });

    it('should parse multi-move pv', () => {
      const result = parseInfoLine('info depth 20 pv e2e4 e7e5 g1f3 b8c6 f1c4');
      expect(result.pv).toBe('e2e4');
      expect(result.pvLine).toBe('e2e4 e7e5 g1f3 b8c6 f1c4');
    });

    it('should parse pv with promotion', () => {
      const result = parseInfoLine('info depth 25 pv f7f8q');
      expect(result.pv).toBe('f7f8q');
      expect(result.pvLine).toBe('f7f8q');
    });

    it('should filter out UCI metadata tokens from pv', () => {
      // Some Stockfish versions include metadata like 'bmc', 'wdl' in PV
      const result = parseInfoLine('info depth 20 pv e2e4 e7e5 g1f3 bmc 100');
      expect(result.pv).toBe('e2e4');
      expect(result.pvLine).toBe('e2e4 e7e5 g1f3');
    });

    it('should handle empty pv gracefully', () => {
      const result = parseInfoLine('info depth 10 pv');
      expect(result.pv).toBeNull();
      expect(result.pvLine).toBeNull();
    });
  });

  describe('nodes parsing', () => {
    it('should parse nodes count', () => {
      const result = parseInfoLine('info depth 20 nodes 1500000');
      expect(result.nodes).toBe(1500000);
    });

    it('should handle large node counts', () => {
      const result = parseInfoLine('info depth 30 nodes 999999999');
      expect(result.nodes).toBe(999999999);
    });
  });

  describe('time parsing', () => {
    it('should parse time in milliseconds', () => {
      const result = parseInfoLine('info depth 20 time 5000');
      expect(result.time).toBe(5000);
    });

    it('should handle time 0', () => {
      const result = parseInfoLine('info depth 1 time 0');
      expect(result.time).toBe(0);
    });
  });

  describe('nps (nodes per second) parsing', () => {
    it('should parse nps', () => {
      const result = parseInfoLine('info depth 20 nps 300000');
      expect(result.nps).toBe(300000);
    });
  });

  describe('hashfull parsing', () => {
    it('should parse hashfull', () => {
      const result = parseInfoLine('info depth 20 hashfull 500');
      expect(result.hashfull).toBe(500);
    });

    it('should handle hashfull 0', () => {
      const result = parseInfoLine('info depth 5 hashfull 0');
      expect(result.hashfull).toBe(0);
    });

    it('should handle hashfull 1000 (max)', () => {
      const result = parseInfoLine('info depth 30 hashfull 1000');
      expect(result.hashfull).toBe(1000);
    });
  });

  describe('seldepth parsing', () => {
    it('should parse selective depth', () => {
      const result = parseInfoLine('info depth 20 seldepth 28');
      expect(result.seldepth).toBe(28);
    });
  });

  describe('tbhits parsing', () => {
    it('should parse tablebase hits', () => {
      const result = parseInfoLine('info depth 20 tbhits 42');
      expect(result.tbhits).toBe(42);
    });
  });

  describe('comprehensive real-world examples', () => {
    it('should parse full info line with cp score and pv', () => {
      const line = 'info depth 20 seldepth 28 multipv 1 score cp 25 nodes 1500000 nps 300000 hashfull 500 tbhits 0 time 5000 pv e2e4 e7e5 g1f3 b8c6 f1c4 f8c5';
      const result = parseInfoLine(line);
      
      expect(result.depth).toBe(20);
      expect(result.seldepth).toBe(28);
      expect(result.multipv).toBe(1);
      expect(result.score).toEqual({ type: 'cp', value: 25 });
      expect(result.nodes).toBe(1500000);
      expect(result.nps).toBe(300000);
      expect(result.hashfull).toBe(500);
      expect(result.tbhits).toBe(0);
      expect(result.time).toBe(5000);
      expect(result.pv).toBe('e2e4');
      expect(result.pvLine).toBe('e2e4 e7e5 g1f3 b8c6 f1c4 f8c5');
    });

    it('should parse full info line with mate score', () => {
      const line = 'info depth 30 multipv 1 score mate 3 nodes 500000 time 2000 pv f7f8q g8h7 d8d7';
      const result = parseInfoLine(line);
      
      expect(result.depth).toBe(30);
      expect(result.multipv).toBe(1);
      expect(result.score).toEqual({ type: 'mate', value: 3 });
      expect(result.nodes).toBe(500000);
      expect(result.time).toBe(2000);
      expect(result.pv).toBe('f7f8q');
      expect(result.pvLine).toBe('f7f8q g8h7 d8d7');
    });

    it('should parse multipv 2 line', () => {
      const line = 'info depth 18 multipv 2 score cp -15 pv d2d4 d7d5 c2c4';
      const result = parseInfoLine(line);
      
      expect(result.depth).toBe(18);
      expect(result.multipv).toBe(2);
      expect(result.score).toEqual({ type: 'cp', value: -15 });
      expect(result.pv).toBe('d2d4');
      expect(result.pvLine).toBe('d2d4 d7d5 c2c4');
    });

    it('should parse multipv 3 line', () => {
      const line = 'info depth 16 multipv 3 score cp -50 pv c2c4 e7e6';
      const result = parseInfoLine(line);
      
      expect(result.depth).toBe(16);
      expect(result.multipv).toBe(3);
      expect(result.score).toEqual({ type: 'cp', value: -50 });
      expect(result.pv).toBe('c2c4');
      expect(result.pvLine).toBe('c2c4 e7e6');
    });
  });
});

describe('parseBestMove', () => {
  describe('basic parsing', () => {
    it('should return null for null input', () => {
      expect(parseBestMove(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(parseBestMove(undefined)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(parseBestMove('')).toBeNull();
    });

    it('should return null for non-bestmove line', () => {
      expect(parseBestMove('uciok')).toBeNull();
      expect(parseBestMove('info depth 20')).toBeNull();
      expect(parseBestMove('readyok')).toBeNull();
    });
  });

  describe('bestmove without ponder', () => {
    it('should parse simple bestmove', () => {
      const result = parseBestMove('bestmove e2e4');
      expect(result).toEqual({
        bestmove: 'e2e4',
        ponder: null
      });
    });

    it('should parse bestmove with promotion', () => {
      const result = parseBestMove('bestmove f7f8q');
      expect(result).toEqual({
        bestmove: 'f7f8q',
        ponder: null
      });
    });

    it('should parse bestmove from different square', () => {
      const result = parseBestMove('bestmove g1f3');
      expect(result).toEqual({
        bestmove: 'g1f3',
        ponder: null
      });
    });
  });

  describe('bestmove with ponder', () => {
    it('should parse bestmove with ponder move', () => {
      const result = parseBestMove('bestmove e2e4 ponder e7e5');
      expect(result).toEqual({
        bestmove: 'e2e4',
        ponder: 'e7e5'
      });
    });

    it('should parse bestmove with ponder promotion', () => {
      const result = parseBestMove('bestmove f7f8q ponder g8h7');
      expect(result).toEqual({
        bestmove: 'f7f8q',
        ponder: 'g8h7'
      });
    });

    it('should parse complex bestmove with ponder', () => {
      const result = parseBestMove('bestmove g1f3 ponder b8c6');
      expect(result).toEqual({
        bestmove: 'g1f3',
        ponder: 'b8c6'
      });
    });
  });

  describe('edge cases', () => {
    it('should handle bestmove none (no legal moves)', () => {
      const result = parseBestMove('bestmove none');
      expect(result).toEqual({
        bestmove: null,
        ponder: null
      });
    });

    it('should handle bestmove null', () => {
      const result = parseBestMove('bestmove null');
      expect(result).toEqual({
        bestmove: null,
        ponder: null
      });
    });

    it('should handle bestmove (none)', () => {
      const result = parseBestMove('bestmove (none)');
      expect(result).toEqual({
        bestmove: null,
        ponder: null
      });
    });

    it('should handle extra whitespace', () => {
      const result = parseBestMove('  bestmove   e2e4   ponder   e7e5  ');
      expect(result).toEqual({
        bestmove: 'e2e4',
        ponder: 'e7e5'
      });
    });
  });

  describe('real-world examples', () => {
    it('should parse typical opening bestmove', () => {
      const result = parseBestMove('bestmove e2e4 ponder c7c5');
      expect(result).toEqual({
        bestmove: 'e2e4',
        ponder: 'c7c5'
      });
    });

    it('should parse knight move', () => {
      const result = parseBestMove('bestmove g1f3 ponder d7d5');
      expect(result).toEqual({
        bestmove: 'g1f3',
        ponder: 'd7d5'
      });
    });

    it('should parse castling move (kingside)', () => {
      const result = parseBestMove('bestmove e1g1 ponder e8g8');
      expect(result).toEqual({
        bestmove: 'e1g1',
        ponder: 'e8g8'
      });
    });

    it('should parse castling move (queenside)', () => {
      const result = parseBestMove('bestmove e1c1');
      expect(result).toEqual({
        bestmove: 'e1c1',
        ponder: null
      });
    });
  });
});
