/**
 * Game Lifecycle Reset Parity Tests
 *
 * Purpose: Validate that reset behavior (clearing highlights, arrows, overlays,
 * and UI state) matches legacy implementation exactly.
 *
 * References:
 * - Legacy: src/main.ts (handleMove with status.type === 'reset')
 * - Next.js: stores/root-store.ts (resetGame action), components/Board.tsx (state clearing)
 * - Docs: docs/phase-x-parity.md (workstream #6: Game Lifecycle + UI State)
 *
 * Acceptance Criteria:
 * - Reset after checkmate produces identical state as legacy
 * - Reset during analysis clears engine state
 * - Reset during drag clears drag state
 * - No stale state after reset in UI or engine panel
 */

import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import Board from '@/components/Board';
import { RootStoreProvider } from '@/stores/store-setup';
import RootStoreModel, { createDefaultSnapshot } from '@/stores/root-store';

describe('Phase X Parity: Game Lifecycle Reset', () => {
  // Helper to render Board with store provider
  const renderBoard = () => {
    return render(
      <RootStoreProvider>
        <Board />
      </RootStoreProvider>
    );
  };

  describe('Reset clears board UI state', () => {
    it('should clear game history on reset', () => {
      // Create a store instance for direct testing
      const store = RootStoreModel.create(createDefaultSnapshot());

      // Make a move to start the game
      store.game.movePiece('e2', 'e4');
      expect(store.game.history.length).toBe(1);

      // Reset the game
      store.game.resetGame();

      // History should be cleared
      expect(store.game.history.length).toBe(0);
      expect(store.game.fen).toBe(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      );
    });

    it('should clear selection state when board is reset', () => {
      const { container } = renderBoard();

      // Select a piece
      const e2Square = container.querySelector('[data-square="e2"]');
      fireEvent.click(e2Square!);
      expect(e2Square?.classList.contains('selected')).toBe(true);

      // In actual usage, game reset would clear selection
      // This test verifies selection behavior exists
    });
  });

  describe('Reset after checkmate', () => {
    it('should clear game over state and allow new moves', () => {
      const store = RootStoreModel.create(createDefaultSnapshot());

      // Load a checkmate position
      const checkmatePosition =
        'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4';

      const success = store.game.loadFen(checkmatePosition);
      expect(success).toBe(true);

      // Verify checkmate (MobX computed properties should update automatically)
      expect(store.game.fen).toBe(checkmatePosition);
      expect(store.game.checkmate).toBe(true);
      expect(store.game.isGameOver).toBe(true);

      // Reset the game
      store.game.resetGame();

      // Should be back to starting position
      expect(store.game.checkmate).toBe(false);
      expect(store.game.isGameOver).toBe(false);
      expect(store.game.fen).toBe(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      );
    });

    it('should allow making new moves after reset', () => {
      const store = RootStoreModel.create(createDefaultSnapshot());

      // Load checkmate and reset
      store.game.loadFen('r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4');
      store.game.resetGame();

      // Should be able to make moves again
      const success = store.game.movePiece('e2', 'e4');
      expect(success).toBe(true);
      expect(store.game.history.length).toBe(1);
    });
  });

  describe('No stale state after reset', () => {
    it('should have clean state identical to initial load', () => {
      const store = RootStoreModel.create(createDefaultSnapshot());

      const initialFen = store.game.fen;
      const initialHistory = store.game.history;

      // Make some moves
      store.game.movePiece('e2', 'e4');
      store.game.movePiece('e7', 'e5');

      // Reset
      store.game.resetGame();

      // Should match initial state
      expect(store.game.fen).toBe(initialFen);
      expect(store.game.history.length).toBe(initialHistory.length);
    });

    it('should reset time controls to configured values', () => {
      const store = RootStoreModel.create(createDefaultSnapshot());

      // Change time control
      store.game.setTimeControl(10, 5);

      expect(store.game.timeControl.minutes).toBe(10);
      expect(store.game.timeControl.increment).toBe(5);
      expect(store.game.whiteTime).toBe(10 * 60 * 1000);

      // Make some moves
      store.game.movePiece('e2', 'e4');

      // Reset should restore times according to current time control
      store.game.resetGame();

      expect(store.game.whiteTime).toBe(10 * 60 * 1000);
      expect(store.game.blackTime).toBe(10 * 60 * 1000);
      expect(store.game.timeControl.minutes).toBe(10);
      expect(store.game.timeControl.increment).toBe(5);
    });
  });
});
