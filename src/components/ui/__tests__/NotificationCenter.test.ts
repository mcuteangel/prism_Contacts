import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useNotificationStore } from '@/stores/notificationStore';
import NotificationCenter from '../NotificationCenter.vue';

describe('NotificationCenter', () => {
  let wrapper: any;
  let store: ReturnType<typeof useNotificationStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useNotificationStore();

    // Mount the component
    wrapper = mount(NotificationCenter, {
      global: {
        plugins: [createPinia()],
      },
    });
  });

  it('renders no notifications when store is empty', () => {
    expect(wrapper.findAll('.notification')).toHaveLength(0);
  });

  it('displays notifications from the store', async () => {
    // Add a notification to the store
    store.addNotification('Test notification', 'info');

    await wrapper.vm.$nextTick();

    // Should display the notification
    const notifications = wrapper.findAll('.notification');
    expect(notifications).toHaveLength(1);
    expect(notifications[0].text()).toContain('Test notification');
  });

  it('applies correct CSS classes based on notification type', async () => {
    // Add different types of notifications
    store.success('Success message');
    store.error('Error message');

    await wrapper.vm.$nextTick();

    const notifications = wrapper.findAll('.notification');

    // Check success notification classes
    expect(notifications[0].classes()).toContain('bg-green-100');
    expect(notifications[0].classes()).toContain('text-green-800');

    // Check error notification classes
    expect(notifications[1].classes()).toContain('bg-red-100');
    expect(notifications[1].classes()).toContain('text-red-800');
  });

  it('allows closing a notification', async () => {
    // Add a notification
    const id = store.addNotification('Test message');

    await wrapper.vm.$nextTick();

    // Find and click the close button
    const closeButton = wrapper.find('button');
    await closeButton.trigger('click');

    // Notification should be removed from the store
    expect(store.notifications).toHaveLength(0);
  });

  it('appears in the bottom-right corner', () => {
    // Check the main container classes
    const container = wrapper.find('div');
    expect(container.classes()).toContain('fixed');
    expect(container.classes()).toContain('bottom-4');
    expect(container.classes()).toContain('right-4');
    expect(container.classes()).toContain('z-50');
  });
});
