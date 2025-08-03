import { setActivePinia, createPinia } from 'pinia';
import { useNotificationStore } from '../notificationStore';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Notification Store', () => {
  beforeEach(() => {
    // creates a fresh pinia and makes it active
    setActivePinia(createPinia());
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it('should add a notification', () => {
    const store = useNotificationStore();

    // Initial state should be empty
    expect(store.notifications).toHaveLength(0);

    // Add a notification
    store.addNotification('Test message', 'info');

    // Should have one notification
    expect(store.notifications).toHaveLength(1);
    expect(store.notifications[0].message).toBe('Test message');
    expect(store.notifications[0].type).toBe('info');
  });

  it('should remove a notification', () => {
    const store = useNotificationStore();

    // Add a notification
    const id = store.addNotification('Test message');

    // Should have one notification
    expect(store.notifications).toHaveLength(1);

    // Remove the notification
    store.removeNotification(id);

    // Should be empty now
    expect(store.notifications).toHaveLength(0);
  });

  it('should auto-remove notification after timeout', async () => {
    vi.useFakeTimers();

    const store = useNotificationStore();

    // Add a notification with a short timeout
    store.addNotification('Test', 'info', 1000);

    // Should have one notification
    expect(store.notifications).toHaveLength(1);

    // Fast forward time
    await vi.advanceTimersByTimeAsync(1000);

    // Should be removed now
    expect(store.notifications).toHaveLength(0);

    vi.useRealTimers();
  });

  it('should provide helper methods for different notification types', () => {
    const store = useNotificationStore();

    // Test success helper
    store.success('Success message');
    expect(store.notifications[0].type).toBe('success');

    // Test error helper
    store.error('Error message');
    expect(store.notifications[1].type).toBe('error');

    // Test info helper
    store.info('Info message');
    expect(store.notifications[2].type).toBe('info');

    // Test warning helper
    store.warning('Warning message');
    expect(store.notifications[3].type).toBe('warning');
  });
});
