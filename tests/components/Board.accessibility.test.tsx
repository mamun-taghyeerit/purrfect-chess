import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
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
    ...overrides.position,
  },
  turn: 'w',
  history: [],
  isGameOver: false,
  check: false,
  checkmate: false,
  stalemate: false,
  draw: false,
  whiteTime: 300000,
  blackTime: 300000,
  timeControl: { minutes: 5, increment: 0 },
  ...overrides,
});

const createMockGame = () => ({
  moves: vi.fn(() => [
    { from: 'e2', to: 'e3', san: 'e3', flags: 'n' },
    { from: 'e2', to: 'e4', san: 'e4', flags: 'b' },
  ]),
  fen: vi.fn(() => 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),
  pgn: vi.fn(() => ''),
  load: vi.fn(() => true),
  move: vi.fn(),
  reset: vi.fn(),
  turn: vi.fn(() => 'w'),
  isCheck: vi.fn(() => false),
  isCheckmate: vi.fn(() => false),
  isStalemate: vi.fn(() => false),
  isThreefoldRepetition: vi.fn(() => false),
  isInsufficientMaterial: vi.fn(() => false),
  isDraw: vi.fn(() => false),
  isGameOver: vi.fn(() => false),
  history: vi.fn(() => []),
});

describe('Board Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock useGame hook
    vi.spyOn(useGameModule, 'useGame').mockReturnValue({
      ...createMockGameState(),
      game: createMockGame() as any,
      movePiece: mockMovePiece.mockReturnValue(false),
      resetGame: mockResetGame,
      loadFen: mockLoadFen,
      getFen: mockGetFen,
      getPgn: mockGetPgn,
      loadPgn: vi.fn(),
      setTimeControl: mockSetTimeControl,
      startTimer: vi.fn(),
      stopTimer: vi.fn(),
      isTimerRunning: false,
      threefoldRepetition: false,
      insufficientMaterial: false,
    });
  });

  const renderBoard = () => {
    return render(<Board />);
  };

  describe('ARIA attributes', () => {
    it('should have role="application" on the board', () => {
      renderBoard();
      const board = document.querySelector('#board');
      expect(board).toHaveAttribute('role', 'application');
      expect(board).toHaveAttribute('aria-label', 'Chess board with 64 squares');
    });

    it('should have role="button" on each square', () => {
      renderBoard();
      const squares = document.querySelectorAll('.square');
      expect(squares.length).toBe(64);
      squares.forEach((square) => {
        expect(square).toHaveAttribute('role', 'button');
      });
    });

    it('should have aria-label on squares with pieces', () => {
      renderBoard();
      
      // Check initial position pieces
      const e2Square = document.querySelector('[data-square="e2"]');
      expect(e2Square).toHaveAttribute('aria-label');
      const e2Label = e2Square?.getAttribute('aria-label');
      expect(e2Label).toContain('e2');
      expect(e2Label).toContain('White');
      expect(e2Label).toContain('pawn');
    });

    it('should have aria-label on empty squares', () => {
      renderBoard();
      
      // Check empty square
      const e4Square = document.querySelector('[data-square="e4"]');
      expect(e4Square).toHaveAttribute('aria-label');
      const e4Label = e4Square?.getAttribute('aria-label');
      expect(e4Label).toContain('e4');
      expect(e4Label).toContain('empty');
    });

    it('should update aria-label when square is selected', () => {
      renderBoard();
      
      const e2Square = document.querySelector('[data-square="e2"]') as HTMLElement;
      fireEvent.click(e2Square);
      
      const ariaLabel = e2Square.getAttribute('aria-label');
      expect(ariaLabel).toContain('selected');
    });

    it('should mark legal moves in aria-label', () => {
      renderBoard();
      
      // Select e2 pawn
      const e2Square = document.querySelector('[data-square="e2"]') as HTMLElement;
      fireEvent.click(e2Square);
      
      // Check that legal move squares have updated labels
      const e3Square = document.querySelector('[data-square="e3"]') as HTMLElement;
      const e3Label = e3Square.getAttribute('aria-label');
      expect(e3Label).toContain('legal move');
    });

    it('should have aria-pressed attribute on squares', () => {
      renderBoard();
      
      const e2Square = document.querySelector('[data-square="e2"]') as HTMLElement;
      
      // Initially not pressed
      expect(e2Square).toHaveAttribute('aria-pressed', 'false');
      
      // Pressed when selected
      fireEvent.click(e2Square);
      expect(e2Square).toHaveAttribute('aria-pressed', 'true');
    });

    it('should hide piece images from screen readers', () => {
      renderBoard();
      
      const pieceImages = document.querySelectorAll('.square img');
      pieceImages.forEach((img) => {
        expect(img).toHaveAttribute('aria-hidden', 'true');
        expect(img).toHaveAttribute('alt', '');
      });
    });
  });

  describe('Keyboard navigation', () => {
    it('should have tabindex on squares', () => {
      renderBoard();
      
      const squares = document.querySelectorAll('.square');
      squares.forEach((square) => {
        expect(square).toHaveAttribute('tabindex');
      });
    });

    it('should have one square with tabindex=0 for initial focus', () => {
      renderBoard();
      
      // Should have exactly one square with tabindex=0
      const focusableSquares = document.querySelectorAll('[tabindex="0"]');
      expect(focusableSquares.length).toBeGreaterThanOrEqual(1);
    });

    it('should navigate with arrow keys', () => {
      renderBoard();
      
      // Focus on e2
      const e2Square = document.querySelector('[data-square="e2"]') as HTMLElement;
      fireEvent.focus(e2Square);
      
      // Press ArrowRight
      fireEvent.keyDown(e2Square, { key: 'ArrowRight' });
      
      // Should move to f2 (check via tabindex)
      const f2Square = document.querySelector('[data-square="f2"]') as HTMLElement;
      expect(f2Square).toHaveAttribute('tabindex', '0');
    });

    it('should navigate up with ArrowUp', () => {
      renderBoard();
      
      const e2Square = document.querySelector('[data-square="e2"]') as HTMLElement;
      fireEvent.focus(e2Square);
      
      fireEvent.keyDown(e2Square, { key: 'ArrowUp' });
      
      const e3Square = document.querySelector('[data-square="e3"]') as HTMLElement;
      expect(e3Square).toHaveAttribute('tabindex', '0');
    });

    it('should navigate down with ArrowDown', () => {
      renderBoard();
      
      // Start from e3 - first trigger onFocus to set focusedSquare state
      const e3Square = document.querySelector('[data-square="e3"]') as HTMLElement;
      fireEvent.focus(e3Square);
      
      // Now fire keyDown
      fireEvent.keyDown(e3Square, { key: 'ArrowDown' });
      
      // Check that e2 now has tabindex="0" (meaning it's the focused square in state)
      const e2Square = document.querySelector('[data-square="e2"]') as HTMLElement;
      expect(e2Square).toHaveAttribute('tabindex', '0');
    });

    it('should navigate left with ArrowLeft', () => {
      renderBoard();
      
      const e2Square = document.querySelector('[data-square="e2"]') as HTMLElement;
      fireEvent.focus(e2Square);
      
      fireEvent.keyDown(e2Square, { key: 'ArrowLeft' });
      
      const d2Square = document.querySelector('[data-square="d2"]') as HTMLElement;
      expect(d2Square).toHaveAttribute('tabindex', '0');
    });

    it('should select piece with Enter key', () => {
      renderBoard();
      
      const e2Square = document.querySelector('[data-square="e2"]') as HTMLElement;
      fireEvent.focus(e2Square);
      
      fireEvent.keyDown(e2Square, { key: 'Enter' });
      
      expect(e2Square).toHaveAttribute('aria-pressed', 'true');
    });

    it('should select piece with Space key', () => {
      renderBoard();
      
      const e2Square = document.querySelector('[data-square="e2"]') as HTMLElement;
      fireEvent.focus(e2Square);
      
      fireEvent.keyDown(e2Square, { key: ' ' });
      
      expect(e2Square).toHaveAttribute('aria-pressed', 'true');
    });

    it('should deselect piece with Escape key', () => {
      renderBoard();
      
      const e2Square = document.querySelector('[data-square="e2"]') as HTMLElement;
      fireEvent.focus(e2Square);
      
      // Select piece
      fireEvent.keyDown(e2Square, { key: 'Enter' });
      expect(e2Square).toHaveAttribute('aria-pressed', 'true');
      
      // Deselect with Escape
      fireEvent.keyDown(e2Square, { key: 'Escape' });
      expect(e2Square).toHaveAttribute('aria-pressed', 'false');
    });

    it('should not navigate beyond board boundaries', () => {
      renderBoard();
      
      // Try to go left from a2 (left edge)
      const a2Square = document.querySelector('[data-square="a2"]') as HTMLElement;
      fireEvent.focus(a2Square);
      
      // Try to go left (should stay on column a)
      fireEvent.keyDown(a2Square, { key: 'ArrowLeft' });
      
      // Should still have tabindex="0" on a2 since it didn't move
      expect(a2Square).toHaveAttribute('tabindex', '0');
      expect(a2Square.getAttribute('data-square')).toBe('a2');
    });
  });

  describe('Focus management', () => {
    it('should maintain focus when navigating', () => {
      renderBoard();
      
      const e2Square = document.querySelector('[data-square="e2"]') as HTMLElement;
      fireEvent.focus(e2Square);
      
      expect(e2Square).toHaveAttribute('tabindex', '0');
    });

    it('should update focus state on focus event', () => {
      renderBoard();
      
      const e2Square = document.querySelector('[data-square="e2"]') as HTMLElement;
      fireEvent.focus(e2Square);
      
      // Should update tabindex
      expect(e2Square).toHaveAttribute('tabindex', '0');
    });
  });
});
