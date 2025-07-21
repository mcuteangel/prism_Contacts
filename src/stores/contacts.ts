import { defineStore } from 'pinia';
import { db as realDb, type Contact } from '../database/dexie';
import { useUserStore as realUserStore } from './user';
import { customFieldSchemas, type CustomFieldType } from '../database/customFieldSchema';

function validateCustomFields(input: Record<string, any>) {
  const valid: Record<string, any> = {};
  for (const schema of customFieldSchemas) {
    if (input && Object.prototype.hasOwnProperty.call(input, schema.key)) {
      const value = input[schema.key];
      // type check
      if (
        (schema.type === 'text' && typeof value === 'string') ||
        (schema.type === 'number' && typeof value === 'number') ||
        (schema.type === 'date' && typeof value === 'string' &&
          /^\d{4}-\d{2}-\d{2}$/.test(value)) ||
        (schema.type === 'list' && Array.isArray(value))
      ) {
        valid[schema.key] = value;
      }
    }
  }
  return valid;
}

export const useContactsStore = defineStore('contacts', {
  state: () => ({
    contacts: [] as Contact[],
    loading: false,
    error: null as string | null,
  }),
  actions: {
    async fetchContacts(userStore = realUserStore(), db = realDb) {
      this.loading = true;
      try {
        const user = userStore.currentUser;
        if (user?.role === 'admin') {
          this.contacts = await db.contacts.toArray();
        } else if (user?.id) {
          this.contacts = await db.contacts.where('userId').equals(user.id).toArray();
        } else {
          this.contacts = [];
        }
        // در متد fetchContacts (یا هر متدی که مخاطبین را از دیتابیس می‌خواند)، بعد از دریافت مخاطبین:
        // مخاطبین را با schema مرکزی sync کن:
        this.contacts.forEach((contact) => {
          Object.keys(contact.customFields ?? {}).forEach((key) => {
            if (!customFieldSchemas.some((f) => f.key === key)) {
              delete contact.customFields[key];
            }
          });
        });
        this.error = null;
      } catch (e) {
        this.error = 'خطا در دریافت مخاطبین';
      } finally {
        this.loading = false;
      }
    },
    async addContact(contact: Contact, userStore = realUserStore(), db = realDb) {
      try {
        const user = userStore.currentUser;
        if (!user?.id) throw new Error('کاربر وارد نشده است');
        const now = new Date().toISOString();
        // فقط customFields معتبر ذخیره شود
        const validCustomFields = validateCustomFields(contact.customFields || {});
        const newContact = {
          ...contact,
          customFields: validCustomFields,
          createdAt: now,
          updatedAt: now,
          userId: user.id,
        };
        const id = await db.contacts.add(newContact);
        this.contacts.push({ ...newContact, id });
        this.error = null;
      } catch (e) {
        this.error = 'خطا در افزودن مخاطب';
      }
    },
    async updateContact(contact: Contact, db = realDb) {
      if (!contact.id) return;
      try {
        const prev = await db.contacts.get(contact.id);
        if (!prev) return;
        // حذف پراپرتی customFields از contact برای جلوگیری از overwrite شدن مقدار جدید
        const { customFields: _cf, ...contactWithoutCustomFields } = contact;
        // پاکسازی فیلدهای undefined/null/empty از customFields
        const rawCustomFields = contact.customFields || {};
        const cleanedCustomFields: Record<string, any> = {};
        for (const key in rawCustomFields) {
          const value = rawCustomFields[key];
          if (value !== undefined && value !== null && value !== '') {
            cleanedCustomFields[key] = value;
          }
        }
        const validCustomFields = validateCustomFields(cleanedCustomFields);
        const updated = {
          ...prev,
          ...contactWithoutCustomFields,
          updatedAt: new Date().toISOString(),
          customFields: validCustomFields,
        };
        await db.contacts.put(updated);
        const fresh = await db.contacts.get(contact.id);
        const idx = this.contacts.findIndex((c) => c.id === contact.id);
        if (idx !== -1 && fresh) this.contacts[idx] = fresh;
        this.error = null;
      } catch (e) {
        this.error = 'خطا در ویرایش مخاطب';
      }
    },
    async deleteContact(id: number, db = realDb) {
      try {
        await db.contacts.delete(id);
        this.contacts = this.contacts.filter((c) => c.id !== id);
        this.error = null;
      } catch (e) {
        this.error = 'خطا در حذف مخاطب';
      }
    },
  },
});
