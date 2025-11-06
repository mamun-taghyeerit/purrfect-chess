import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useEngine } from '@/hooks/useEngine';
import { useNotification } from '@/hooks/useNotification';
import { RootStoreProvider } from '@/stores/store-setup';

/**
 * Integration Tests: Error Handling Workflow
 *
 * Tests realistic user workflows involving errors to ensure proper
 * notification display and recovery
 * 
 * TODO: These tests need to be rewritten to work with MobX store
 * instead of the removed useGame hook. Error handling is now managed
 * through the store's actions.
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

  it.skip('should handle complete FEN import workflow with errors', async () => {
    // TODO: Rewrite to use MobX store instead of useGame hook

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

  it.skip('should allow recovery after FEN error', async () => {
    // TODO: Rewrite to use MobX store instead of useGame hook
  });
});
