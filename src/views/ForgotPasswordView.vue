<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">بازیابی رمز عبور</h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          لطفاً آدرس ایمیل خود را وارد کنید تا لینک بازیابی رمز عبور برای شما ارسال شود.
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="email-address" class="sr-only">آدرس ایمیل</label>
            <input
              id="email-address"
              v-model="email"
              name="email"
              type="email"
              autocomplete="email"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="آدرس ایمیل"
              :disabled="isLoading"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            :disabled="isLoading"
            :class="{ 'opacity-50 cursor-not-allowed': isLoading }"
          >
            <span v-if="!isLoading">ارسال لینک بازیابی</span>
            <span v-else>در حال ارسال...</span>
          </button>
        </div>
      </form>

      <div class="text-center">
        <router-link to="/auth" class="font-medium text-indigo-600 hover:text-indigo-500 text-sm">
          بازگشت به صفحه ورود
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';

const router = useRouter();
const authStore = useAuthStore();
const notification = useNotificationStore();

const email = ref('');
const isLoading = ref(false);

const handleSubmit = async () => {
  if (!email.value) {
    notification.error('لطفاً آدرس ایمیل خود را وارد کنید.');
    return;
  }

  try {
    isLoading.value = true;

    await authStore.resetPassword(email.value);

    notification.success('لینک بازیابی رمز عبور به ایمیل شما ارسال شد.');

    // پاک کردن فرم
    email.value = '';

    // هدایت به صفحه ورود پس از 3 ثانیه
    setTimeout(() => {
      router.push('/auth');
    }, 3000);
  } catch (error: any) {
    console.error('Forgot password error:', error);
    notification.error(error.message || 'خطایی رخ داده است. لطفاً دوباره تلاش کنید.');
  } finally {
    isLoading.value = false;
  }
};
</script>
