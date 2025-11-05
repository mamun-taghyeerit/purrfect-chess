/**
 * Basic tests for MobX Root Store
 * 
 * Demonstrates how to test MobX-State-Tree stores
 */

import { describe, it, expect, beforeEach } from 'vitest';
import RootStoreModel, { createDefaultSnapshot } from '@/stores/root-store';

describe('Root Store', () => {
  let store: any;

  beforeEach(() => {
    // Create a fresh store instance for each test
    store = RootStoreModel.create(createDefaultSnapshot());
  });

  describe('Game Store', () => {
    it('should initialize with default position', () => {
      expect(store.game.fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      expect(store.game.turn).toBe('w');
      expect(store.game.isGameOver).toBe(false);
    });

    it('should move a piece and update state', () => {
      const success = store.game.movePiece('e2', 'e4');
      
      expect(success).toBe(true);
      expect(store.game.history.length).toBe(1);
      expect(store.game.turn).toBe('b');
    });

    it('should reject illegal moves', () => {
      const success = store.game.movePiece('e2', 'e5'); // Illegal pawn move
      
      expect(success).toBe(false);
      expect(store.game.history.length).toBe(0);
    });

    it('should reset game to initial position', () => {
      store.game.movePiece('e2', 'e4');
      store.game.resetGame();
      
      expect(store.game.fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
      expect(store.game.history.length).toBe(0);
      expect(store.game.turn).toBe('w');
    });

    it('should load FEN correctly', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
      const success = store.game.loadFen(fen);
      
      expect(success).toBe(true);
      expect(store.game.fen).toBe(fen);
      expect(store.game.turn).toBe('b');
    });

    it('should apply time increment on move', () => {
      const initialWhiteTime = store.game.whiteTime;
      store.game.movePiece('e2', 'e4');
      
      const incrementMs = store.game.timeControl.increment * 1000;
      expect(store.game.whiteTime).toBe(initialWhiteTime + incrementMs);
    });
  });

  describe('UI Store', () => {
    it('should initialize with default UI state', () => {
      expect(store.ui.isEnginePanelVisible).toBe(false);
      expect(store.ui.isEvalBarVisible).toBe(false);
      expect(store.ui.isBoardFlipped).toBe(false);
      expect(store.ui.engineDisplayMode).toBe('both');
    });

    it('should toggle engine panel visibility', () => {
      store.ui.toggleEnginePanel();
      expect(store.ui.isEnginePanelVisible).toBe(true);
      
      store.ui.toggleEnginePanel();
      expect(store.ui.isEnginePanelVisible).toBe(false);
    });

    it('should toggle board flip', () => {
      store.ui.toggleBoardFlip();
      expect(store.ui.isBoardFlipped).toBe(true);
    });

    it('should set engine display mode', () => {
      store.ui.setEngineDisplayMode('arrows');
      expect(store.ui.engineDisplayMode).toBe('arrows');
    });
  });

  describe('Settings Store', () => {
    it('should initialize with default settings', () => {
      expect(store.settings.defaultTimeMinutes).toBe(5);
      expect(store.settings.defaultTimeIncrement).toBe(0);
      expect(store.settings.defaultEngineDepth).toBe(22);
    });

    it('should update default time control', () => {
      store.settings.setDefaultTime(10, 5);
      
      expect(store.settings.defaultTimeMinutes).toBe(10);
      expect(store.settings.defaultTimeIncrement).toBe(5);
    });

    it('should update default engine depth', () => {
      store.settings.setDefaultEngineDepth(18);
      
      expect(store.settings.defaultEngineDepth).toBe(18);
    });
  });

  describe('Timer Functionality', () => {
    it('should start and stop timer', () => {
      expect(store.game.isTimerRunning).toBe(false);
      
      store.game.startTimer();
      expect(store.game.isTimerRunning).toBe(true);
      
      store.game.stopTimer();
      expect(store.game.isTimerRunning).toBe(false);
    });

    it('should decrement time on tick', () => {
      const initialTime = store.game.whiteTime;
      store.game.startTimer();
      store.game.tickTimer(1000); // Tick 1 second
      
      expect(store.game.whiteTime).toBe(initialTime - 1000);
    });

    it('should decrement black time when it is blacks turn', () => {
      // Make a move so it's black's turn
      store.game.movePiece('e2', 'e4');
      expect(store.game.turn).toBe('b');
      
      store.game.startTimer(); // Must start timer
      const initialBlackTime = store.game.blackTime;
      store.game.tickTimer(1000);
      
      expect(store.game.blackTime).toBe(initialBlackTime - 1000);
    });
  });
});
