import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useObservable } from '@vueuse/rxjs';
import { contactRepository } from '../services/ContactRepository';
import type { Contact, ContactInsert, ContactUpdate } from '../types/supabase';
import { useNotificationStore } from './notificationStore';
import { useAuthStore } from './authStore';
import { Observable } from 'rxjs';

// مدت زمان کش‌گذاری برای همگام‌سازی (5 دقیقه)
const SYNC_CACHE_DURATION = 5 * 60 * 1000;

export const useContactsStore = defineStore('contacts', () => {
  // --- State ---
  const searchQuery = ref('');
  const selectedGroupId = ref<string | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  // زمان آخرین همگام‌سازی موفق
  const lastSyncTimestamp = ref<number | null>(null);

  // --- Stores ---
  const notificationStore = useNotificationStore();
  const authStore = useAuthStore();

  // --- Live Contacts ---
  // اتصال زنده به دیتابیس محلی
  // استفاده از useObservable برای مدیریت خودکار subscription
  const contacts = useObservable<Contact[]>(
    contactRepository.getLiveContacts() as unknown as Observable<Contact[]>,
    {
      initialValue: [] as Contact[],
    }
  );

  // Ensure contacts is always an array and properly typed
  const safeContacts = computed<Contact[]>(() => {
    try {
      const value = contacts.value;
      return Array.isArray(value) ? value : [];
    } catch (e) {
      console.error('Error accessing contacts:', e);
      return [];
    }
  });

  // --- Actions ---
  const addContact = async (contact: ContactInsert) => {
    try {
      await contactRepository.addContact(contact);
      notificationStore.success('مخاطب با موفقیت اضافه شد.');
    } catch (e: any) {
      error.value = 'خطا در افزودن مخاطب';
      notificationStore.error(error.value);
      console.error(e);
      throw e; // پرتاب خطا برای مدیریت در کامپوننت
    }
  };

  const updateContact = async (id: string, updates: ContactUpdate) => {
    try {
      await contactRepository.updateContact(id, updates);
      notificationStore.success('مخاطب با موفقیت به‌روزرسانی شد.');
    } catch (e: any) {
      error.value = 'خطا در به‌روزرسانی مخاطب';
      notificationStore.error(error.value);
      console.error(e);
      throw e;
    }
  };

  const deleteContact = async (id: string) => {
    try {
      await contactRepository.deleteContact(id);
      notificationStore.success('مخاطب با موفقیت حذف شد.');
    } catch (e: any) {
      error.value = 'خطا در حذف مخاطب';
      notificationStore.error(error.value);
      console.error(e);
      throw e;
    }
  };

  const getContactById = async (id: string): Promise<Contact | undefined> => {
    try {
      return await contactRepository.getContactById(id);
    } catch (e) {
      console.error('Error fetching contact by id from local DB:', e);
      error.value = 'خطا در دریافت اطلاعات مخاطب';
      notificationStore.error(error.value);
      return undefined;
    }
  };

  // --- Sync with Server with Caching ---
  const sync = async (force: boolean = false) => {
    // بررسی کش و تصمیم‌گیری برای انجام یا عدم انجام همگام‌سازی
    const now = Date.now();
    if (!force && lastSyncTimestamp.value && now - lastSyncTimestamp.value < SYNC_CACHE_DURATION) {
      console.log('Contacts sync skipped (cache is fresh).');
      return; // اگر کش معتبر است، از همگام‌سازی مجدد خودداری می‌کنیم
    }

    if (!authStore.user?.id) return;

    isLoading.value = true;
    error.value = null;

    try {
      await contactRepository.syncWithSupabase();
      // فقط در اولین همگام‌سازی یا همگام‌سازی اجباری نوتیفیکیشن نشان می‌دهیم
      if (force || !lastSyncTimestamp.value) {
        notificationStore.success('همگام‌سازی مخاطبین با موفقیت انجام شد.');
      }
      // به‌روزرسانی زمان آخرین همگام‌سازی موفق
      lastSyncTimestamp.value = now;
    } catch (e: any) {
      error.value = 'خطا در همگام‌سازی مخاطبین با سرور';
      notificationStore.error(error.value);
      console.error(e);
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  // --- Getters (Computed Properties) ---
  const filteredContacts = computed(() => {
    let list = [...safeContacts.value];

    // Apply search filter if searchQuery exists
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      list = list.filter((contact) => {
        const fullName = `${contact.firstName || ''} ${contact.lastName || ''}`.toLowerCase();
        const phoneMatch = contact.phoneNumbers?.some((phone: { number?: string }) =>
          phone.number?.toLowerCase().includes(query)
        );
        const emailMatch = contact.emails?.some((email: { email?: string }) =>
          email.email?.toLowerCase().includes(query)
        );
        return fullName.includes(query) || phoneMatch || emailMatch;
      });
    }

    // فیلتر بر اساس گروه انتخاب شده
    if (selectedGroupId.value) {
      list = list.filter((contact) => contact.groupIds?.includes(selectedGroupId.value!));
    }

    return list;
  });

  // --- Return ---
  return {
    // State
    searchQuery,
    selectedGroupId,
    isLoading,
    error,

    // Getters
    contacts: safeContacts,
    filteredContacts,

    // Actions
    addContact,
    updateContact,
    deleteContact,
    getContactById,
    sync,
    resetSearch: () => (searchQuery.value = ''),
    resetError: () => (error.value = null),
  };
});
