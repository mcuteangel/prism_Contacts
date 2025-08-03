// ===== TEMPLATE =====
<template>
  <div class="max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">داشبورد</h1>

    <!-- نمایش خطاها -->
    <div
      v-if="error"
      class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
      role="alert"
    >
      <strong class="font-bold">خطا!</strong>
      <span class="block sm:inline"> {{ error }}</span>
    </div>

    <!-- نمایش وضعیت لودینگ -->
    <div v-if="isLoading" class="text-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      <p class="mt-2 text-gray-600">در حال بارگذاری داده‌ها...</p>
    </div>

    <!-- نمایش محتوای اصلی -->
    <template v-else>
      <DashboardStats :contacts="safeContacts" :groups="safeGroups" :is-loading="isLoading" />
    </template>
  </div>
</template>

// ===== SCRIPT =====
<script setup lang="ts">
import { onMounted, computed, ref, watchEffect } from 'vue';
import { storeToRefs } from 'pinia';
import type { Contact, Group } from '../types/supabase';
// ۱. استفاده از استورهای جدید
import { useContactsStore } from '../stores/contactsStore';
import { useGroupsStore } from '../stores/groupsStore';
import DashboardStats from '../components/DashboardStats.vue';

// ۲. مقداردهی استورهای جدید
const contactsStore = useContactsStore();
const groupsStore = useGroupsStore();

// ۳. گرفتن داده‌های ری‌اکتیو از استورها
const { contacts, isLoading: isContactsLoading, error: contactsError } = storeToRefs(contactsStore);

const { groups, isLoading: isGroupsLoading, error: groupsError } = storeToRefs(groupsStore);

// وضعیت کلی لودینگ و خطا
const isLoading = ref(false);
const error = ref<string | null>(null);

// Safe access to contacts and groups with default empty arrays
const safeContacts = computed<Contact[]>(() => {
  try {
    return Array.isArray(contacts.value) ? contacts.value : [];
  } catch (e) {
    console.error('Error accessing contacts:', e);
    return [];
  }
});

const safeGroups = computed<Group[]>(() => {
  try {
    return Array.isArray(groups.value) ? groups.value : [];
  } catch (e) {
    console.error('Error accessing groups:', e);
    return [];
  }
});

// Watch for loading states
watchEffect(() => {
  isLoading.value = Boolean(isContactsLoading.value || isGroupsLoading.value);
  error.value = contactsError.value || groupsError.value || null;
});

// ۴. فراخوانی متد sync برای همگام‌سازی اولیه
onMounted(async () => {
  try {
    // اگر داده‌ای وجود ندارد، همگام‌سازی اولیه را انجام بده
    if (safeContacts.value.length === 0) {
      await contactsStore.sync();
    }
    if (safeGroups.value.length === 0) {
      await groupsStore.sync();
    }
  } catch (err) {
    console.error('Error initializing dashboard:', err);
  }
});
</script>
