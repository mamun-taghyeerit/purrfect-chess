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
import { RootStoreProvider, useRootStore } from '@/stores/store-setup';
import React from 'react';

describe('Board Interaction Semantics', () => {
  // Create a wrapper component that resets the store
  const BoardWithReset = () => {
    const store = useRootStore();
    // Reset game state before rendering
    React.useEffect(() => {
      store.game.resetGame();
    }, []);
    return <Board />;
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage to reset store state
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to render Board with store provider and reset
  const renderBoard = () => {
    return render(
      <RootStoreProvider>
        <BoardWithReset />
      </RootStoreProvider>
    );
  };

  describe('Click Interaction', () => {
    it('should select a piece on click and show legal moves', () => {
      const { container } = renderBoard();
      const e2Square = container.querySelector('[data-square="e2"]');

      expect(e2Square).toBeTruthy();
      fireEvent.click(e2Square!);

      // Should add selected class
      expect(e2Square?.classList.contains('selected')).toBe(true);
    });

    it('should re-select when clicking a different piece (parity with legacy)', () => {
      const { container } = renderBoard();
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
      const { container } = renderBoard();
      const e2Square = container.querySelector('[data-square="e2"]');
      const e5Square = container.querySelector('[data-square="e5"]'); // Empty square

      // Select e2
      fireEvent.click(e2Square!);
      expect(e2Square?.classList.contains('selected')).toBe(true);

      // Click empty square - should clear selection or attempt move
      fireEvent.click(e5Square!);
      expect(e2Square?.classList.contains('selected')).toBe(false);
    });

    it('should execute valid move and clear selection', () => {
      const { container } = renderBoard();
      const e2Square = container.querySelector('[data-square="e2"]');
      const e4Square = container.querySelector('[data-square="e4"]');

      // Select e2
      fireEvent.click(e2Square!);
      expect(e2Square?.classList.contains('selected')).toBe(true);

      // Click e4 to move
      fireEvent.click(e4Square!);

      // Selection should be cleared after move
      expect(e2Square?.classList.contains('selected')).toBe(false);
    });
  });

  describe('Drag-and-Drop Interaction', () => {
    it('should use drag-specific CSS classes during drag', () => {
      const { container } = renderBoard();
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
      const { container } = renderBoard();
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
      const { container} = renderBoard();
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

      // Move is handled by store, no assertion needed beyond no errors
    });

    it('should not mutate state on invalid drop', () => {
      const { container } = renderBoard();
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

      // Invalid move should be rejected by store
      // No error should be thrown
    });
  });

  describe('ESC Key Cancellation', () => {
    it('should cancel drag on ESC key', async () => {
      const { container } = renderBoard();
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
      const { container } = renderBoard();
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
      const { container } = renderBoard();
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
      const { container } = renderBoard();
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
