import { defineStore, type Pinia } from 'pinia';
import { ref } from 'vue';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export type NotificationStore = ReturnType<typeof useNotificationStore>;

export interface Notification {
  id: number;
  message: string;
  type: NotificationType;
  timeout?: number;
}

export const useNotificationStore = (pinia?: Pinia) => {
  const useNotificationStore = defineStore('notification', () => {
    const notifications = ref<Notification[]>([]);
    let nextId = 0;

    const addNotification = (
      message: string,
      type: NotificationType = 'info',
      timeout: number = 5000
    ) => {
      const id = nextId++;
      const notification: Notification = {
        id,
        message,
        type,
        timeout,
      };

      notifications.value.push(notification);

      // Auto-remove notification after timeout if specified
      if (timeout > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, timeout);
      }

      return id;
    };

    const removeNotification = (id: number) => {
      const index = notifications.value.findIndex((n) => n.id === id);
      if (index !== -1) {
        notifications.value.splice(index, 1);
      }
    };

    // Helper methods for different notification types
    const success = (message: string, timeout?: number) =>
      addNotification(message, 'success', timeout);

    const error = (message: string, timeout?: number) => addNotification(message, 'error', timeout);

    const info = (message: string, timeout?: number) => addNotification(message, 'info', timeout);

    const warning = (message: string, timeout?: number) =>
      addNotification(message, 'warning', timeout);

    return {
      notifications,
      addNotification,
      removeNotification,
      success,
      error,
      info,
      warning,
    };
  });

  return useNotificationStore(pinia);
};
