import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useObservable } from '@vueuse/rxjs';
import { customFieldSchemaRepository } from '@/services/CustomFieldSchemaRepository';
import type {
  CustomFieldSchema,
  CustomFieldSchemaInsert,
  CustomFieldSchemaUpdate,
} from '@/types/supabase';
import { useNotificationStore } from './notificationStore';

// مدت زمان کش‌گذاری برای همگام‌سازی (5 دقیقه)
const SYNC_CACHE_DURATION = 5 * 60 * 1000;

export const useCustomFieldsSchemaStore = defineStore('customFieldsSchema', () => {
  // --- State & Stores ---
  const notificationStore = useNotificationStore();
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  // زمان آخرین همگام‌سازی موفق
  const lastSyncTimestamp = ref<number | null>(null);

  // --- Live Data ---
  // `schemas` now automatically syncs with the `customFieldSchemas` table in Dexie
  const schemas = useObservable(customFieldSchemaRepository.getLiveSchemas(), {
    initialValue: [],
  });

  // --- Actions ---
  const addSchema = async (schema: CustomFieldSchemaInsert) => {
    try {
      await customFieldSchemaRepository.addSchema(schema);
      notificationStore.success('فیلد سفارشی با موفقیت اضافه شد.');
    } catch (e: any) {
      error.value = 'خطا در افزودن فیلد سفارشی';
      notificationStore.error(error.value);
    }
  };

  const updateSchema = async (id: string, updates: CustomFieldSchemaUpdate) => {
    try {
      await customFieldSchemaRepository.updateSchema(id, updates);
      notificationStore.success('فیلد سفارشی با موفقیت به‌روزرسانی شد.');
    } catch (e: any) {
      error.value = 'خطا در به‌روزرسانی فیلد سفارشی';
      notificationStore.error(error.value);
    }
  };

  const deleteSchema = async (id: string) => {
    try {
      await customFieldSchemaRepository.deleteSchema(id);
      notificationStore.success('فیلد سفارشی با موفقیت حذف شد.');
    } catch (e: any) {
      error.value = 'خطا در حذف فیلد سفارشی';
      notificationStore.error(error.value);
    }
  };

  const sync = async (force: boolean = false) => {
    // بررسی کش و تصمیم‌گیری برای انجام یا عدم انجام همگام‌سازی
    const now = Date.now();
    if (!force && lastSyncTimestamp.value && now - lastSyncTimestamp.value < SYNC_CACHE_DURATION) {
      console.log('Custom fields schema sync skipped (cache is fresh).');
      return; // اگر کش معتبر است، از همگام‌سازی مجدد خودداری می‌کنیم
    }

    isLoading.value = true;
    error.value = null;
    try {
      await customFieldSchemaRepository.syncWithSupabase();
      // فقط در اولین همگام‌سازی یا همگام‌سازی اجباری نوتیفیکیشن نشان می‌دهیم
      if (force || !lastSyncTimestamp.value) {
        notificationStore.success('همگام‌سازی فیلدهای سفارشی با موفقیت انجام شد.');
      } else {
        console.log('Custom fields schema synced in background (cached).');
      }
      // به‌روزرسانی زمان آخرین همگام‌سازی موفق
      lastSyncTimestamp.value = now;
    } catch (e: any) {
      error.value = 'خطا در همگام‌سازی فیلدهای سفارشی';
      notificationStore.error(error.value);
      console.error(e);
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    schemas,
    isLoading,
    error,
    addSchema,
    updateSchema,
    deleteSchema,
    sync,
  };
});
