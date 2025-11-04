import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGame } from '@/hooks/useGame';
import { useEngine } from '@/hooks/useEngine';

/**
 * Error Handling + Edge Cases Parity Tests
 *
 * Purpose: Validate that error surfaces and recovery paths behave identically
 * to the legacy app, with matching notification patterns and no silent failures.
 *
 * Scenarios tested:
 * - FEN/PGN import errors (malformed, empty)
 * - Engine worker errors (initialization, unavailable)
 * - Mid-analysis resets
 * - Invalid move attempts
 */

// Mock Web Worker
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((error: ErrorEvent) => void) | null = null;
  postMessage(message: any) {
    // Simulate worker responses
    if (message.type === 'init') {
      setTimeout(() => {
        if (this.onmessage) {
          this.onmessage(
            new MessageEvent('message', { data: { type: 'ready' } })
          );
        }
      }, 10);
    }
  }
  terminate() {}
}

vi.stubGlobal('Worker', MockWorker);

describe('Phase X Parity: Error Handling + Edge Cases', () => {
  describe('FEN Import Errors', () => {
    it('should call onError for invalid FEN', () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useGame({ onError }));

      act(() => {
        result.current.loadFen('invalid fen string');
      });

      expect(onError).toHaveBeenCalledWith('Invalid FEN string.');
    });

    it('should call onError for empty FEN', () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useGame({ onError }));

      act(() => {
        result.current.loadFen('');
      });

      expect(onError).toHaveBeenCalledWith('Enter a FEN string to load.');
    });

    it('should call onError for whitespace-only FEN', () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useGame({ onError }));

      act(() => {
        result.current.loadFen('   ');
      });

      expect(onError).toHaveBeenCalledWith('Enter a FEN string to load.');
    });

    it('should return false for invalid FEN', () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useGame({ onError }));

      let loadResult: boolean = true;
      act(() => {
        loadResult = result.current.loadFen('invalid');
      });

      expect(loadResult).toBe(false);
    });

    it('should return true for valid FEN', () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useGame({ onError }));

      let loadResult: boolean = false;
      act(() => {
        loadResult = result.current.loadFen(
          'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
        );
      });

      expect(loadResult).toBe(true);
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('PGN Import Errors', () => {
    it('should call onError for invalid PGN', () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useGame({ onError }));

      act(() => {
        result.current.loadPgn('invalid pgn string 1. e4 garbage');
      });

      expect(onError).toHaveBeenCalledWith('Invalid PGN data.');
    });

    it('should call onError for empty PGN', () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useGame({ onError }));

      act(() => {
        result.current.loadPgn('');
      });

      expect(onError).toHaveBeenCalledWith('Enter a PGN string to load.');
    });

    it('should return false for invalid PGN', () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useGame({ onError }));

      let loadResult: boolean = true;
      act(() => {
        loadResult = result.current.loadPgn('not a pgn');
      });

      expect(loadResult).toBe(false);
    });

    it('should return true for valid PGN', () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useGame({ onError }));

      let loadResult: boolean = false;
      act(() => {
        loadResult = result.current.loadPgn('1. e4 e5');
      });

      expect(loadResult).toBe(true);
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('Invalid Move Errors', () => {
    it('should call onError for illegal move', () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useGame({ onError }));

      act(() => {
        // Try to move pawn from e2 to e5 (illegal)
        result.current.movePiece('e2', 'e5');
      });

      expect(onError).toHaveBeenCalledWith('Illegal move.');
    });

    it('should return false for illegal move', () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useGame({ onError }));

      let moveResult: boolean = true;
      act(() => {
        moveResult = result.current.movePiece('e2', 'e5');
      });

      expect(moveResult).toBe(false);
    });

    it('should return true for legal move', () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useGame({ onError }));

      let moveResult: boolean = false;
      act(() => {
        moveResult = result.current.movePiece('e2', 'e4');
      });

      expect(moveResult).toBe(true);
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('Engine Errors', () => {
    it('should call onError when starting analysis with engine not ready', async () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useEngine({ onError }));

      // Try to start analysis before engine is ready
      act(() => {
        result.current.startAnalysis(
          'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
        );
      });

      expect(onError).toHaveBeenCalledWith('Engine is not ready yet.');
    });

    it('should not call onError when starting analysis with engine ready', async () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useEngine({ onError }));

      // Wait for engine to be ready
      await waitFor(() => {
        expect(result.current.isEngineReady).toBe(true);
      });

      act(() => {
        result.current.startAnalysis(
          'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
        );
      });

      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('No Silent Failures', () => {
    it('should never silently fail on FEN load errors', () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useGame({ onError }));

      act(() => {
        result.current.loadFen('bad fen');
      });

      // Must either call onError or return false (or both)
      expect(onError).toHaveBeenCalled();
    });

    it('should never silently fail on PGN load errors', () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useGame({ onError }));

      act(() => {
        result.current.loadPgn('bad pgn');
      });

      // Must either call onError or return false (or both)
      expect(onError).toHaveBeenCalled();
    });

    it('should never silently fail on illegal moves', () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useGame({ onError }));

      act(() => {
        result.current.movePiece('e2', 'e5');
      });

      // Must either call onError or return false (or both)
      expect(onError).toHaveBeenCalled();
    });
  });

  describe('Mid-Analysis State Management', () => {
    it('should stop analysis cleanly', async () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useEngine({ onError }));

      // Wait for engine to be ready
      await waitFor(() => {
        expect(result.current.isEngineReady).toBe(true);
      });

      // Start analysis
      act(() => {
        result.current.startAnalysis(
          'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
        );
      });

      // Stop analysis
      act(() => {
        result.current.stopAnalysis();
      });

      // Should complete without errors
      expect(onError).not.toHaveBeenCalled();
    });

    it('should allow reset during analysis', async () => {
      const onGameError = vi.fn();
      const onEngineError = vi.fn();

      const { result: gameResult } = renderHook(() =>
        useGame({ onError: onGameError })
      );
      const { result: engineResult } = renderHook(() =>
        useEngine({ onError: onEngineError })
      );

      // Wait for engine to be ready
      await waitFor(() => {
        expect(engineResult.current.isEngineReady).toBe(true);
      });

      // Make a move
      act(() => {
        gameResult.current.movePiece('e2', 'e4');
      });

      // Start analysis
      act(() => {
        engineResult.current.startAnalysis(gameResult.current.getFen());
      });

      // Reset game during analysis
      act(() => {
        gameResult.current.resetGame();
      });

      // Should complete without errors
      expect(onGameError).not.toHaveBeenCalled();
      expect(onEngineError).not.toHaveBeenCalled();
    });
  });
});
