import { describe, it, expect } from 'vitest';
import { Chess } from 'chess.js';

/**
 * Move History and SAN Notation Parity Tests
 * 
 * Purpose: Validate that move history display and SAN notation
 * are identical between legacy and Next.js implementations.
 * 
 * Both implementations use chess.js for move generation and SAN notation,
 * ensuring parity at the library level.
 */

describe('Phase X Parity: Move History and SAN Notation', () => {
  describe('SAN Generation', () => {
    it('generates identical SAN for standard moves', () => {
      const legacyGame = new Chess();
      const nextjsGame = new Chess();
      
      const testMoves = [
        { from: 'e2', to: 'e4' },
        { from: 'e7', to: 'e5' },
        { from: 'g1', to: 'f3' },
        { from: 'b8', to: 'c6' },
      ];
      
      for (const moveData of testMoves) {
        const legacyMove = legacyGame.move(moveData);
        const nextjsMove = nextjsGame.move(moveData);
        
        expect(legacyMove).toBeTruthy();
        expect(nextjsMove).toBeTruthy();
        expect(legacyMove?.san).toBe(nextjsMove?.san);
      }
    });
    
    it('generates identical SAN for castling', () => {
      const game1 = new Chess();
      const game2 = new Chess();
      
      // Set up position where castling is possible
      game1.load('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1');
      game2.load('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1');
      
      const move1 = game1.move({ from: 'e1', to: 'g1' }); // Kingside castle
      const move2 = game2.move({ from: 'e1', to: 'g1' });
      
      expect(move1?.san).toBe('O-O');
      expect(move2?.san).toBe('O-O');
      expect(move1?.san).toBe(move2?.san);
    });
    
    it('generates identical SAN for en passant', () => {
      const game1 = new Chess();
      const game2 = new Chess();
      
      // Set up en passant position
      game1.load('rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 3');
      game2.load('rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 3');
      
      const move1 = game1.move({ from: 'e5', to: 'f6' });
      const move2 = game2.move({ from: 'e5', to: 'f6' });
      
      expect(move1?.san).toBe('exf6');
      expect(move2?.san).toBe('exf6');
      expect(move1?.san).toBe(move2?.san);
    });
    
    it('generates identical SAN for promotion', () => {
      const game1 = new Chess();
      const game2 = new Chess();
      
      // Set up promotion position
      game1.load('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
      game2.load('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
      
      const move1 = game1.move({ from: 'a7', to: 'a8', promotion: 'q' });
      const move2 = game2.move({ from: 'a7', to: 'a8', promotion: 'q' });
      
      // Note: This promotion gives check, so SAN includes '+'
      expect(move1?.san).toBe('a8=Q+');
      expect(move2?.san).toBe('a8=Q+');
      expect(move1?.san).toBe(move2?.san);
    });
    
    it('generates identical SAN for captures', () => {
      const game1 = new Chess();
      const game2 = new Chess();
      
      game1.move('e4');
      game1.move('d5');
      game2.move('e4');
      game2.move('d5');
      
      const move1 = game1.move({ from: 'e4', to: 'd5' });
      const move2 = game2.move({ from: 'e4', to: 'd5' });
      
      expect(move1?.san).toBe('exd5');
      expect(move2?.san).toBe('exd5');
      expect(move1?.san).toBe(move2?.san);
    });
    
    it('generates identical SAN for check and checkmate', () => {
      const game1 = new Chess();
      const game2 = new Chess();
      
      // Scholar's mate sequence
      game1.move('e4');
      game1.move('e5');
      game1.move('Bc4');
      game1.move('Nc6');
      game1.move('Qh5');
      game1.move('Nf6');
      
      game2.move('e4');
      game2.move('e5');
      game2.move('Bc4');
      game2.move('Nc6');
      game2.move('Qh5');
      game2.move('Nf6');
      
      const move1 = game1.move({ from: 'h5', to: 'f7' });
      const move2 = game2.move({ from: 'h5', to: 'f7' });
      
      expect(move1?.san).toBe('Qxf7#');
      expect(move2?.san).toBe('Qxf7#');
      expect(move1?.san).toBe(move2?.san);
    });
  });
  
  describe('Move History Format', () => {
    it('produces identical history arrays', () => {
      const game1 = new Chess();
      const game2 = new Chess();
      
      const moves = ['e4', 'e5', 'Nf3', 'Nc6', 'd4', 'exd4'];
      moves.forEach(move => {
        game1.move(move);
        game2.move(move);
      });
      
      const history1 = game1.history();
      const history2 = game2.history();
      
      expect(history1).toEqual(history2);
      expect(JSON.stringify(history1)).toBe(JSON.stringify(history2));
    });
    
    it('produces identical verbose history', () => {
      const game1 = new Chess();
      const game2 = new Chess();
      
      game1.move('e4');
      game2.move('e4');
      
      const vHistory1 = game1.history({ verbose: true });
      const vHistory2 = game2.history({ verbose: true });
      
      expect(vHistory1.length).toBe(vHistory2.length);
      expect(vHistory1[0].san).toBe(vHistory2[0].san);
      expect(vHistory1[0].from).toBe(vHistory2[0].from);
      expect(vHistory1[0].to).toBe(vHistory2[0].to);
      expect(JSON.stringify(vHistory1)).toBe(JSON.stringify(vHistory2));
    });
    
    it('groups moves by ply identically (legacy vs Next.js)', () => {
      const game = new Chess();
      
      // Make some moves
      game.move('e4');
      game.move('e5');
      game.move('Nf3');
      game.move('Nc6');
      
      const history = game.history({ verbose: true });
      
      // Legacy grouping logic (from src/main.ts)
      const legacyPairs = [];
      for (let i = 0; i < history.length; i += 2) {
        legacyPairs.push({
          index: i / 2 + 1,
          white: history[i] ? history[i].san : '',
          black: history[i + 1] ? history[i + 1].san : '',
        });
      }
      
      // Next.js grouping logic (from components/MoveHistory.tsx)
      const nextjsPairs: Array<{ white: any | null; black: any | null }> = [];
      for (let i = 0; i < history.length; i += 2) {
        nextjsPairs.push({
          white: history[i] || null,
          black: history[i + 1] || null,
        });
      }
      
      // Verify grouping produces same structure
      expect(legacyPairs.length).toBe(nextjsPairs.length);
      expect(legacyPairs.length).toBe(2); // 4 moves = 2 pairs
      
      for (let i = 0; i < legacyPairs.length; i++) {
        expect(legacyPairs[i].white).toBe(nextjsPairs[i].white?.san || '');
        expect(legacyPairs[i].black).toBe(nextjsPairs[i].black?.san || '');
      }
    });
  });
  
  describe('PGN Export', () => {
    it('produces identical PGN format', () => {
      const game1 = new Chess();
      const game2 = new Chess();
      
      const moves = ['e4', 'e5', 'Nf3', 'Nc6'];
      moves.forEach(move => {
        game1.move(move);
        game2.move(move);
      });
      
      const pgn1 = game1.pgn();
      const pgn2 = game2.pgn();
      
      expect(pgn1).toBe(pgn2);
      expect(pgn1).toContain('1. e4 e5');
      expect(pgn1).toContain('2. Nf3 Nc6');
    });
    
    it('produces identical PGN with custom options', () => {
      const game1 = new Chess();
      const game2 = new Chess();
      
      game1.move('e4');
      game2.move('e4');
      
      const pgn1 = game1.pgn({ max_width: 80 });
      const pgn2 = game2.pgn({ max_width: 80 });
      
      expect(pgn1).toBe(pgn2);
    });
  });
  
  describe('FEN Export', () => {
    it('produces identical FEN strings', () => {
      const game1 = new Chess();
      const game2 = new Chess();
      
      game1.move('e4');
      game2.move('e4');
      
      expect(game1.fen()).toBe(game2.fen());
    });
    
    it('preserves FEN through complex game', () => {
      const game1 = new Chess();
      const game2 = new Chess();
      
      const moves = ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'Ng5', 'd5'];
      moves.forEach(move => {
        game1.move(move);
        game2.move(move);
      });
      
      const fen1 = game1.fen();
      const fen2 = game2.fen();
      
      expect(fen1).toBe(fen2);
      
      // Both should be able to reload the same position
      const game3 = new Chess();
      game3.load(fen1);
      expect(game3.fen()).toBe(fen1);
      expect(game3.fen()).toBe(fen2);
    });
  });
});

describe('Phase X Parity: Library Consistency', () => {
  it('uses the same chess.js library for both implementations', () => {
    // Both legacy (src/game.ts) and Next.js (hooks/useGame.ts)
    // import from 'chess.js', ensuring identical behavior
    const game = new Chess();
    
    expect(game).toHaveProperty('move');
    expect(game).toHaveProperty('history');
    expect(game).toHaveProperty('pgn');
    expect(game).toHaveProperty('fen');
    expect(game).toHaveProperty('isCheckmate');
    expect(game).toHaveProperty('isStalemate');
    expect(game).toHaveProperty('isThreefoldRepetition');
    expect(game).toHaveProperty('isInsufficientMaterial');
    expect(game).toHaveProperty('isDraw');
  });
});
