<template>
  <div class="glass p-6 max-w-md mx-auto mt-10 rounded-lg shadow-lg">
    <h2 class="text-2xl font-bold mb-6 text-center">
      {{ isRegisterMode ? 'ثبت‌نام حساب جدید' : 'ورود به حساب کاربری' }}
    </h2>

    <form v-if="!isRegisterMode" @submit.prevent="handleLogin" class="flex flex-col gap-4">
      <div class="form-control">
        <label class="label">
          <span class="label-text">ایمیل</span>
        </label>
        <input
          v-model="loginForm.email"
          type="email"
          placeholder="your@email.com"
          class="input input-bordered w-full"
          required
        />
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text">رمز عبور</span>
        </label>
        <input
          v-model="loginForm.password"
          type="password"
          placeholder="••••••••"
          class="input input-bordered w-full"
          required
        />
      </div>

      <button type="submit" class="btn btn-primary w-full mt-2" :disabled="authStore.isLoading">
        <span v-if="authStore.isLoading" class="loading loading-spinner loading-sm"></span>
        {{ authStore.isLoading ? 'در حال ورود...' : 'ورود' }}
      </button>

      <div class="text-sm text-center mt-4">
        حساب ندارید؟
        <button
          type="button"
          class="text-blue-600 hover:underline mr-1"
          @click="isRegisterMode = true"
        >
          ثبت‌نام کنید
        </button>
      </div>

      <!-- Resend verification link button -->
      <div
        v-if="showResendVerification"
        class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center"
      >
        <p class="text-sm text-yellow-700 mb-2">ایمیل تایید را دریافت نکرده‌اید؟</p>
        <button
          type="button"
          class="btn btn-outline btn-sm text-yellow-700 border-yellow-300 hover:bg-yellow-50"
          @click="handleResendVerification"
          :disabled="authStore.isLoading"
        >
          <span v-if="authStore.isLoading" class="loading loading-spinner loading-xs"></span>
          {{ authStore.isLoading ? 'در حال ارسال...' : 'ارسال مجدد لینک تایید' }}
        </button>
      </div>
    </form>

    <form v-else @submit.prevent="handleRegister" class="flex flex-col gap-4">
      <div class="form-control">
        <label class="label">
          <span class="label-text">نام (اختیاری)</span>
        </label>
        <input
          v-model="registerForm.name"
          type="text"
          placeholder="نام شما"
          class="input input-bordered w-full"
        />
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text">ایمیل</span>
        </label>
        <input
          v-model="registerForm.email"
          type="email"
          placeholder="your@email.com"
          class="input input-bordered w-full"
          required
        />
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text">رمز عبور</span>
        </label>
        <input
          v-model="registerForm.password"
          type="password"
          placeholder="حداقل ۶ کاراکتر"
          class="input input-bordered w-full"
          required
          minlength="6"
        />
      </div>
      <button type="submit" class="btn btn-success w-full mt-2" :disabled="authStore.isLoading">
        <span v-if="authStore.isLoading" class="loading loading-spinner loading-sm"></span>
        {{ authStore.isLoading ? 'در حال ثبت‌نام...' : 'ثبت‌نام' }}
      </button>
      <div class="text-sm text-center mt-4">
        حساب دارید؟
        <button
          type="button"
          class="text-blue-600 hover:underline mr-1"
          @click="isRegisterMode = false"
        >
          ورود به حساب
        </button>
      </div>

      <div v-if="authStore.error" class="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
        {{ authStore.error }}
      </div>
    </form>

    <div v-if="showForgotPassword" class="mt-6 p-4 bg-blue-50 rounded-lg">
      <h3 class="font-medium mb-2">بازیابی رمز عبور</h3>
      <p class="text-sm text-gray-600 mb-3">
        لطفاً آدرس ایمیل خود را وارد کنید تا لینک بازیابی رمز عبور برای شما ارسال شود.
      </p>

      <div class="flex gap-2">
        <input
          v-model="forgotPasswordEmail"
          type="email"
          placeholder="your@email.com"
          class="input input-bordered flex-1"
        />
        <button @click="handleForgotPassword" class="btn btn-ghost" :disabled="isSendingResetLink">
          <span v-if="isSendingResetLink" class="loading loading-spinner loading-sm"></span>
          {{ isSendingResetLink ? 'در حال ارسال...' : 'ارسال' }}
        </button>
      </div>

      <button
        @click="showForgotPassword = false"
        class="mt-2 text-sm text-gray-500 hover:text-gray-700"
      >
        بازگشت به صفحه ورود
      </button>
    </div>

    <div v-if="resetEmailSent" class="mt-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
      لینک بازیابی رمز عبور به ایمیل شما ارسال شد. لطفاً صندوق ورودی خود را بررسی کنید.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';

const router = useRouter();
const authStore = useAuthStore();
const notification = useNotificationStore();

const isRegisterMode = ref(false);
const showForgotPassword = ref(false);
const resetEmailSent = ref(false);
const isSendingResetLink = ref(false);
const forgotPasswordEmail = ref('');

const loginForm = ref({
  email: '',
  password: '',
});

const registerForm = ref({
  name: '',
  email: '',
  password: '',
});

// Track if user needs email verification
const showResendVerification = ref(false);
const lastUnverifiedEmail = ref('');

// Handle resend verification email
const handleResendVerification = async () => {
  if (!lastUnverifiedEmail.value) return;

  try {
    const result = await authStore.resendVerificationEmail(lastUnverifiedEmail.value);
    notification.addNotification(result.message, 'success');
    showResendVerification.value = false;
  } catch (error: any) {
    console.error('خطا در ارسال مجدد لینک تایید:', error);
    notification.addNotification(
      error.message || 'خطا در ارسال مجدد لینک تایید. لطفاً دوباره تلاش کنید.',
      'error'
    );
  }
};

// Handle login form submission
const handleLogin = async () => {
  try {
    await authStore.signIn(loginForm.value.email, loginForm.value.password);
    notification.addNotification('ورود با موفقیت انجام شد', 'success');

    // Check if user is admin and redirect accordingly
    if (authStore.isAdmin) {
      router.push('/dashboard');
    } else {
      router.push('/');
    }
  } catch (error: any) {
    console.error('ورود ناموفق:', error);

    // Check if the error is about unverified email
    if (error.message && error.message.includes('لطفاً ابتدا ایمیل خود را تایید کنید')) {
      lastUnverifiedEmail.value = loginForm.value.email;
      showResendVerification.value = true;

      notification.addNotification(
        'لطفاً ابتدا ایمیل خود را تایید کنید. لینک تایید به ایمیل شما ارسال شده است.',
        'warning',
        10000
      );
    } else {
      notification.addNotification(
        error.message || 'خطا در ورود. لطفاً اطلاعات را بررسی کنید.',
        'error'
      );
    }
  }
};

// Handle registration form submission
const handleRegister = async () => {
  try {
    const result = await authStore.signUp(
      registerForm.value.email,
      registerForm.value.password,
      registerForm.value.name
    );

    // After successful registration, show success message
    notification.addNotification(
      result?.message ||
        'ثبت‌نام با موفقیت انجام شد. لطفاً ایمیل خود را برای تایید حساب کاربری بررسی کنید.',
      'success',
      10000 // نمایش پیام به مدت 10 ثانیه
    );

    // Clear the form
    registerForm.value = {
      name: '',
      email: '',
      password: '',
    };

    // Switch to login form after a short delay
    setTimeout(() => {
      isRegisterMode.value = false;
      loginForm.value.email = ''; // ایمیل قبلی را پاک می‌کنیم
    }, 1000);
  } catch (error: any) {
    console.error('ثبت‌نام ناموفق:', error);
    notification.addNotification(
      error.message || 'خطا در ثبت‌نام. لطفاً دوباره تلاش کنید.',
      'error'
    );
  }
};

// Handle forgot password
const handleForgotPassword = async () => {
  if (!forgotPasswordEmail.value) {
    notification.error('لطفاً آدرس ایمیل خود را وارد کنید');
    return;
  }

  try {
    isSendingResetLink.value = true;
    await authStore.resetPassword(forgotPasswordEmail.value);
    notification.success('لینک بازیابی رمز عبور به ایمیل شما ارسال شد');
    resetEmailSent.value = true;
    setTimeout(() => {
      showForgotPassword.value = false;
      resetEmailSent.value = false;
    }, 3000);
  } catch (error: any) {
    console.error('خطا در ارسال لینک بازیابی:', error);
    notification.error(error.message || 'خطا در ارسال لینک بازیابی. لطفاً دوباره تلاش کنید.');
  } finally {
    isSendingResetLink.value = false;
  }
};

// Watch for authentication state changes
watch(
  () => authStore.user,
  (newUser) => {
    if (newUser) {
      router.push('/');
    }
  }
);
</script>

<style scoped>
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.dark .glass {
  background: rgba(31, 41, 55, 0.7);
  border-color: rgba(255, 255, 255, 0.1);
}

.input {
  @apply w-full p-2 border rounded-md focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-all;
  @apply dark:bg-gray-700 dark:border-gray-600 dark:text-white;
}

.btn {
  @apply px-4 py-2 rounded-md font-medium transition-colors flex items-center justify-center gap-2;
}

.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800;
}

.btn-success {
  @apply bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800;
}

.btn-ghost {
  @apply bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600;
}

.label {
  @apply mb-1 flex items-center justify-between;
}

.label-text {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}

.form-control {
  @apply mb-3;
}
</style>
