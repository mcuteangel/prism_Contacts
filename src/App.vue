<script setup lang="ts">
import { onUnmounted, watch } from 'vue';
import { useAuthStore } from './stores/authStore';
import { syncService } from './services/SyncService';
import MainLayout from './layouts/MainLayout.vue';
import NotificationCenter from '@/components/ui/NotificationCenter.vue';

const authStore = useAuthStore();

// 🚀 تغییر: فراخوانی listenForAuthChanges به main.ts منتقل شد
// تا در اولین فرصت ممکن اجرا شود

// نظارت بر تغییرات وضعیت احراز هویت
const unwatch = watch(
  () => authStore.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated) {
      // کمی تاخیر برای اطمینان از آماده بودن همه چیز
      setTimeout(() => {
        console.log('کاربر احراز هویت شده، سرویس همگام‌سازی فعال می‌شود.');
        syncService.start();
      }, 500);
    } else {
      syncService.stop();
      console.log('کاربر خارج شد، سرویس همگام‌سازی متوقف می‌شود.');
    }
  },
  { immediate: true }
);

// پاک‌سازی هنگام از بین رفتن کامپوننت
onUnmounted(() => {
  // توقف سرویس همگام‌سازی
  syncService.stop();

  // حذف واتچر
  unwatch();
});
</script>

<template>
  <div id="app">
    <!-- نمایش صفحه لودینگ تا زمانی که وضعیت احراز هویت مشخص نشده است -->
    <div
      v-if="!authStore.isAuthReady"
      class="fixed inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 z-50"
    >
      <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      <p class="mt-4 text-lg text-gray-700 dark:text-gray-300">در حال بارگذاری برنامه...</p>
    </div>

    <!-- محتوای اصلی برنامه پس از آماده شدن وضعیت احراز هویت -->
    <template v-else>
      <MainLayout />
      <NotificationCenter />
    </template>
  </div>
</template>

<style>
@import './style.css';

:root {
  font-family: Vazirmatn, system-ui, sans-serif;
  direction: rtl;
}

body {
  margin: 0;
  min-height: 100vh;
}
</style>
