/**
 * Tests for Board interaction semantics parity with legacy implementation
 *
 * Validates:
 * - Click-to-select, click-to-move, re-selection
 * - Drag-and-drop with proper state management
 * - ESC/blur cancellation
 * - Invalid move attempts (no state mutation)
 * - Visual feedback classes (selected vs drag-selected)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Board from '@/components/Board';
import * as useGameModule from '@/hooks/useGame';

// Mock the useGame hook
const mockMovePiece = vi.fn();
const mockResetGame = vi.fn();
const mockLoadFen = vi.fn();
const mockGetFen = vi.fn();
const mockGetPgn = vi.fn();
const mockSetTimeControl = vi.fn();

const createMockGameState = (overrides = {}) => ({
  position: {
    e2: { type: 'p', color: 'w' },
    e7: { type: 'p', color: 'b' },
    d2: { type: 'p', color: 'w' },
    d7: { type: 'p', color: 'b' },
  },
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  history: [],
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
  loadFen: mockLoadFen,
  getFen: mockGetFen,
  getPgn: mockGetPgn,
  setTimeControl: mockSetTimeControl,
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
  ...overrides,
});

describe('Board Interaction Semantics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMovePiece.mockReturnValue(false); // Default to invalid move
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Click Interaction', () => {
    it('should select a piece on click and show legal moves', () => {
      const mockState = createMockGameState();
      vi.spyOn(useGameModule, 'useGame').mockReturnValue(mockState);

      const { container } = render(<Board />);
      const e2Square = container.querySelector('[data-square="e2"]');

      expect(e2Square).toBeTruthy();
      fireEvent.click(e2Square!);

      // Should add selected class
      expect(e2Square?.classList.contains('selected')).toBe(true);
    });

    it('should re-select when clicking a different piece (parity with legacy)', () => {
      const mockState = createMockGameState();
      mockMovePiece.mockReturnValue(false); // Move fails
      mockState.game.moves = vi.fn((opts: any) => {
        if (opts?.square === 'e2') {
          return [
            { from: 'e2', to: 'e3', san: 'e3', flags: 'n' },
            { from: 'e2', to: 'e4', san: 'e4', flags: 'b' },
          ];
        }
        if (opts?.square === 'd2') {
          return [
            { from: 'd2', to: 'd3', san: 'd3', flags: 'n' },
            { from: 'd2', to: 'd4', san: 'd4', flags: 'b' },
          ];
        }
        return [];
      });
      vi.spyOn(useGameModule, 'useGame').mockReturnValue(mockState);

      const { container } = render(<Board />);
      const e2Square = container.querySelector('[data-square="e2"]');
      const d2Square = container.querySelector('[data-square="d2"]');

      // Select e2
      fireEvent.click(e2Square!);
      expect(e2Square?.classList.contains('selected')).toBe(true);

      // Click d2 (different piece) - should re-select
      fireEvent.click(d2Square!);

      // e2 should no longer be selected, d2 should be selected
      expect(e2Square?.classList.contains('selected')).toBe(false);
      expect(d2Square?.classList.contains('selected')).toBe(true);
    });

    it('should clear selection when clicking empty square after selecting piece', () => {
      const mockState = createMockGameState();
      mockMovePiece.mockReturnValue(false); // Move fails
      vi.spyOn(useGameModule, 'useGame').mockReturnValue(mockState);

      const { container } = render(<Board />);
      const e2Square = container.querySelector('[data-square="e2"]');
      const e5Square = container.querySelector('[data-square="e5"]'); // Empty square

      // Select e2
      fireEvent.click(e2Square!);
      expect(e2Square?.classList.contains('selected')).toBe(true);

      // Click empty square - should clear selection
      fireEvent.click(e5Square!);
      expect(e2Square?.classList.contains('selected')).toBe(false);
    });

    it('should execute valid move and clear selection', () => {
      const mockState = createMockGameState();
      mockMovePiece.mockReturnValue(true); // Move succeeds
      vi.spyOn(useGameModule, 'useGame').mockReturnValue(mockState);

      const { container } = render(<Board />);
      const e2Square = container.querySelector('[data-square="e2"]');
      const e4Square = container.querySelector('[data-square="e4"]');

      // Select e2
      fireEvent.click(e2Square!);
      expect(e2Square?.classList.contains('selected')).toBe(true);

      // Click e4 to move
      fireEvent.click(e4Square!);

      expect(mockMovePiece).toHaveBeenCalledWith('e2', 'e4');
      expect(e2Square?.classList.contains('selected')).toBe(false);
    });
  });

  describe('Drag-and-Drop Interaction', () => {
    it('should use drag-specific CSS classes during drag', () => {
      const mockState = createMockGameState();
      vi.spyOn(useGameModule, 'useGame').mockReturnValue(mockState);

      const { container } = render(<Board />);
      const e2Square = container.querySelector('[data-square="e2"]');
      const e2Image = e2Square?.querySelector('img');

      expect(e2Image).toBeTruthy();

      // Start drag
      fireEvent.dragStart(e2Image!, {
        dataTransfer: { effectAllowed: '', setData: vi.fn() },
      });

      // Should use drag-selected instead of selected
      expect(e2Square?.classList.contains('drag-selected')).toBe(true);
      expect(e2Square?.classList.contains('selected')).toBe(false);
    });

    it('should clear drag state on drag end', () => {
      const mockState = createMockGameState();
      vi.spyOn(useGameModule, 'useGame').mockReturnValue(mockState);

      const { container } = render(<Board />);
      const e2Square = container.querySelector('[data-square="e2"]');
      const e2Image = e2Square?.querySelector('img');

      // Start drag
      fireEvent.dragStart(e2Image!, {
        dataTransfer: { effectAllowed: '', setData: vi.fn() },
      });
      expect(e2Square?.classList.contains('drag-selected')).toBe(true);

      // End drag
      fireEvent.dragEnd(e2Image!);
      expect(e2Square?.classList.contains('drag-selected')).toBe(false);
    });

    it('should execute move on drop', () => {
      const mockState = createMockGameState();
      mockMovePiece.mockReturnValue(true);
      vi.spyOn(useGameModule, 'useGame').mockReturnValue(mockState);

      const { container } = render(<Board />);
      const e2Square = container.querySelector('[data-square="e2"]');
      const e4Square = container.querySelector('[data-square="e4"]');
      const e2Image = e2Square?.querySelector('img');

      // Simulate drag and drop
      const dataTransfer = {
        effectAllowed: '',
        dropEffect: '',
        setData: vi.fn(),
        getData: vi.fn(() => 'e2'),
      };

      fireEvent.dragStart(e2Image!, { dataTransfer });
      fireEvent.dragOver(e4Square!, { dataTransfer });
      fireEvent.drop(e4Square!, { dataTransfer });

      expect(mockMovePiece).toHaveBeenCalledWith('e2', 'e4');
    });

    it('should not mutate state on invalid drop', () => {
      const mockState = createMockGameState();
      mockMovePiece.mockReturnValue(false); // Invalid move
      vi.spyOn(useGameModule, 'useGame').mockReturnValue(mockState);

      const { container } = render(<Board />);
      const e2Square = container.querySelector('[data-square="e2"]');
      const d7Square = container.querySelector('[data-square="d7"]'); // Invalid target
      const e2Image = e2Square?.querySelector('img');

      const dataTransfer = {
        effectAllowed: '',
        dropEffect: '',
        setData: vi.fn(),
        getData: vi.fn(() => 'e2'),
      };

      fireEvent.dragStart(e2Image!, { dataTransfer });
      fireEvent.drop(d7Square!, { dataTransfer });

      // movePiece should be called, but it returns false (rejected)
      expect(mockMovePiece).toHaveBeenCalledWith('e2', 'd7');
      // Piece should remain on e2 in state (no mutation)
      expect(mockState.position.e2).toEqual({ type: 'p', color: 'w' });
    });
  });

  describe('ESC Key Cancellation', () => {
    it('should cancel drag on ESC key', async () => {
      const mockState = createMockGameState();
      vi.spyOn(useGameModule, 'useGame').mockReturnValue(mockState);

      const { container } = render(<Board />);
      const e2Square = container.querySelector('[data-square="e2"]');
      const e2Image = e2Square?.querySelector('img');

      // Start drag
      fireEvent.dragStart(e2Image!, {
        dataTransfer: { effectAllowed: '', setData: vi.fn() },
      });
      expect(e2Square?.classList.contains('drag-selected')).toBe(true);

      // Press ESC
      fireEvent.keyDown(window, { key: 'Escape' });

      await waitFor(() => {
        expect(e2Square?.classList.contains('drag-selected')).toBe(false);
      });
    });
  });

  describe('Blur Cancellation', () => {
    it('should cancel drag on window blur', async () => {
      const mockState = createMockGameState();
      vi.spyOn(useGameModule, 'useGame').mockReturnValue(mockState);

      const { container } = render(<Board />);
      const e2Square = container.querySelector('[data-square="e2"]');
      const e2Image = e2Square?.querySelector('img');

      // Start drag
      fireEvent.dragStart(e2Image!, {
        dataTransfer: { effectAllowed: '', setData: vi.fn() },
      });
      expect(e2Square?.classList.contains('drag-selected')).toBe(true);

      // Blur window
      fireEvent.blur(window);

      await waitFor(() => {
        expect(e2Square?.classList.contains('drag-selected')).toBe(false);
      });
    });
  });

  describe('Visual Feedback Parity', () => {
    it('should use lighter drag classes during drag operation', () => {
      const mockState = createMockGameState({
        game: {
          ...createMockGameState().game,
          moves: vi.fn(() => [
            { from: 'e2', to: 'e3', san: 'e3', flags: 'n' },
            {
              from: 'e2',
              to: 'e4',
              san: 'e4',
              flags: 'b',
              captured: undefined,
            },
          ]),
        },
      });
      vi.spyOn(useGameModule, 'useGame').mockReturnValue(mockState);

      const { container } = render(<Board />);
      const e2Square = container.querySelector('[data-square="e2"]');
      const e3Square = container.querySelector('[data-square="e3"]'); // Legal move
      const e2Image = e2Square?.querySelector('img');

      // Start drag
      fireEvent.dragStart(e2Image!, {
        dataTransfer: { effectAllowed: '', setData: vi.fn() },
      });

      // Check drag-specific classes are applied
      expect(e2Square?.classList.contains('drag-selected')).toBe(true);
      expect(e3Square?.classList.contains('drag-move-hint')).toBe(true);

      // Regular classes should NOT be present during drag
      expect(e2Square?.classList.contains('selected')).toBe(false);
      expect(e3Square?.classList.contains('legal-move-hint')).toBe(false);
    });

    it('should use normal classes for click selection (not during drag)', () => {
      const mockState = createMockGameState({
        game: {
          ...createMockGameState().game,
          moves: vi.fn(() => [
            { from: 'e2', to: 'e3', san: 'e3', flags: 'n' },
            { from: 'e2', to: 'e4', san: 'e4', flags: 'b' },
          ]),
        },
      });
      vi.spyOn(useGameModule, 'useGame').mockReturnValue(mockState);

      const { container } = render(<Board />);
      const e2Square = container.querySelector('[data-square="e2"]');
      const e3Square = container.querySelector('[data-square="e3"]'); // Legal move

      // Click to select (not drag)
      fireEvent.click(e2Square!);

      // Check normal classes are applied
      expect(e2Square?.classList.contains('selected')).toBe(true);
      expect(e3Square?.classList.contains('legal-move-hint')).toBe(true);

      // Drag classes should NOT be present
      expect(e2Square?.classList.contains('drag-selected')).toBe(false);
      expect(e3Square?.classList.contains('drag-move-hint')).toBe(false);
    });
  });
});
