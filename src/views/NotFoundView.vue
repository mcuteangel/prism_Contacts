<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full text-center">
      <div class="flex justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-24 w-24 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1"
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h1 class="mt-6 text-4xl font-bold text-gray-900">404</h1>
      <h2 class="mt-2 text-2xl font-semibold text-gray-800">صفحه مورد نظر یافت نشد</h2>
      <p class="mt-4 text-gray-600">
        متأسفانه صفحه‌ای که به دنبال آن هستید وجود ندارد یا حذف شده است.
      </p>
      <div class="mt-8">
        <router-link
          to="/"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          بازگشت به صفحه اصلی
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// تنظیم عنوان صفحه
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

onMounted(() => {
  document.title = 'صفحه پیدا نشد';
});
</script>

<style scoped>
/* استایل‌های سفارشی در صورت نیاز */
</style>
