import { db } from './database';
import { supabase } from '../supabase';
import type { Contact, ContactInsert, ContactUpdate } from '../types/supabase';
import { liveQuery } from 'dexie';
import { v4 as uuidv4 } from 'uuid';
import { syncService } from './SyncService';

class ContactRepository {
  /**
   * داده‌ها را به صورت زنده (Live) از Dexie می‌خواند.
   * هر تغییری در دیتابیس محلی، این جریان داده را به‌روز می‌کند.
   */
  getLiveContacts() {
    return liveQuery(() => db.contacts.orderBy('lastName').toArray());
  }

  /**
   * یک مخاطب را به صورت محلی و سپس در سرور اضافه می‌کند.
   */
  async addContact(contact: ContactInsert) {
    // 1. دریافت کاربر جاری
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 2. یک ID موقت برای آیتم آفلاین ایجاد می‌کنیم
    const tempId = `temp_${uuidv4()}`;
    const newContact: Contact = {
      ...contact,
      id: tempId,
      user_id: user?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      needsSync: true,
    };

    // 2. بلافاصله در دیتابیس محلی ذخیره می‌کنیم
    await db.contacts.add(newContact);

    // 3. عملیات را برای همگام‌سازی به صف اضافه می‌کنیم
    await syncService.addToQueue({
      entity: 'contacts',
      type: 'CREATE',
      payload: {
        ...contact,
        id: tempId,
        user_id: newContact.user_id,
        created_at: newContact.created_at,
        updated_at: newContact.updated_at,
      },
    });

    return tempId;
  }

  /**
   * یک مخاطب را به صورت محلی و سپس در سرور آپدیت می‌کند.
   */
  async updateContact(id: string, updates: ContactUpdate) {
    // 1. آپدیت فوری در دیتابیس محلی
    const updatedAt = new Date().toISOString();
    await db.contacts.update(id, {
      ...updates,
      updated_at: updatedAt,
      needsSync: true,
    });

    // 2. افزودن به صف همگام‌سازی
    await syncService.addToQueue({
      entity: 'contacts',
      type: 'UPDATE',
      payload: {
        ...updates,
        id,
        updated_at: updatedAt,
      },
    });
  }

  /**
   * یک مخاطب را به صورت محلی و سپس در سرور حذف می‌کند.
   */
  async deleteContact(id: string) {
    // 1. دریافت اطلاعات مخاطب قبل از حذف
    const contact = await this.getContactById(id);
    if (!contact) return;

    // 2. حذف فوری از دیتابیس محلی
    await db.contacts.delete(id);

    // 3. اگر مخاطب قبلاً در سرور وجود نداشته (آفلاین اضافه شده)،
    // نیازی به اضافه کردن به صف حذف نیست
    if (id.startsWith('temp_')) {
      return;
    }

    // 4. افزودن به صف همگام‌سازی
    await syncService.addToQueue({
      entity: 'contacts',
      type: 'DELETE',
      payload: { id },
    });
  }

  /**
   * دیتابیس محلی را با آخرین داده‌های سرور همگام‌سازی می‌کند.
   */
  async syncWithSupabase() {
    console.log('Syncing contacts with Supabase...');

    // دریافت تمام مخاطبین از سرور
    const { data, error } = await supabase.from('contacts').select('*');

    if (error) {
      console.error('Sync failed:', error);
      throw error;
    }

    // ذخیره‌سازی دسته‌ای داده‌ها در دیتابیس محلی
    if (data && data.length > 0) {
      await db.contacts.bulkPut(data);
      console.log(`Synced ${data.length} contacts.`);
      return data.length;
    }

    console.log('No contacts to sync.');
    return 0;
  }

  /**
   * یک مخاطب را با شناسه آن پیدا می‌کند.
   */
  async getContactById(id: string): Promise<Contact | undefined> {
    return await db.contacts.get(id);
  }
}

export const contactRepository = new ContactRepository();

export default contactRepository;
