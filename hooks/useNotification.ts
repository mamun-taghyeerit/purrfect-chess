'use client';

import { useState, useCallback, useRef } from 'react';

/**
 * Notification hook for user-facing messages
 *
 * Mirrors the legacy messageApi from src/ui.ts
 * Provides consistent notification patterns for error, success, and info messages
 */

export type NotificationType = 'error' | 'success' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration: number;
}

interface UseNotificationReturn {
  notifications: Notification[];
  showMessage: (type: NotificationType, message: string, duration?: number) => void;
  dismissNotification: (id: string) => void;
}

export function useNotification(): UseNotificationReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const dismissNotification = useCallback((id: string) => {
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showMessage = useCallback(
    (type: NotificationType, message: string, duration: number = 3000) => {
      if (!message) return;

      // Use crypto.randomUUID if available, fallback to timestamp + random
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `notification-${Date.now()}-${Math.random()}`;
      const notification: Notification = {
        id,
        type,
        message,
        duration,
      };

      setNotifications((prev) => [...prev, notification]);

      const timeout = setTimeout(() => {
        dismissNotification(id);
      }, duration);

      timeoutsRef.current.set(id, timeout);
    },
    [dismissNotification]
  );

  return {
    notifications,
    showMessage,
    dismissNotification,
  };
}
