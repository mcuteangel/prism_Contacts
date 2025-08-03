<template>
  <!-- Desktop Top Navbar -->
  <nav
    class="hidden md:flex justify-between items-center px-6 py-3 glass border-b border-gray-200 dark:border-gray-800"
  >
    <div class="flex items-center gap-6">
      <router-link to="/dashboard" class="flex items-center gap-2 nav-link">
        <span class="iconify" data-icon="lucide:layout-dashboard" />
        داشبورد
      </router-link>
      <router-link to="/contacts" class="flex items-center gap-2 nav-link">
        <span class="iconify" data-icon="lucide:users" />
        مخاطبین
      </router-link>
      <router-link to="/contacts/new" class="flex items-center gap-2 nav-link">
        <span class="iconify" data-icon="lucide:user-plus" />
        مخاطب جدید
      </router-link>
      <router-link to="/groups" class="flex items-center gap-2 nav-link">
        <span class="iconify" data-icon="lucide:folder" />
        گروه‌ها
      </router-link>

      <!-- Admin Only Links -->
      <template v-if="authStore.isAdmin">
        <router-link to="/fields" class="flex items-center gap-2 nav-link">
          <span class="iconify" data-icon="lucide:list-plus" />
          فیلدهای سفارشی
        </router-link>
        <router-link to="/admin/users" class="flex items-center gap-2 nav-link">
          <span class="iconify" data-icon="lucide:users" />
          مدیریت کاربران
        </router-link>
      </template>

      <router-link to="/tools" class="flex items-center gap-2 nav-link">
        <span class="iconify" data-icon="lucide:tool" />
        ابزار
      </router-link>
      <router-link to="/settings" class="flex items-center gap-2 nav-link">
        <span class="iconify" data-icon="lucide:settings" />
        تنظیمات
      </router-link>
    </div>
    <slot name="right" />
  </nav>

  <!-- Mobile Bottom Navbar (iOS style) -->
  <nav
    class="fixed bottom-0 left-0 right-0 z-50 flex md:hidden justify-around items-center bg-white/90 dark:bg-gray-900/90 border-t border-gray-200 dark:border-gray-800 py-2 backdrop-blur shadow"
  >
    <router-link to="/dashboard" class="flex flex-col items-center nav-link">
      <span class="iconify text-xl" data-icon="lucide:layout-dashboard" />
      <span class="text-xs mt-1">داشبورد</span>
    </router-link>
    <router-link to="/contacts" class="flex flex-col items-center nav-link">
      <span class="iconify text-xl" data-icon="lucide:users" />
      <span class="text-xs mt-1">مخاطبین</span>
    </router-link>
    <router-link to="/contacts/new" class="flex flex-col items-center nav-link">
      <span class="iconify text-xl" data-icon="lucide:user-plus" />
      <span class="text-xs mt-1">جدید</span>
    </router-link>
    <router-link to="/groups" class="flex flex-col items-center nav-link">
      <span class="iconify text-xl" data-icon="lucide:folder" />
      <span class="text-xs mt-1">گروه‌ها</span>
    </router-link>

    <!-- Admin Only Mobile Links -->
    <template v-if="authStore.isAdmin">
      <router-link to="/fields" class="flex flex-col items-center nav-link">
        <span class="iconify text-xl" data-icon="lucide:list-plus" />
        <span class="text-xs mt-1">فیلدها</span>
      </router-link>
      <router-link to="/admin/users" class="flex flex-col items-center nav-link">
        <span class="iconify text-xl" data-icon="lucide:users" />
        <span class="text-xs mt-1">کاربران</span>
      </router-link>
    </template>

    <router-link to="/tools" class="flex flex-col items-center nav-link">
      <span class="iconify text-xl" data-icon="lucide:tool" />
      <span class="text-xs mt-1">ابزار</span>
    </router-link>
    <router-link to="/settings" class="flex flex-col items-center nav-link">
      <span class="iconify text-xl" data-icon="lucide:settings" />
      <span class="text-xs mt-1">تنظیمات</span>
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores/authStore';

const authStore = useAuthStore();
</script>

<style scoped>
.nav-link {
  @apply text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition font-medium px-2 py-1 rounded;
}
.router-link-exact-active {
  @apply text-blue-600 dark:text-blue-400 font-bold;
}
.iconify {
  display: inline-block;
  vertical-align: middle;
}
</style>

<!--
برای نمایش آیکون‌ها باید پکیج @iconify/iconify را نصب و در main.ts ایمپورت کنید:
import '@iconify/iconify';
یا از CDN در index.html:
<script src="https://code.iconify.design/3/iconify.min.js"></script>
-->
