import { defineStore } from 'pinia';
import { ref, onMounted } from 'vue';
import { customFieldRepository } from '../services/CustomFieldRepository';
import type { CustomFieldInsert, CustomFieldUpdate } from '../types/supabase';
import { useNotificationStore } from './notificationStore';
import type { CustomFieldDB } from '../services/database';

// مدت زمان کش‌گذاری برای همگام‌سازی (5 دقیقه)
const SYNC_CACHE_DURATION = 5 * 60 * 1000;

export const useCustomFieldsStore = defineStore('customFields', () => {
  // --- State ---
  const notificationStore = useNotificationStore();
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  // زمان آخرین همگام‌سازی موفق
  const lastSyncTimestamp = ref<number | null>(null);

  // --- Live Data ---
  const customFields = ref<CustomFieldDB[]>([]);

  // Load initial data
  const loadCustomFields = async () => {
    try {
      // Get all custom fields by passing null/undefined as contactId
      const fields = await customFieldRepository.getContactCustomFields('');
      customFields.value = fields;
    } catch (e) {
      console.error('Error loading custom fields:', e);
      error.value = 'خطا در بارگذاری فیلدهای سفارشی';
      notificationStore.error(error.value);
    }
  };

  // Subscribe to changes
  onMounted(() => {
    // Subscribe to changes in the database
    const subscription = customFieldRepository.getLiveCustomFields().subscribe({
      next: (fields) => {
        customFields.value = fields;
      },
      error: (e) => {
        console.error('Error in custom fields subscription:', e);
        error.value = 'خطا در دریافت تغییرات فیلدهای سفارشی';
        notificationStore.error(error.value);
      },
    });

    // Load initial data
    loadCustomFields();

    // Cleanup subscription when component is unmounted
    return () => {
      subscription.unsubscribe();
    };
  });

  // --- Actions ---
  const addCustomField = async (field: CustomFieldInsert) => {
    try {
      await customFieldRepository.addCustomField(field);
      notificationStore.success('فیلد سفارشی با موفقیت اضافه شد.');
    } catch (e: any) {
      error.value = 'خطا در افزودن فیلد سفارشی';
      notificationStore.error(error.value);
      console.error(e);
      throw e;
    }
  };

  const updateCustomField = async (id: string, updates: CustomFieldUpdate) => {
    try {
      await customFieldRepository.updateCustomField(id, updates);
      notificationStore.success('فیلد سفارشی با موفقیت به‌روزرسانی شد.');
    } catch (e: any) {
      error.value = 'خطا در به‌روزرسانی فیلد سفارشی';
      notificationStore.error(error.value);
      console.error(e);
      throw e;
    }
  };

  const deleteCustomField = async (id: string) => {
    try {
      await customFieldRepository.deleteCustomField(id);
      notificationStore.success('فیلد سفارشی با موفقیت حذف شد.');
    } catch (e: any) {
      error.value = 'خطا در حذف فیلد سفارشی';
      notificationStore.error(error.value);
      console.error(e);
      throw e;
    }
  };

  const getContactCustomFields = async (contactId: string) => {
    try {
      return await customFieldRepository.getContactCustomFields(contactId);
    } catch (e: any) {
      error.value = 'خطا در دریافت فیلدهای سفارشی مخاطب';
      notificationStore.error(error.value);
      console.error(e);
      throw e;
    }
  };

  const sync = async (force: boolean = false) => {
    // بررسی کش و تصمیم‌گیری برای انجام یا عدم انجام همگام‌سازی
    const now = Date.now();
    if (!force && lastSyncTimestamp.value && now - lastSyncTimestamp.value < SYNC_CACHE_DURATION) {
      console.log('Custom fields sync skipped (cache is fresh).');
      return; // اگر کش معتبر است، از همگام‌سازی مجدد خودداری می‌کنیم
    }

    isLoading.value = true;
    error.value = null;
    try {
      await customFieldRepository.syncWithSupabase();
      // فقط در اولین همگام‌سازی یا همگام‌سازی اجباری نوتیفیکیشن نشان می‌دهیم
      if (force || !lastSyncTimestamp.value) {
        notificationStore.success('همگام‌سازی فیلدهای سفارشی با موفقیت انجام شد.');
      } else {
        console.log('Custom fields synced in background (cached).');
      }
      // به‌روزرسانی زمان آخرین همگام‌سازی موفق
      lastSyncTimestamp.value = now;
    } catch (e: any) {
      error.value = 'خطا در همگام‌سازی فیلدهای سفارشی با سرور';
      notificationStore.error(error.value);
      console.error(e);
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    customFields,
    isLoading,
    error,
    addCustomField,
    updateCustomField,
    deleteCustomField,
    getContactCustomFields,
    sync,
  };
});
