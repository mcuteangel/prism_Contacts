<template>
  <div class="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 w-80 max-w-[90vw]">
    <TransitionGroup name="notification" tag="div">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="p-4 rounded-lg shadow-lg border border-opacity-20 transition-all duration-300"
        :class="{
          'bg-green-100 border-green-500 text-green-800': notification.type === 'success',
          'bg-red-100 border-red-500 text-red-800': notification.type === 'error',
          'bg-blue-100 border-blue-500 text-blue-800': notification.type === 'info',
          'bg-yellow-100 border-yellow-500 text-yellow-800': notification.type === 'warning',
        }"
        role="alert"
      >
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <p class="text-sm font-medium">
              {{ notification.message }}
            </p>
          </div>
          <button
            @click="removeNotification(notification.id)"
            class="ml-2 text-current opacity-50 hover:opacity-100 focus:outline-none"
            aria-label="Close notification"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useNotificationStore } from '@/stores/notificationStore';
import { storeToRefs } from 'pinia';

const notificationStore = useNotificationStore();
const { notifications } = storeToRefs(notificationStore);
const { removeNotification } = notificationStore;
</script>

<style scoped>
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from,
.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-move {
  transition: transform 0.3s ease;
}
</style>
