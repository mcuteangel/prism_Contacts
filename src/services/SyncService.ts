import { db, type SyncQueueItem } from './database';
import { supabase } from '../supabase';
import { useNotificationStore } from '../stores/notificationStore';

class SyncService {
  private isProcessing = false;
  private syncInterval: number | null = null;
  private readonly SYNC_INTERVAL = 30000; // 30 ثانیه
  private readonly MAX_ATTEMPTS = 5;

  private get notificationStore() {
    // دریافت notificationStore در زمان استفاده
    return useNotificationStore();
  }

  constructor() {
    // شروع پردازش صف هنگام آنلاین شدن
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.processQueue());
    }
  }

  /**
   * افزودن یک عملیات به صف همگام‌سازی
   */
  async addToQueue(
    item: Omit<SyncQueueItem, 'id' | 'status' | 'createdAt' | 'attempts'>
  ): Promise<number | undefined> {
    try {
      const id = await db.syncQueue.add({
        ...item,
        status: 'PENDING',
        createdAt: new Date(),
        attempts: 0,
      });

      // شروع پردازش صف اگر آنلاین باشیم
      if (navigator.onLine) {
        this.processQueue();
      }

      return id;
    } catch (error) {
      console.error('خطا در افزودن به صف همگام‌سازی:', error);
      this.notificationStore.error('خطا در ثبت عملیات برای همگام‌سازی');
      return undefined;
    }
  }

  /**
   * پردازش آیتم‌های موجود در صف
   */
  async processQueue(): Promise<void> {
    // اگر در حال پردازش هستیم یا آنلاین نیستیم، خروج
    if (this.isProcessing || !navigator.onLine) {
      return;
    }

    this.isProcessing = true;

    try {
      // دریافت آیتم‌های در انتظار (به ترتیب قدیمی‌ترین)
      const itemsToSync = await db.syncQueue.where('status').equals('PENDING').sortBy('createdAt');

      if (itemsToSync.length === 0) {
        return;
      }

      // نمایش اعلان به کاربر
      this.notificationStore.info(`در حال همگام‌سازی ${itemsToSync.length} تغییر...`, 2000);

      // پردازش هر آیتم
      for (const item of itemsToSync) {
        if (!item.id) continue;

        try {
          // به‌روزرسانی وضعیت به "در حال پردازش"
          await db.syncQueue.update(item.id, {
            status: 'SYNCING',
            attempts: (item.attempts || 0) + 1,
          });

          let error = null;

          // انجام عملیات متناسب با نوع
          switch (item.type) {
            case 'CREATE':
              ({ error } = await supabase.from(item.entity).insert(item.payload).select().single());
              break;

            case 'UPDATE':
              ({ error } = await supabase
                .from(item.entity)
                .update(item.payload)
                .eq('id', item.payload.id));
              break;

            case 'DELETE':
              ({ error } = await supabase.from(item.entity).delete().eq('id', item.payload.id));
              break;
          }

          if (error) {
            throw error;
          }

          // در صورت موفقیت، آیتم را از صف حذف می‌کنیم
          await db.syncQueue.delete(item.id);
        } catch (err) {
          console.error(`خطا در پردازش آیتم ${item.id}:`, err);

          // به‌روزرسانی وضعیت به "ناموفق" در صورت رسیدن به حداکثر تلاش
          const attempts = (item.attempts || 0) + 1;
          const status = attempts >= this.MAX_ATTEMPTS ? 'FAILED' : 'PENDING';

          await db.syncQueue.update(item.id, {
            status,
            attempts,
            lastError: err instanceof Error ? err.message : String(err),
          });

          if (status === 'FAILED') {
            this.notificationStore.error(
              `عملیات همگام‌سازی پس از ${this.MAX_ATTEMPTS} بار تلاش ناموفق ماند`,
              5000
            );
          }
        }
      }

      this.notificationStore.success('تغییرات با موفقیت همگام‌سازی شدند.');
    } catch (error) {
      console.error('خطای ناشناخته در پردازش صف:', error);
      this.notificationStore.error('خطا در پردازش صف همگام‌سازی');
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * شروع سرویس همگام‌سازی
   */
  start(): void {
    console.log('سرویس همگام‌سازی فعال شد');

    // توقف اینتروال قبلی اگر وجود داشت
    if (this.syncInterval) {
      window.clearInterval(this.syncInterval);
    }

    // تنظیم اینتروال برای پردازش دوره‌ای صف
    this.syncInterval = window.setInterval(() => {
      if (navigator.onLine) {
        this.processQueue();
      }
    }, this.SYNC_INTERVAL);

    // اولین پردازش
    this.processQueue();
  }

  /**
   * توقف سرویس همگام‌سازی
   */
  stop(): void {
    if (this.syncInterval) {
      window.clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('سرویس همگام‌سازی متوقف شد');
    }
  }
}

// یک نمونه از سرویس برای استفاده در کل برنامه
export const syncService = new SyncService();

// فعال کردن سرویس به صورت خودکار در حالت توسعه
if (import.meta.env.DEV) {
  // @ts-ignore
  window.syncService = syncService;
}
