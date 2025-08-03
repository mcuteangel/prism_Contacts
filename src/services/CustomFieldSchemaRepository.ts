import { db } from './database';
import { supabase } from '../supabase';
import type {
  CustomFieldSchema,
  CustomFieldSchemaInsert,
  CustomFieldSchemaUpdate,
} from '../types/supabase';
import { liveQuery } from 'dexie';
import { syncService } from './SyncService';
import { v4 as uuidv4 } from 'uuid';

// مدت زمان کش‌گذاری برای همگام‌سازی (5 دقیقه)
const SYNC_CACHE_DURATION = 5 * 60 * 1000;

class CustomFieldSchemaRepository {
  private lastSyncTimestamp: number | null = null;
  getLiveSchemas() {
    return liveQuery(() => db.customFieldSchemas.orderBy('label').toArray());
  }

  async addSchema(schema: CustomFieldSchemaInsert) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('کاربر احراز هویت نشده است.');

    const tempId = `temp_${uuidv4()}`;
    const newSchema: CustomFieldSchema = {
      ...schema,
      id: tempId,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await db.customFieldSchemas.add(newSchema);

    await syncService.addToQueue({
      entity: 'custom_field_schemas',
      type: 'CREATE',
      payload: { ...schema, id: tempId, user_id: newSchema.user_id },
    });
    return tempId;
  }

  async updateSchema(id: string, updates: CustomFieldSchemaUpdate) {
    const updatedAt = new Date().toISOString();
    await db.customFieldSchemas.update(id, { ...updates, updated_at: updatedAt });

    if (id.startsWith('temp_')) return;

    await syncService.addToQueue({
      entity: 'custom_field_schemas',
      type: 'UPDATE',
      payload: { ...updates, id, updated_at: updatedAt },
    });
  }

  async deleteSchema(id: string) {
    if (id.startsWith('temp_')) {
      await db.customFieldSchemas.delete(id);
      // TODO: حذف از صف
      return;
    }

    await db.customFieldSchemas.delete(id);

    await syncService.addToQueue({
      entity: 'custom_field_schemas',
      type: 'DELETE',
      payload: { id },
    });
  }

  async syncWithSupabase(force: boolean = false): Promise<boolean> {
    // بررسی کش و تصمیم‌گیری برای انجام یا عدم انجام همگام‌سازی
    const now = Date.now();
    if (!force && this.lastSyncTimestamp && now - this.lastSyncTimestamp < SYNC_CACHE_DURATION) {
      console.log('Custom field schemas sync skipped (cache is fresh).');
      return false; // اگر کش معتبر است، از همگام‌سازی مجدد خودداری می‌کنیم
    }

    console.log('Syncing custom field schemas...');
    try {
      const { data, error } = await supabase.from('custom_field_schemas').select('*');
      if (error) throw error;

      await db.customFieldSchemas.bulkPut(data);
      this.lastSyncTimestamp = now; // به‌روزرسانی زمان آخرین همگام‌سازی موفق

      console.log(`Synced ${data.length} schemas.`);
      return true;
    } catch (err) {
      console.error('Schema sync failed:', err);
      throw err;
    }
  }
}

export const customFieldSchemaRepository = new CustomFieldSchemaRepository();
