'use client';

import React from 'react';
import type { Notification, NotificationType } from '@/hooks/useNotification';

/**
 * NotificationContainer Component
 *
 * Displays toast-style notifications that match the legacy app's message box
 * Positioned at the top-center of the screen with auto-dismiss
 */

interface NotificationContainerProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

const getNotificationStyles = (type: NotificationType) => {
  switch (type) {
    case 'error':
      return {
        background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
        color: '#fff',
        borderColor: '#c0392b',
      };
    case 'success':
      return {
        background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
        color: '#fff',
        borderColor: '#229954',
      };
    case 'info':
      return {
        background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
        color: '#fff',
        borderColor: '#2980b9',
      };
    default:
      return {
        background: '#333',
        color: '#fff',
        borderColor: '#555',
      };
  }
};

export default function NotificationContainer({
  notifications,
  onDismiss,
}: NotificationContainerProps) {
  if (notifications.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '500px',
        width: '90%',
      }}
    >
      {notifications.map((notification) => {
        const styles = getNotificationStyles(notification.type);
        return (
          <div
            key={notification.id}
            style={{
              ...styles,
              padding: '12px 16px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '14px',
              fontWeight: '500',
              animation: 'slideDown 0.3s ease-out',
              border: `2px solid ${styles.borderColor}`,
            }}
          >
            <span>{notification.message}</span>
            <button
              onClick={() => onDismiss(notification.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: styles.color,
                fontSize: '18px',
                cursor: 'pointer',
                marginLeft: '12px',
                padding: '0 4px',
                opacity: 0.8,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        );
      })}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
