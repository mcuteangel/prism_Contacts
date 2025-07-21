// فایل مرکزی schema برای فیلدهای سفارشی
import { db } from './dexie';

export type CustomFieldType = 'text' | 'number' | 'date' | 'list';

export interface CustomFieldSchema {
  id: number;
  key: string; // کلید یکتا (مثلاً 'age')
  label: string; // برچسب قابل ویرایش توسط کاربر
  type: CustomFieldType; // نوع غیرقابل ویرایش پس از ساخت
}

// نمونه اولیه (قابل ویرایش توسط UI)
export const customFieldSchemas: CustomFieldSchema[] = [];

export async function loadCustomFieldSchemas() {
  const all = await db.customFieldSchemas.toArray();
  if (all.length) {
    customFieldSchemas.length = 0;
    customFieldSchemas.push(...all);
  }
}

export async function saveCustomFieldSchemas() {
  await db.customFieldSchemas.clear();
  await db.customFieldSchemas.bulkAdd(customFieldSchemas);
}
