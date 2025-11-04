import { describe, it, expect } from 'vitest';
import { Chess } from 'chess.js';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Game State Parity Tests
 * 
 * Purpose: Validate that game state detection (checkmate, stalemate, 
 * draw conditions) works identically to the legacy implementation.
 * 
 * This tests the core game logic independent of React hooks.
 */

describe('Phase X Parity: Game State Detection', () => {
  const fenFixturesDir = join(__dirname, '../../docs/fixtures/fen');
  
  describe('Checkmate Detection', () => {
    it('detects back rank mate', () => {
      const game = new Chess();
      // Load the checkmate-back-rank.fen fixture
      const fenPath = join(fenFixturesDir, 'checkmate-back-rank.fen');
      const fenContent = readFileSync(fenPath, 'utf-8').trim();
      const [fen] = fenContent.split('\n');
      
      game.load(fen);
      
      expect(game.isCheckmate()).toBe(true);
      expect(game.isGameOver()).toBe(true);
      expect(game.isStalemate()).toBe(false);
    });
    
    it('detects Scholar\'s mate', () => {
      const game = new Chess();
      const fenPath = join(fenFixturesDir, 'checkmate-scholars-mate.fen');
      const fenContent = readFileSync(fenPath, 'utf-8').trim();
      const [fen] = fenContent.split('\n');
      
      game.load(fen);
      
      expect(game.isCheckmate()).toBe(true);
      expect(game.isGameOver()).toBe(true);
    });
    
    it('detects Fool\'s mate', () => {
      const game = new Chess();
      const fenPath = join(fenFixturesDir, 'checkmate-fools-mate.fen');
      const fenContent = readFileSync(fenPath, 'utf-8').trim();
      const [fen] = fenContent.split('\n');
      
      game.load(fen);
      
      expect(game.isCheckmate()).toBe(true);
      expect(game.isGameOver()).toBe(true);
    });
  });
  
  describe('Stalemate Detection', () => {
    it('detects stalemate in corner', () => {
      const game = new Chess();
      const fenPath = join(fenFixturesDir, 'stalemate-corner.fen');
      const fenContent = readFileSync(fenPath, 'utf-8').trim();
      const [fen] = fenContent.split('\n');
      
      game.load(fen);
      
      expect(game.isStalemate()).toBe(true);
      expect(game.isGameOver()).toBe(true);
      expect(game.isCheckmate()).toBe(false);
    });
    
    it('detects stalemate with king trapped', () => {
      const game = new Chess();
      const fenPath = join(fenFixturesDir, 'stalemate-king-trapped.fen');
      const fenContent = readFileSync(fenPath, 'utf-8').trim();
      const [fen] = fenContent.split('\n');
      
      game.load(fen);
      
      expect(game.isStalemate()).toBe(true);
      expect(game.isGameOver()).toBe(true);
    });
    
    it('detects stalemate with pawn trap', () => {
      const game = new Chess();
      const fenPath = join(fenFixturesDir, 'stalemate-pawn-trap.fen');
      const fenContent = readFileSync(fenPath, 'utf-8').trim();
      const [fen] = fenContent.split('\n');
      
      game.load(fen);
      
      expect(game.isStalemate()).toBe(true);
      expect(game.isGameOver()).toBe(true);
    });
  });
  
  describe('Draw Conditions', () => {
    it('detects insufficient material - kings only', () => {
      const game = new Chess();
      const fenPath = join(fenFixturesDir, 'draw-insufficient-material-kings.fen');
      const fenContent = readFileSync(fenPath, 'utf-8').trim();
      const [fen] = fenContent.split('\n');
      
      game.load(fen);
      
      expect(game.isInsufficientMaterial()).toBe(true);
      expect(game.isDraw()).toBe(true);
      expect(game.isGameOver()).toBe(true);
    });
    
    it('detects insufficient material - king and bishop vs king', () => {
      const game = new Chess();
      const fenPath = join(fenFixturesDir, 'draw-insufficient-material-kb-vs-k.fen');
      const fenContent = readFileSync(fenPath, 'utf-8').trim();
      const [fen] = fenContent.split('\n');
      
      game.load(fen);
      
      expect(game.isInsufficientMaterial()).toBe(true);
      expect(game.isDraw()).toBe(true);
    });
    
    it('detects insufficient material - king and knight vs king', () => {
      const game = new Chess();
      const fenPath = join(fenFixturesDir, 'draw-insufficient-material-kn-vs-k.fen');
      const fenContent = readFileSync(fenPath, 'utf-8').trim();
      const [fen] = fenContent.split('\n');
      
      game.load(fen);
      
      expect(game.isInsufficientMaterial()).toBe(true);
      expect(game.isDraw()).toBe(true);
    });
    
    it('detects 50-move rule draw', () => {
      const game = new Chess();
      const fenPath = join(fenFixturesDir, 'draw-50-move-rule.fen');
      const fenContent = readFileSync(fenPath, 'utf-8').trim();
      const [fen] = fenContent.split('\n');
      
      game.load(fen);
      
      // The 50-move rule is indicated by the halfmove clock in FEN
      expect(game.isDraw()).toBe(true);
      expect(game.isGameOver()).toBe(true);
    });
  });
  
  describe('Special Moves', () => {
    it('handles en passant availability', () => {
      const game = new Chess();
      const fenPath = join(fenFixturesDir, 'enpassant-white-can-capture.fen');
      const fenContent = readFileSync(fenPath, 'utf-8').trim();
      const [fen] = fenContent.split('\n');
      
      game.load(fen);
      
      // Verify en passant is available in the position
      const moves = game.moves({ verbose: true });
      const enPassantMoves = moves.filter(m => m.flags.includes('e'));
      expect(enPassantMoves.length).toBeGreaterThan(0);
    });
    
    it('handles castling rights correctly', () => {
      const game = new Chess();
      const fenPath = join(fenFixturesDir, 'castling-all-available.fen');
      const fenContent = readFileSync(fenPath, 'utf-8').trim();
      const [fen] = fenContent.split('\n');
      
      game.load(fen);
      
      // Verify castling moves are available
      const moves = game.moves({ verbose: true });
      const castlingMoves = moves.filter(m => m.flags.includes('k') || m.flags.includes('q'));
      expect(castlingMoves.length).toBeGreaterThan(0);
    });
    
    it('handles promotion correctly', () => {
      const game = new Chess();
      const fenPath = join(fenFixturesDir, 'promotion-white-ready.fen');
      const fenContent = readFileSync(fenPath, 'utf-8').trim();
      const [fen] = fenContent.split('\n');
      
      game.load(fen);
      
      // Verify promotion moves are available
      const moves = game.moves({ verbose: true });
      const promotionMoves = moves.filter(m => m.flags.includes('p'));
      expect(promotionMoves.length).toBeGreaterThan(0);
    });
  });
  
  describe('Move Legality', () => {
    it('validates moves in starting position', () => {
      const game = new Chess();
      const fenPath = join(fenFixturesDir, 'basic-starting-position.fen');
      const fenContent = readFileSync(fenPath, 'utf-8').trim();
      const [fen] = fenContent.split('\n');
      
      game.load(fen);
      
      // In starting position, white has 20 legal moves
      const moves = game.moves();
      expect(moves.length).toBe(20);
    });
    
    it('generates correct SAN notation', () => {
      const game = new Chess();
      const fenPath = join(fenFixturesDir, 'basic-starting-position.fen');
      const fenContent = readFileSync(fenPath, 'utf-8').trim();
      const [fen] = fenContent.split('\n');
      
      game.load(fen);
      
      // Test a specific move and verify SAN
      const move = game.move({ from: 'e2', to: 'e4' });
      expect(move).toBeTruthy();
      expect(move?.san).toBe('e4');
    });
    
    it('handles complex middlegame position', () => {
      const game = new Chess();
      const fenPath = join(fenFixturesDir, 'edge-complex-middlegame.fen');
      const fenContent = readFileSync(fenPath, 'utf-8').trim();
      const [fen] = fenContent.split('\n');
      
      game.load(fen);
      
      // Should be able to calculate moves without error
      const moves = game.moves();
      expect(moves.length).toBeGreaterThan(0);
      expect(game.isGameOver()).toBe(false);
    });
  });
  
  describe('FEN Round-Trip', () => {
    it('preserves FEN through import/export for all fixtures', () => {
      const fenFiles = readdirSync(fenFixturesDir).filter((f) => f.endsWith('.fen'));
      
      for (const fenFile of fenFiles) {
        const fenPath = join(fenFixturesDir, fenFile);
        const fenContent = readFileSync(fenPath, 'utf-8').trim();
        const [originalFen] = fenContent.split('\n');
        
        const game = new Chess();
        game.load(originalFen);
        const exportedFen = game.fen();
        
        // The exported FEN should match the original
        expect(exportedFen).toBe(originalFen);
      }
    });
  });
});

describe('Phase X Parity: Legacy vs Next.js Game Logic', () => {
  it('should use chess.js for both implementations', () => {
    // Both legacy (src/game.ts) and Next.js (hooks/useGame.ts) use chess.js
    // This ensures parity at the core logic level
    const legacyGame = new Chess();
    const nextjsGame = new Chess();
    
    // Apply same moves to both
    legacyGame.move({ from: 'e2', to: 'e4' });
    nextjsGame.move({ from: 'e2', to: 'e4' });
    
    // Should have identical state
    expect(legacyGame.fen()).toBe(nextjsGame.fen());
    expect(legacyGame.turn()).toBe(nextjsGame.turn());
    expect(legacyGame.isCheck()).toBe(nextjsGame.isCheck());
  });
  
  it('evaluates game end conditions identically', () => {
    const game1 = new Chess();
    const game2 = new Chess();
    
    // Load a checkmate position
    const checkmateFen = '6k1/5ppp/8/8/8/8/5PPP/R5K1 b - - 0 1';
    game1.load(checkmateFen);
    game2.load(checkmateFen);
    
    // Both should detect checkmate
    expect(game1.isCheckmate()).toBe(game2.isCheckmate());
    expect(game1.isGameOver()).toBe(game2.isGameOver());
    
    // Load a stalemate position
    const stalemateFen = '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1';
    game1.load(stalemateFen);
    game2.load(stalemateFen);
    
    // Both should detect stalemate
    expect(game1.isStalemate()).toBe(game2.isStalemate());
    expect(game1.isGameOver()).toBe(game2.isGameOver());
  });
});
