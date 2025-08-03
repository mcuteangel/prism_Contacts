import { db, type CustomFieldDB } from './database';
import { supabase } from '../supabase';
import { syncService } from './SyncService';
import type { CustomFieldInsert, CustomFieldUpdate } from '../types/supabase';
import { liveQuery } from 'dexie';
import { v4 as uuidv4 } from 'uuid';

// Use the existing CustomFieldDB type from database.ts

class CustomFieldRepository {
  /**
   * دریافت زنده‌ی فیلدهای سفارشی از دیتابیس محلی
   */
  getLiveCustomFields() {
    return liveQuery(() => db.customFields.toArray());
  }

  /**
   * افزودن فیلد سفارشی جدید به دیتابیس محلی و سرور
   */
  async addCustomField(field: CustomFieldInsert) {
    // Generate a temporary ID for the new field
    const tempId = `temp_${uuidv4()}`;
    const now = new Date().toISOString();

    // Create the field with temporary ID and timestamps
    const fieldWithTempId = {
      ...field,
      id: tempId,
      created_at: now,
      updated_at: now,
      isDeleted: false,
      deletedAt: null,
    } as CustomFieldDB;

    // Add to local DB first
    await db.customFields.add(fieldWithTempId);

    // Add to sync queue
    await syncService.addToQueue({
      type: 'custom_field',
      action: 'CREATE',
      data: field,
      id: tempId,
    });

    console.log('فیلد سفارشی با موفقیت به صف همگام‌سازی اضافه شد.');
    return fieldWithTempId;
  }

  /**
   * به‌روزرسانی فیلد سفارشی در دیتابیس محلی و سرور
   */
  async updateCustomField(id: string, updates: CustomFieldUpdate) {
    // Update local DB first
    await db.customFields.update(id, {
      ...updates,
      updated_at: new Date().toISOString(),
    });

    // If this is a temporary record, it will be handled when created
    if (id.startsWith('temp_')) return;

    // Add to sync queue
    await syncService.addToQueue({
      type: 'custom_field',
      action: 'UPDATE',
      id: id,
      data: {
        ...updates,
        updated_at: new Date().toISOString(),
      },
    });

    console.log('به‌روزرسانی فیلد سفارشی به صف همگام‌سازی اضافه شد.');
  }

  /**
   * حذف فیلد سفارشی از دیتابیس محلی و سرور
   */
  async deleteCustomField(id: string) {
    // Get the field before deleting
    const field = await db.customFields.get(id);
    if (!field) return;

    // If it's a temporary field that wasn't synced yet, just delete it
    if (id.startsWith('temp_')) {
      await db.customFields.delete(id);
      return;
    }

    // Soft delete in local DB
    await db.customFields.update(id, {
      isDeleted: true,
      deletedAt: new Date().toISOString(),
    });

    // Add to sync queue
    await syncService.addToQueue({
      type: 'custom_field',
      action: 'DELETE',
      id: id,
      data: {
        id: id,
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      },
    });

    console.log('درخواست حذف فیلد سفارشی به صف همگام‌سازی اضافه شد.');
  }

  /**
   * دریافت فیلدهای سفارشی یک مخاطب
   */
  async getContactCustomFields(contactId: string): Promise<CustomFieldDB[]> {
    const allFields = await db.customFields.where('contactId').equals(contactId).toArray();
    return allFields.filter((field) => !field.isDeleted);
  }

  /**
   * همگام‌سازی دیتابیس محلی با آخرین داده‌های سرور
   */
  async syncWithSupabase() {
    // This method is kept for backward compatibility but should be replaced with syncService
    const { data: serverFields, error } = await supabase
      .from('custom_fields')
      .select('*')
      .is('deleted_at', null);

    if (error) throw error;

    // Update local DB
    await db.transaction('rw', db.customFields, async () => {
      // Clear existing data
      await db.customFields.clear();

      // Add new data
      if (serverFields && serverFields.length > 0) {
        await db.customFields.bulkAdd(
          serverFields.map((field) => ({
            ...field,
            isDeleted: false,
            deletedAt: null,
            needsSync: false,
          }))
        );
      }
    });

    return serverFields || [];
  }
}

export const customFieldRepository = new CustomFieldRepository();
