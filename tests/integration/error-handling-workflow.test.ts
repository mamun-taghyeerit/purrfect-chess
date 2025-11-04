import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGame } from '@/hooks/useGame';
import { useEngine } from '@/hooks/useEngine';
import { useNotification } from '@/hooks/useNotification';

/**
 * Integration Tests: Error Handling Workflow
 *
 * Tests realistic user workflows involving errors to ensure proper
 * notification display and recovery
 */

// Mock Web Worker
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((error: ErrorEvent) => void) | null = null;
  postMessage(message: any) {
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

describe('Integration: Error Handling Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle complete FEN import workflow with errors', async () => {
    const { result: notificationResult } = renderHook(() =>
      useNotification()
    );

    const { result: gameResult } = renderHook(() =>
      useGame({
        onError: (error) => {
          notificationResult.current.showMessage('error', error);
        },
      })
    );

    // Try to load invalid FEN
    act(() => {
      gameResult.current.loadFen('invalid fen');
    });

    // Should show error notification
    expect(notificationResult.current.notifications).toHaveLength(1);
    expect(notificationResult.current.notifications[0].type).toBe('error');
    expect(notificationResult.current.notifications[0].message).toBe(
      'Invalid FEN string.'
    );
  });

  it('should allow recovery after FEN error', async () => {
    const { result: notificationResult } = renderHook(() =>
      useNotification()
    );

    const { result: gameResult } = renderHook(() =>
      useGame({
        onError: (error) => {
          notificationResult.current.showMessage('error', error);
        },
      })
    );

    // Load invalid FEN
    let loadResult: boolean;
    act(() => {
      loadResult = gameResult.current.loadFen('bad');
    });
    expect(loadResult!).toBe(false);

    // Should be able to load valid FEN after error
    act(() => {
      loadResult = gameResult.current.loadFen(
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
      );
    });
    expect(loadResult!).toBe(true);
  });
});
