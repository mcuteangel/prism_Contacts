import { db } from './database';
import { supabase } from '../supabase';
import type { Group, GroupInsert, GroupUpdate } from '../types/supabase';
import { liveQuery } from 'dexie';
import { syncService } from './SyncService';
import { v4 as uuidv4 } from 'uuid';

class GroupRepository {
  getLiveGroups() {
    return liveQuery(() => db.groups.orderBy('name').toArray());
  }

  async addGroup(group: GroupInsert) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('کاربر احراز هویت نشده است.');

    const tempId = `temp_${uuidv4()}`;
    const newGroup: Group = {
      ...group,
      id: tempId,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await db.groups.add(newGroup as any);

    await syncService.addToQueue({
      entity: 'groups',
      type: 'CREATE',
      payload: { ...group, id: tempId, user_id: newGroup.user_id },
    });

    return tempId;
  }

  async updateGroup(id: string, updates: GroupUpdate) {
    const updatedAt = new Date().toISOString();
    await db.groups.update(id, { ...updates, updated_at: updatedAt });

    // اگر آیتم موقتی باشد، عملیات آپدیت آن در صف CREATE ادغام می‌شود
    if (id.startsWith('temp_')) {
      // Find the CREATE task in the queue and merge updates
      const create_task = await db.syncQueue
        .where('payload.id')
        .equals(id)
        .and((item) => item.type === 'CREATE' && item.entity === 'groups')
        .first();

      if (create_task && create_task.id) {
        const newPayload = { ...create_task.payload, ...updates };
        await db.syncQueue.update(create_task.id, { payload: newPayload });
      }
      return;
    }

    await syncService.addToQueue({
      entity: 'groups',
      type: 'UPDATE',
      payload: { ...updates, id, updated_at: updatedAt },
    });
  }

  async deleteGroup(id: string) {
    // اگر آیتم موقتی باشد و هنوز به سرور نرفته، هم خود آیتم و هم تسک آن از صف حذف می‌شود
    if (id.startsWith('temp_')) {
      await db.transaction('rw', db.groups, db.syncQueue, async () => {
        // Delete the item from local db
        await db.groups.delete(id);

        // Remove the corresponding CREATE task from the sync queue
        const taskToDelete = await db.syncQueue
          .where('payload.id')
          .equals(id)
          .and((item) => item.type === 'CREATE' && item.entity === 'groups')
          .first();

        if (taskToDelete && taskToDelete.id) {
          await db.syncQueue.delete(taskToDelete.id);
          console.log(`Removed pending CREATE task for temporary group ${id}`);
        }
      });
      return;
    }

    // For synced items, just mark for deletion
    await db.groups.delete(id);

    await syncService.addToQueue({
      entity: 'groups',
      type: 'DELETE',
      payload: { id },
    });
  }

  async syncWithSupabase() {
    console.log('در حال همگام‌سازی گروه‌ها با سرور...');
    try {
      const { data, error } = await supabase.from('groups').select('*');
      if (error) throw error;
      await db.groups.bulkPut(data as any);
      console.log(`تعداد ${data.length} گروه با موفقیت همگام‌سازی شدند.`);
      return data;
    } catch (error) {
      console.error('خطا در همگام‌سازی گروه‌ها:', error);
      throw error;
    }
  }
}

export const groupRepository = new GroupRepository();
