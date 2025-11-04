/**
 * Game Lifecycle Reset Parity Tests
 *
 * Purpose: Validate that reset behavior (clearing highlights, arrows, overlays,
 * and UI state) matches legacy implementation exactly.
 *
 * References:
 * - Legacy: src/main.ts (handleMove with status.type === 'reset')
 * - Next.js: hooks/useGame.ts (resetGame), components/Board.tsx (state clearing)
 * - Docs: docs/phase-x-parity.md (workstream #6: Game Lifecycle + UI State)
 *
 * Acceptance Criteria:
 * - Reset after checkmate produces identical state as legacy
 * - Reset during analysis clears engine state
 * - Reset during drag clears drag state
 * - No stale state after reset in UI or engine panel
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import Board from '@/components/Board';
import { useGame } from '@/hooks/useGame';
import * as useGameModule from '@/hooks/useGame';

describe('Phase X Parity: Game Lifecycle Reset', () => {
  describe('Reset clears board UI state', () => {
    it('should clear selected square on reset', () => {
      const { result } = renderHook(() => useGame());

      // Make a move to start the game
      act(() => {
        result.current.movePiece('e2', 'e4');
      });

      expect(result.current.history.length).toBe(1);

      // Reset the game
      act(() => {
        result.current.resetGame();
      });

      // History should be cleared
      expect(result.current.history.length).toBe(0);
      expect(result.current.fen).toBe(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      );
    });

    it('should clear selection state when history resets to empty', () => {
      // Mock the useGame hook to have a controlled state
      const mockMovePiece = vi.fn();
      const mockResetGame = vi.fn();

      const mockState = {
        position: {
          e2: { type: 'p', color: 'w' },
          e4: { type: 'p', color: 'w' }, // Piece moved
        },
        fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
        history: [{ from: 'e2', to: 'e4', san: 'e4' }],
        isGameOver: false,
        turn: 'b' as const,
        check: false,
        checkmate: false,
        stalemate: false,
        whiteTime: 300000,
        blackTime: 300000,
        timeControl: { minutes: 5, increment: 0 },
        movePiece: mockMovePiece,
        resetGame: mockResetGame,
        loadFen: vi.fn(),
        getFen: vi.fn(),
        getPgn: vi.fn(),
        setTimeControl: vi.fn(),
        isTimerRunning: false,
        game: {
          moves: vi.fn(() => [
            { from: 'e2', to: 'e3', san: 'e3', flags: 'n' },
            { from: 'e2', to: 'e4', san: 'e4', flags: 'b' },
          ]),
          board: vi.fn(),
          fen: vi.fn(
            () =>
              'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
          ),
          history: vi.fn(() => [{ from: 'e2', to: 'e4', san: 'e4' }]),
          turn: vi.fn(() => 'b'),
          isCheck: vi.fn(() => false),
          isCheckmate: vi.fn(() => false),
          isStalemate: vi.fn(() => false),
          isGameOver: vi.fn(() => false),
        } as any,
      };

      const useGameSpy = vi
        .spyOn(useGameModule, 'useGame')
        .mockReturnValue(mockState);

      const { container, rerender } = render(<Board />);

      // Select a piece (e2)
      const e2Square = container.querySelector('[data-square="e2"]');
      fireEvent.click(e2Square!);

      // Verify selection exists
      expect(e2Square?.classList.contains('selected')).toBe(true);

      // Simulate reset by updating mock to empty history
      useGameSpy.mockReturnValue({
        ...mockState,
        history: [],
        position: {
          e2: { type: 'p', color: 'w' },
        },
      });

      // Trigger re-render
      rerender(<Board />);

      // Selection should be cleared
      expect(e2Square?.classList.contains('selected')).toBe(false);

      useGameSpy.mockRestore();
    });

    it('should clear drag state on reset', async () => {
      const { result } = renderHook(() => useGame());

      // Make a move first
      act(() => {
        result.current.movePiece('e2', 'e4');
      });

      expect(result.current.history.length).toBe(1);

      const mockState = {
        position: {
          d2: { type: 'p', color: 'w' },
        },
        fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
        history: [{ from: 'e2', to: 'e4', san: 'e4' }],
        isGameOver: false,
        turn: 'b' as const,
        check: false,
        checkmate: false,
        stalemate: false,
        whiteTime: 300000,
        blackTime: 300000,
        timeControl: { minutes: 5, increment: 0 },
        movePiece: vi.fn(),
        resetGame: vi.fn(),
        loadFen: vi.fn(),
        getFen: vi.fn(),
        getPgn: vi.fn(),
        setTimeControl: vi.fn(),
        isTimerRunning: false,
        game: {
          moves: vi.fn(() => [
            { from: 'd2', to: 'd3', san: 'd3', flags: 'n' },
            { from: 'd2', to: 'd4', san: 'd4', flags: 'b' },
          ]),
          board: vi.fn(),
          fen: vi.fn(
            () =>
              'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
          ),
          history: vi.fn(() => [{ from: 'e2', to: 'e4', san: 'e4' }]),
          turn: vi.fn(() => 'b'),
          isCheck: vi.fn(() => false),
          isCheckmate: vi.fn(() => false),
          isStalemate: vi.fn(() => false),
          isGameOver: vi.fn(() => false),
        } as any,
      };

      const useGameSpy = vi
        .spyOn(useGameModule, 'useGame')
        .mockReturnValue(mockState);

      const { container, rerender } = render(<Board />);
      const d2Square = container.querySelector('[data-square="d2"]');
      const d2Image = d2Square?.querySelector('img');

      // Start drag
      fireEvent.dragStart(d2Image!, {
        dataTransfer: { effectAllowed: '', setData: vi.fn() },
      });

      // Should have drag-selected class
      expect(d2Square?.classList.contains('drag-selected')).toBe(true);

      // Simulate reset
      mockState.history = [];
      useGameSpy.mockReturnValue({
        ...mockState,
        history: [],
      });

      rerender(<Board />);

      // Drag state should be cleared
      await waitFor(() => {
        expect(d2Square?.classList.contains('drag-selected')).toBe(false);
      });

      useGameSpy.mockRestore();
    });
  });

  describe('Reset after checkmate', () => {
    it('should clear game over state and allow new moves', () => {
      const { result } = renderHook(() => useGame());

      // Load a checkmate position
      const checkmatePosition =
        'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4';

      act(() => {
        result.current.loadFen(checkmatePosition);
      });

      // Verify checkmate
      expect(result.current.checkmate).toBe(true);
      expect(result.current.isGameOver).toBe(true);

      // Reset the game
      act(() => {
        result.current.resetGame();
      });

      // Should be back to starting position
      expect(result.current.checkmate).toBe(false);
      expect(result.current.isGameOver).toBe(false);
      expect(result.current.fen).toBe(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      );
      expect(result.current.history.length).toBe(0);
    });

    it('should clear last move highlight after reset', () => {
      const { result } = renderHook(() => useGame());

      // Make some moves
      act(() => {
        result.current.movePiece('e2', 'e4');
        result.current.movePiece('e7', 'e5');
      });

      expect(result.current.history.length).toBe(2);

      // Reset
      act(() => {
        result.current.resetGame();
      });

      // History should be empty (which means no last move to highlight)
      expect(result.current.history.length).toBe(0);
    });
  });

  describe('Reset during drag operation', () => {
    it('should cancel drag and clear all drag state', async () => {
      const mockMovePiece = vi.fn();
      const mockResetGame = vi.fn();

      const mockState = {
        position: {
          e2: { type: 'p', color: 'w' },
        },
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        history: [{ from: 'd2', to: 'd4', san: 'd4' }], // Has history
        isGameOver: false,
        turn: 'w' as const,
        check: false,
        checkmate: false,
        stalemate: false,
        whiteTime: 300000,
        blackTime: 300000,
        timeControl: { minutes: 5, increment: 0 },
        movePiece: mockMovePiece,
        resetGame: mockResetGame,
        loadFen: vi.fn(),
        getFen: vi.fn(),
        getPgn: vi.fn(),
        setTimeControl: vi.fn(),
        isTimerRunning: false,
        game: {
          moves: vi.fn(() => [
            { from: 'e2', to: 'e3', san: 'e3', flags: 'n' },
            { from: 'e2', to: 'e4', san: 'e4', flags: 'b' },
          ]),
          board: vi.fn(),
          fen: vi.fn(
            () => 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
          ),
          history: vi.fn(() => []),
          turn: vi.fn(() => 'w'),
          isCheck: vi.fn(() => false),
          isCheckmate: vi.fn(() => false),
          isStalemate: vi.fn(() => false),
          isGameOver: vi.fn(() => false),
        } as any,
      };

      const useGameSpy = vi
        .spyOn(useGameModule, 'useGame')
        .mockReturnValue(mockState);

      const { container, rerender } = render(<Board />);
      const e2Square = container.querySelector('[data-square="e2"]');
      const e2Image = e2Square?.querySelector('img');

      // Start drag
      fireEvent.dragStart(e2Image!, {
        dataTransfer: { effectAllowed: '', setData: vi.fn() },
      });

      // Verify drag started
      expect(e2Square?.classList.contains('drag-selected')).toBe(true);

      // Simulate reset by clearing history
      mockState.history = [];
      useGameSpy.mockReturnValue({
        ...mockState,
        history: [],
      });

      rerender(<Board />);

      // Drag state should be cleared
      await waitFor(() => {
        expect(e2Square?.classList.contains('drag-selected')).toBe(false);
      });

      useGameSpy.mockRestore();
    });
  });

  describe('No stale state after reset', () => {
    it('should have clean state identical to initial load', () => {
      const { result } = renderHook(() => useGame());

      const initialFen = result.current.fen;
      const initialHistory = result.current.history;

      // Make several moves
      act(() => {
        result.current.movePiece('e2', 'e4');
        result.current.movePiece('e7', 'e5');
        result.current.movePiece('g1', 'f3');
        result.current.movePiece('b8', 'c6');
      });

      expect(result.current.history.length).toBe(4);

      // Reset
      act(() => {
        result.current.resetGame();
      });

      // Should match initial state exactly
      expect(result.current.fen).toBe(initialFen);
      expect(result.current.history).toEqual(initialHistory);
      expect(result.current.isGameOver).toBe(false);
      expect(result.current.checkmate).toBe(false);
      expect(result.current.stalemate).toBe(false);
      expect(result.current.check).toBe(false);
      expect(result.current.turn).toBe('w');
    });

    it('should reset time controls to configured values', () => {
      const { result } = renderHook(() => useGame());

      const initialTimeControl = result.current.timeControl;
      const initialWhiteTime = result.current.whiteTime;
      const initialBlackTime = result.current.blackTime;

      // Change time control
      act(() => {
        result.current.setTimeControl({ minutes: 10, increment: 5 });
      });

      expect(result.current.timeControl).toEqual({ minutes: 10, increment: 5 });
      expect(result.current.whiteTime).toBe(10 * 60 * 1000);

      // Make some moves to run clock
      act(() => {
        result.current.movePiece('e2', 'e4');
      });

      // Reset should restore times according to current time control
      act(() => {
        result.current.resetGame();
      });

      expect(result.current.whiteTime).toBe(10 * 60 * 1000);
      expect(result.current.blackTime).toBe(10 * 60 * 1000);
      expect(result.current.timeControl).toEqual({ minutes: 10, increment: 5 });
    });
  });
});
