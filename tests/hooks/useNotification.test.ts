import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useNotification } from '@/hooks/useNotification';

/**
 * Error Handling Tests: Notification System
 *
 * Tests the notification system for proper error display and management
 */

describe('useNotification hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty notifications', () => {
    const { result } = renderHook(() => useNotification());
    expect(result.current.notifications).toEqual([]);
  });

  it('should show error message', () => {
    const { result } = renderHook(() => useNotification());

    act(() => {
      result.current.showMessage('error', 'Test error message');
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].type).toBe('error');
    expect(result.current.notifications[0].message).toBe('Test error message');
  });

  it('should show success message', () => {
    const { result } = renderHook(() => useNotification());

    act(() => {
      result.current.showMessage('success', 'Test success message');
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].type).toBe('success');
    expect(result.current.notifications[0].message).toBe(
      'Test success message'
    );
  });

  it('should show info message', () => {
    const { result } = renderHook(() => useNotification());

    act(() => {
      result.current.showMessage('info', 'Test info message');
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].type).toBe('info');
    expect(result.current.notifications[0].message).toBe('Test info message');
  });

  it('should dismiss notification', () => {
    const { result } = renderHook(() => useNotification());

    act(() => {
      result.current.showMessage('error', 'Test error');
    });

    const notificationId = result.current.notifications[0].id;

    act(() => {
      result.current.dismissNotification(notificationId);
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('should auto-dismiss notification after duration', async () => {
    const { result } = renderHook(() => useNotification());

    act(() => {
      result.current.showMessage('error', 'Test error', 100); // 100ms duration
    });

    expect(result.current.notifications).toHaveLength(1);

    await waitFor(
      () => {
        expect(result.current.notifications).toHaveLength(0);
      },
      { timeout: 200 }
    );
  });

  it('should handle multiple notifications', () => {
    const { result } = renderHook(() => useNotification());

    act(() => {
      result.current.showMessage('error', 'Error 1');
      result.current.showMessage('success', 'Success 1');
      result.current.showMessage('info', 'Info 1');
    });

    expect(result.current.notifications).toHaveLength(3);
    expect(result.current.notifications[0].message).toBe('Error 1');
    expect(result.current.notifications[1].message).toBe('Success 1');
    expect(result.current.notifications[2].message).toBe('Info 1');
  });

  it('should not show message if message is empty', () => {
    const { result } = renderHook(() => useNotification());

    act(() => {
      result.current.showMessage('error', '');
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('should use default duration of 3000ms', () => {
    const { result } = renderHook(() => useNotification());

    act(() => {
      result.current.showMessage('error', 'Test');
    });

    expect(result.current.notifications[0].duration).toBe(3000);
  });
});
