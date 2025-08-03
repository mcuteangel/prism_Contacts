<template>
  <div class="min-h-screen" :class="{ dark: isDark }">
    <NavigationBar />
    <header class="glass sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800">
      <div class="container mx-auto px-4 py-3">
        <div class="flex justify-between items-center">
          <router-link to="/" class="text-xl font-bold"> مدیریت مخاطبین </router-link>

          <div v-if="authStore.isAuthenticated" class="flex items-center gap-4">
            <span class="text-sm text-gray-600 dark:text-gray-400">
              {{ authStore.user?.email }}
              ({{ authStore.isAdmin ? 'مدیر' : 'عادی' }})
            </span>

            <button
              v-tooltip="isDark ? 'تم روشن' : 'تم تاریک'"
              class="btn btn-secondary flex items-center gap-1"
              @click="toggleTheme"
            >
              <span class="iconify text-lg" :data-icon="isDark ? 'lucide:sun' : 'lucide:moon'" />
            </button>

            <button
              v-tooltip="'خروج'"
              class="btn btn-error flex items-center gap-1"
              @click="handleLogout"
              :disabled="isLoggingOut"
            >
              <span v-if="!isLoggingOut" class="iconify text-lg" data-icon="lucide:log-out" />
              <span v-else class="loading loading-spinner loading-sm"></span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="container mx-auto px-4 py-6">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <footer class="mt-auto py-4 text-center text-sm text-gray-500 dark:text-gray-400">
      <p>طراحی شده با ❤️</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../composables/useTheme';
import { onMounted } from 'vue';
import NavigationBar from '../components/NavigationBar.vue';

const authStore = useAuthStore();
const router = useRouter();
const { isDark, toggleTheme, initTheme } = useTheme();
const isLoggingOut = ref(false);

const handleLogout = async () => {
  try {
    isLoggingOut.value = true;
    await authStore.signOut();
    router.push('/auth');
  } catch (error) {
    console.error('خطا در خروج از حساب کاربری:', error);
  } finally {
    isLoggingOut.value = false;
  }
};

onMounted(() => {
  initTheme();
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.dark {
  @apply bg-gray-900 text-gray-100;
}

.btn {
  @apply px-3 py-1 rounded font-bold transition shadow-sm;
}

.btn-secondary {
  @apply bg-gray-400 text-white hover:bg-gray-500 dark:bg-gray-700 dark:hover:bg-gray-600;
}

.btn-error {
  @apply bg-red-500 text-white hover:bg-red-600;
}

.glass {
  @apply bg-white/80 backdrop-blur dark:bg-gray-800/80;
}
</style>
