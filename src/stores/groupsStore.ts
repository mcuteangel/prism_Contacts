import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useObservable } from '@vueuse/rxjs';
import { groupRepository } from '../services/GroupRepository';
import type { Group, GroupInsert, GroupUpdate } from '../types/supabase';
import { useNotificationStore } from './notificationStore';
import { Observable } from 'rxjs';

// مدت زمان کش‌گذاری برای همگام‌سازی (5 دقیقه)
const SYNC_CACHE_DURATION = 5 * 60 * 1000;

export const useGroupsStore = defineStore('groups', () => {
  // --- State ---
  const notificationStore = useNotificationStore();
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  // زمان آخرین همگام‌سازی موفق
  const lastSyncTimestamp = ref<number | null>(null);

  // استفاده از useObservable برای مدیریت خودکار subscription
  const groups = useObservable<Group[]>(
    groupRepository.getLiveGroups() as unknown as Observable<Group[]>,
    {
      initialValue: [] as Group[],
    }
  );

  // Ensure groups is always an array and properly typed
  const safeGroups = computed<Group[]>(() => {
    try {
      const value = groups.value;
      return Array.isArray(value) ? value : [];
    } catch (e) {
      console.error('Error accessing groups:', e);
      return [];
    }
  });

  // Load initial data
  const loadGroups = async () => {
    if (safeGroups.value.length === 0) {
      try {
        isLoading.value = true;
        await groupRepository.syncWithSupabase();
      } catch (e) {
        console.error('Error loading groups:', e);
        error.value = 'خطا در بارگذاری گروه‌ها';
        notificationStore.error(error.value);
      } finally {
        isLoading.value = false;
      }
    }
  };

  // Load groups on store initialization
  loadGroups();

  // --- Actions ---
  const addGroup = async (group: GroupInsert) => {
    try {
      await groupRepository.addGroup(group);
      notificationStore.success('گروه با موفقیت اضافه شد.');
    } catch (e: any) {
      error.value = 'خطا در افزودن گروه';
      notificationStore.error(error.value);
      console.error(e);
      throw e;
    }
  };

  const updateGroup = async (id: string, updates: GroupUpdate) => {
    try {
      await groupRepository.updateGroup(id, updates);
      notificationStore.success('گروه با موفقیت به‌روزرسانی شد.');
    } catch (e: any) {
      error.value = 'خطا در به‌روزرسانی گروه';
      notificationStore.error(error.value);
      console.error(e);
      throw e;
    }
  };

  const deleteGroup = async (id: string) => {
    try {
      await groupRepository.deleteGroup(id);
      notificationStore.success('گروه با موفقیت حذف شد.');
    } catch (e: any) {
      error.value = 'خطا در حذف گروه';
      notificationStore.error(error.value);
      console.error(e);
      throw e;
    }
  };

  const sync = async (force: boolean = false) => {
    // بررسی کش و تصمیم‌گیری برای انجام یا عدم انجام همگام‌سازی
    const now = Date.now();
    if (!force && lastSyncTimestamp.value && now - lastSyncTimestamp.value < SYNC_CACHE_DURATION) {
      console.log('Groups sync skipped (cache is fresh).');
      return; // اگر کش معتبر است، از همگام‌سازی مجدد خودداری می‌کنیم
    }

    isLoading.value = true;
    error.value = null;
    try {
      await groupRepository.syncWithSupabase();
      // فقط در اولین همگام‌سازی یا همگام‌سازی اجباری نوتیفیکیشن نشان می‌دهیم
      if (force || !lastSyncTimestamp.value) {
        notificationStore.success('همگام‌سازی گروه‌ها با موفقیت انجام شد.');
      } else {
        console.log('Groups synced in background (cached).');
      }
      // به‌روزرسانی زمان آخرین همگام‌سازی موفق
      lastSyncTimestamp.value = now;
    } catch (e: any) {
      error.value = 'خطا در همگام‌سازی گروه‌ها با سرور';
      notificationStore.error(error.value);
      console.error(e);
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    // State
    isLoading,
    error,

    // Getters
    groups: safeGroups,

    // Actions
    addGroup,
    updateGroup,
    deleteGroup,
    sync,
    resetError: () => (error.value = null),
  };
});
