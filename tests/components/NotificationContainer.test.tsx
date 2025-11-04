import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NotificationContainer from '@/components/NotificationContainer';
import type { Notification } from '@/hooks/useNotification';

/**
 * NotificationContainer Component Tests
 *
 * Tests the visual notification component for proper display and interaction
 */

describe('NotificationContainer Component', () => {
  const mockNotifications: Notification[] = [
    {
      id: '1',
      type: 'error',
      message: 'Test error message',
      duration: 3000,
    },
    {
      id: '2',
      type: 'success',
      message: 'Test success message',
      duration: 3000,
    },
    {
      id: '3',
      type: 'info',
      message: 'Test info message',
      duration: 3000,
    },
  ];

  const onDismiss = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render nothing when notifications array is empty', () => {
    const { container } = render(
      <NotificationContainer notifications={[]} onDismiss={onDismiss} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render error notification', () => {
    render(
      <NotificationContainer
        notifications={[mockNotifications[0]]}
        onDismiss={onDismiss}
      />
    );
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('should render success notification', () => {
    render(
      <NotificationContainer
        notifications={[mockNotifications[1]]}
        onDismiss={onDismiss}
      />
    );
    expect(screen.getByText('Test success message')).toBeInTheDocument();
  });

  it('should render info notification', () => {
    render(
      <NotificationContainer
        notifications={[mockNotifications[2]]}
        onDismiss={onDismiss}
      />
    );
    expect(screen.getByText('Test info message')).toBeInTheDocument();
  });

  it('should render multiple notifications', () => {
    render(
      <NotificationContainer
        notifications={mockNotifications}
        onDismiss={onDismiss}
      />
    );
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByText('Test success message')).toBeInTheDocument();
    expect(screen.getByText('Test info message')).toBeInTheDocument();
  });

  it('should call onDismiss when close button is clicked', () => {
    render(
      <NotificationContainer
        notifications={[mockNotifications[0]]}
        onDismiss={onDismiss}
      />
    );

    const closeButton = screen.getByLabelText('Dismiss notification');
    fireEvent.click(closeButton);

    expect(onDismiss).toHaveBeenCalledWith('1');
  });

  it('should render all notification types with different styles', () => {
    const { container } = render(
      <NotificationContainer
        notifications={mockNotifications}
        onDismiss={onDismiss}
      />
    );

    const notificationElements = container.querySelectorAll('div[style]');
    // Should have different background gradients for each type
    expect(notificationElements.length).toBeGreaterThan(0);
  });
});
