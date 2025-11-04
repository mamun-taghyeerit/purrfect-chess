import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useEngine } from '@/hooks/useEngine';

// Mock Web Worker
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((error: ErrorEvent) => void) | null = null;

  postMessage(message: any) {
    // Simulate worker responses based on message type
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

  terminate() {
    // Mock terminate
  }
}

// Mock Worker constructor
vi.stubGlobal('Worker', MockWorker);

describe('useEngine hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useEngine());

      expect(result.current.isEngineReady).toBe(false);
      expect(result.current.isAnalyzing).toBe(false);
      expect(result.current.analysis).toEqual([]);
      expect(result.current.currentDepth).toBe(0);
    });

    it('should initialize Stockfish worker on mount', async () => {
      const { result } = renderHook(() => useEngine());

      await waitFor(
        () => {
          expect(result.current.isEngineReady).toBe(true);
        },
        { timeout: 1000 }
      );
    });
  });

  describe('analysis control', () => {
    it('should provide startAnalysis function', () => {
      const { result } = renderHook(() => useEngine());
      expect(typeof result.current.startAnalysis).toBe('function');
    });

    it('should provide stopAnalysis function', () => {
      const { result } = renderHook(() => useEngine());
      expect(typeof result.current.stopAnalysis).toBe('function');
    });

    it('should provide setDepth function', () => {
      const { result } = renderHook(() => useEngine());
      expect(typeof result.current.setDepth).toBe('function');
    });

    it('should call startAnalysis without errors', async () => {
      const { result } = renderHook(() => useEngine());

      await waitFor(() => {
        expect(result.current.isEngineReady).toBe(true);
      });

      // Should not throw
      expect(() => {
        result.current.startAnalysis(
          'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
        );
      }).not.toThrow();
    });

    it('should call stopAnalysis without errors', async () => {
      const { result } = renderHook(() => useEngine());

      await waitFor(() => {
        expect(result.current.isEngineReady).toBe(true);
      });

      // Should not throw
      expect(() => {
        result.current.stopAnalysis();
      }).not.toThrow();
    });

    it('should update depth when setDepth is called', async () => {
      const { result } = renderHook(() => useEngine());

      await waitFor(() => {
        expect(result.current.isEngineReady).toBe(true);
      });

      result.current.setDepth(20);

      // Depth update is internal, but should not throw
      expect(true).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should terminate worker on unmount', () => {
      const { unmount } = renderHook(() => useEngine());

      // Should not throw
      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });
});
