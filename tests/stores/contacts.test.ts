import { setActivePinia, createPinia, defineStore } from 'pinia';
import { describe, it, expect, beforeEach } from 'vitest';
import { PrismContactsDB } from '../../src/database/dexie';
import { customFieldSchemas } from '../../src/database/customFieldSchema';
import { nextTick } from 'vue';
import {
  loadCustomFieldSchemas,
  saveCustomFieldSchemas,
} from '../../src/database/customFieldSchema';

const now = new Date().toISOString();
const sampleContact = {
  name: 'علی',
  phoneNumbers: ['09120000000'],
  customFields: { age: 30 },
  createdAt: now,
  updatedAt: now,
};

const updatedContact = {
  ...sampleContact,
  name: 'رضا',
  customFields: { age: 31, city: 'تهران' },
};

function createMockUserStore() {
  return defineStore('user', {
    state: () => ({
      currentUser: { id: 1, username: 'test', role: 'admin' as const, passwordHash: '' },
      error: null,
      loading: false,
    }),
    actions: {
      loadFromStorage: () => {},
      login: async () => true,
      register: async () => true,
      logout: () => {},
    },
  })();
}

describe('Pinia Store: contacts', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    // پاکسازی دیتابیس و schema قبل از هر تست
    const db = new PrismContactsDB();
    await db.delete();
    await db.open();
    customFieldSchemas.length = 0;
  });

  it('افزودن مخاطب', async () => {
    const { useContactsStore } = await import('../../src/stores/contacts');
    const store = useContactsStore();
    const db = new PrismContactsDB();
    const userStore = createMockUserStore();
    await store.addContact(sampleContact, userStore, db);
    expect(store.contacts.length).toBe(1);
    expect(store.contacts[0].name).toBe('علی');
  });

  it('ویرایش مخاطب', async () => {
    const { useContactsStore } = await import('../../src/stores/contacts');
    const store = useContactsStore();
    const db = new PrismContactsDB();
    const userStore = createMockUserStore();
    // افزودن کلید city به schema
    customFieldSchemas.push({ id: 100, key: 'city', label: 'شهر', type: 'text' });
    await store.addContact(sampleContact, userStore, db);
    const contact = store.contacts[0];
    await store.updateContact({ ...contact, ...updatedContact }, db);
    await store.fetchContacts(userStore, db); // state sync
    const updatedFromDb = await db.contacts.get(contact.id!);
    expect(updatedFromDb?.name).toBe('رضا');
    expect(updatedFromDb?.customFields?.city).toBe('تهران');
    // پاکسازی schema
    customFieldSchemas.splice(
      customFieldSchemas.findIndex((f) => f.key === 'city'),
      1
    );
  });

  it('حذف مخاطب', async () => {
    const { useContactsStore } = await import('../../src/stores/contacts');
    const store = useContactsStore();
    const db = new PrismContactsDB();
    const userStore = createMockUserStore();
    await store.addContact(sampleContact, userStore, db);
    const contact = store.contacts[0];
    await store.deleteContact(contact.id!, db);
    expect(store.contacts.length).toBe(0);
  });

  it('مدیریت فیلد سفارشی', async () => {
    // مقداردهی مجدد schema برای اطمینان از اعتبار کلیدها
    customFieldSchemas.length = 0;
    customFieldSchemas.push(
      { id: 1, key: 'age', label: 'سن', type: 'number' },
      { id: 2, key: 'job', label: 'شغل', type: 'text' },
      { id: 3, key: 'birthday', label: 'تاریخ تولد', type: 'date' }
    );
    const { useContactsStore } = await import('../../src/stores/contacts');
    const store = useContactsStore();
    const db = new PrismContactsDB();
    const userStore = createMockUserStore();
    // افزودن کلید job به schema
    customFieldSchemas.push({ id: 101, key: 'job', label: 'شغل', type: 'text' });
    await store.addContact(sampleContact, userStore, db);
    const contact = store.contacts[0];
    expect(contact.customFields?.age).toBe(30);
    // مدیریت فیلد سفارشی
    const updatedContact1 = JSON.parse(
      JSON.stringify({
        id: contact.id,
        name: contact.name,
        phoneNumbers: [...contact.phoneNumbers],
        createdAt: contact.createdAt,
        updatedAt: new Date().toISOString(),
        customFields: { age: 40, job: 'برنامه‌نویس' },
      })
    );
    await store.updateContact(updatedContact1, db);
    await store.fetchContacts(userStore, db); // state sync
    const updatedFromDb = await db.contacts.get(contact.id!);
    expect(updatedFromDb?.customFields?.age).toBe(40);
    expect(updatedFromDb?.customFields?.job).toBe('برنامه‌نویس');
    // پاکسازی schema
    customFieldSchemas.splice(
      customFieldSchemas.findIndex((f) => f.key === 'job'),
      1
    );
  });

  it('ذخیره فقط فیلدهای معتبر بر اساس schema مرکزی', async () => {
    customFieldSchemas.length = 0;
    customFieldSchemas.push(
      { id: 1, key: 'age', label: 'سن', type: 'number' },
      { id: 2, key: 'birthday', label: 'تاریخ تولد', type: 'date' }
    );
    const { useContactsStore } = await import('../../src/stores/contacts');
    const store = useContactsStore();
    const db = new PrismContactsDB();
    const userStore = createMockUserStore();
    // فیلد معتبر و نامعتبر
    const contact = {
      name: 'Sara',
      phoneNumbers: ['09123334444'],
      customFields: {
        age: 25, // معتبر (در schema)
        city: 'تهران', // نامعتبر (در schema نیست)
        birthday: '1990-01-01', // معتبر (در schema)
        fake: ['1', '2', '3'], // نامعتبر (در schema نیست)
      },
      createdAt: now,
      updatedAt: now,
    };
    await store.addContact(contact, userStore, db);
    const saved = store.contacts[0];
    expect(saved.customFields?.age).toBe(25);
    expect(saved.customFields?.birthday).toBe('1990-01-01');
    expect(saved.customFields?.city).toBeUndefined();
    expect(saved.customFields?.fake).toBeUndefined();
  });

  it('ذخیره نشدن فیلد با type نامعتبر', async () => {
    customFieldSchemas.length = 0;
    customFieldSchemas.push(
      { id: 1, key: 'age', label: 'سن', type: 'number' },
      { id: 2, key: 'birthday', label: 'تاریخ تولد', type: 'date' }
    );
    const { useContactsStore } = await import('../../src/stores/contacts');
    const store = useContactsStore();
    const db = new PrismContactsDB();
    const userStore = createMockUserStore();
    // age باید number باشد اما string داده شده
    const contact = {
      name: 'Ali',
      phoneNumbers: ['09125556666'],
      customFields: {
        age: 'سی', // نامعتبر
        birthday: '1990-01-01', // معتبر
      },
      createdAt: now,
      updatedAt: now,
    };
    await store.addContact(contact, userStore, db);
    const saved = store.contacts[0];
    expect(saved.customFields?.birthday).toBe('1990-01-01');
    expect(saved.customFields?.age).toBeUndefined();
  });

  it('حذف فیلد سفارشی از مخاطب', async () => {
    customFieldSchemas.length = 0;
    customFieldSchemas.push(
      { id: 1, key: 'age', label: 'سن', type: 'number' },
      { id: 2, key: 'job', label: 'شغل', type: 'text' },
      { id: 3, key: 'birthday', label: 'تاریخ تولد', type: 'date' }
    );
    const { useContactsStore } = await import('../../src/stores/contacts');
    const store = useContactsStore();
    const db = new PrismContactsDB();
    const userStore = createMockUserStore();
    // افزودن کلیدهای age و birthday به schema
    customFieldSchemas.push({ id: 102, key: 'age', label: 'سن', type: 'number' });
    customFieldSchemas.push({ id: 103, key: 'birthday', label: 'تاریخ تولد', type: 'date' });
    await store.addContact(
      {
        name: 'Ali',
        phoneNumbers: ['09120000000'],
        customFields: { age: 30, birthday: '1990-01-01' },
        createdAt: now,
        updatedAt: now,
      },
      userStore,
      db
    );
    const contact = store.contacts[0];
    // حذف فیلد birthday
    // حذف فیلد سفارشی از مخاطب
    const updatedContact2 = JSON.parse(
      JSON.stringify({
        id: contact.id,
        name: contact.name,
        phoneNumbers: [...contact.phoneNumbers],
        createdAt: contact.createdAt,
        updatedAt: new Date().toISOString(),
        customFields: { age: 30 },
      })
    );
    await store.updateContact(updatedContact2, db);
    await store.fetchContacts(userStore, db);
    const updated = await db.contacts.get(contact.id!);
    expect(updated?.customFields?.birthday).toBeUndefined();
    expect(updated?.customFields?.age).toBe(30);
    // پاکسازی schema
    customFieldSchemas.splice(
      customFieldSchemas.findIndex((f) => f.key === 'age'),
      1
    );
    customFieldSchemas.splice(
      customFieldSchemas.findIndex((f) => f.key === 'birthday'),
      1
    );
  });

  it('مقداردهی undefined/null به فیلد سفارشی', async () => {
    customFieldSchemas.length = 0;
    customFieldSchemas.push(
      { id: 1, key: 'age', label: 'سن', type: 'number' },
      { id: 2, key: 'job', label: 'شغل', type: 'text' },
      { id: 3, key: 'birthday', label: 'تاریخ تولد', type: 'date' }
    );
    const { useContactsStore } = await import('../../src/stores/contacts');
    const store = useContactsStore();
    const db = new PrismContactsDB();
    const userStore = createMockUserStore();
    // افزودن کلید age به schema
    customFieldSchemas.push({ id: 104, key: 'age', label: 'سن', type: 'number' });
    await store.addContact(
      {
        name: 'Reza',
        phoneNumbers: ['09121112222'],
        customFields: { age: 28, birthday: '1992-01-01' },
        createdAt: now,
        updatedAt: now,
      },
      userStore,
      db
    );
    const contact = store.contacts[0];
    // حذف کلید age
    // مقداردهی undefined/null به فیلد سفارشی
    const updatedContact3 = JSON.parse(
      JSON.stringify({
        id: contact.id,
        name: contact.name,
        phoneNumbers: [...contact.phoneNumbers],
        createdAt: contact.createdAt,
        updatedAt: new Date().toISOString(),
        customFields: {},
      })
    );
    await store.updateContact(updatedContact3, db);
    await store.fetchContacts(userStore, db);
    const updated = await db.contacts.get(contact.id!);
    expect(updated?.customFields?.age).toBeUndefined();
    // پاکسازی schema
    customFieldSchemas.splice(
      customFieldSchemas.findIndex((f) => f.key === 'age'),
      1
    );
  });

  it('ویرایش مقدار فیلد سفارشی (تکراری)', async () => {
    customFieldSchemas.length = 0;
    customFieldSchemas.push(
      { id: 1, key: 'age', label: 'سن', type: 'number' },
      { id: 2, key: 'job', label: 'شغل', type: 'text' },
      { id: 3, key: 'birthday', label: 'تاریخ تولد', type: 'date' }
    );
    const { useContactsStore } = await import('../../src/stores/contacts');
    const store = useContactsStore();
    const db = new PrismContactsDB();
    const userStore = createMockUserStore();
    // افزودن کلید age به schema
    customFieldSchemas.push({ id: 105, key: 'age', label: 'سن', type: 'number' });
    await store.addContact(
      {
        name: 'Sara',
        phoneNumbers: ['09123334444'],
        customFields: { age: 20 },
        createdAt: now,
        updatedAt: now,
      },
      userStore,
      db
    );
    const contact = store.contacts[0];
    // ویرایش مقدار age
    // ویرایش مقدار فیلد سفارشی (تکراری)
    const updatedContact4 = JSON.parse(
      JSON.stringify({
        id: contact.id,
        name: contact.name,
        phoneNumbers: [...contact.phoneNumbers],
        createdAt: contact.createdAt,
        updatedAt: new Date().toISOString(),
        customFields: { age: 22 },
      })
    );
    await store.updateContact(updatedContact4, db);
    await store.fetchContacts(userStore, db);
    const updated = await db.contacts.get(contact.id!);
    expect(updated?.customFields?.age).toBe(22);
    // پاکسازی schema
    customFieldSchemas.splice(
      customFieldSchemas.findIndex((f) => f.key === 'age'),
      1
    );
  });

  it('افزودن مخاطب با داده مخرب (XSS)', async () => {
    const { useContactsStore } = await import('../../src/stores/contacts');
    const store = useContactsStore();
    const db = new PrismContactsDB();
    const userStore = createMockUserStore();
    await store.addContact(
      {
        name: '<script>alert(1)</script>',
        phoneNumbers: ['09124445555'],
        customFields: { age: 30 },
        createdAt: now,
        updatedAt: now,
      },
      userStore,
      db
    );
    const saved = store.contacts[0];
    // انتظار: داده ذخیره می‌شود اما در UI باید پاک‌سازی شود (اینجا فقط ذخیره را تست می‌کنیم)
    expect(saved.name).toContain('<script>');
  });

  it('افزودن مخاطب با مقدار بسیار بزرگ در فیلد سفارشی', async () => {
    const { useContactsStore } = await import('../../src/stores/contacts');
    const store = useContactsStore();
    const db = new PrismContactsDB();
    const userStore = createMockUserStore();
    const bigValue = 'a'.repeat(10000);
    await store.addContact(
      {
        name: 'BigField',
        phoneNumbers: ['09125556666'],
        customFields: { birthday: bigValue }, // birthday باید تاریخ باشد، این مقدار رد می‌شود
        createdAt: now,
        updatedAt: now,
      },
      userStore,
      db
    );
    const saved = store.contacts[0];
    expect(saved.customFields?.birthday).toBeUndefined();
  });

  it('افزودن مخاطب بدون گروه', async () => {
    customFieldSchemas.length = 0;
    customFieldSchemas.push({ id: 1, key: 'age', label: 'سن', type: 'number' });
    const { useContactsStore } = await import('../../src/stores/contacts');
    const store = useContactsStore();
    const db = new PrismContactsDB();
    const userStore = createMockUserStore();
    await store.addContact(
      {
        name: 'NoGroup',
        phoneNumbers: ['09127778888'],
        customFields: { age: 18 },
        createdAt: now,
        updatedAt: now,
      },
      userStore,
      db
    );
    const saved = store.contacts[0];
    expect(saved.groupIds).toBeUndefined();
    expect(saved.customFields?.age).toBe(18);
  });

  it('integration: افزودن و نمایش مخاطب در لیست', async () => {
    customFieldSchemas.length = 0;
    customFieldSchemas.push({ id: 1, key: 'age', label: 'سن', type: 'number' });
    const { useContactsStore } = await import('../../src/stores/contacts');
    const store = useContactsStore();
    const db = new PrismContactsDB();
    const userStore = createMockUserStore();
    // افزودن مخاطب (شبیه‌سازی فرم)
    await store.addContact(
      {
        name: 'TestUser',
        phoneNumbers: ['09120001111'],
        customFields: { age: 33 },
        createdAt: now,
        updatedAt: now,
      },
      userStore,
      db
    );
    // نمایش در لیست (state)
    expect(store.contacts.length).toBeGreaterThan(0);
    expect(store.contacts[0].name).toBe('TestUser');
    expect(store.contacts[0].customFields?.age).toBe(33);
  });

  it('integration: ویرایش مخاطب و مشاهده تغییرات در لیست', async () => {
    customFieldSchemas.length = 0;
    customFieldSchemas.push(
      { id: 1, key: 'age', label: 'سن', type: 'number' },
      { id: 2, key: 'job', label: 'شغل', type: 'text' },
      { id: 3, key: 'birthday', label: 'تاریخ تولد', type: 'date' }
    );
    const { useContactsStore } = await import('../../src/stores/contacts');
    const store = useContactsStore();
    const db = new PrismContactsDB();
    const userStore = createMockUserStore();
    // افزودن کلید age به schema
    customFieldSchemas.push({ id: 106, key: 'age', label: 'سن', type: 'number' });
    await store.addContact(
      {
        name: 'EditUser',
        phoneNumbers: ['09120002222'],
        customFields: { age: 40 },
        createdAt: now,
        updatedAt: now,
      },
      userStore,
      db
    );
    const contact = store.contacts[0];
    // integration: ویرایش مخاطب و مشاهده تغییرات در لیست
    const updatedContact5 = JSON.parse(
      JSON.stringify({
        id: contact.id,
        name: 'Edited',
        phoneNumbers: [...contact.phoneNumbers],
        createdAt: contact.createdAt,
        updatedAt: new Date().toISOString(),
        customFields: { age: 41 },
      })
    );
    await store.updateContact(updatedContact5, db);
    await store.fetchContacts(userStore, db);
    expect(store.contacts[0].name).toBe('Edited');
    expect(store.contacts[0].customFields?.age).toBe(41);
    // پاکسازی schema
    customFieldSchemas.splice(
      customFieldSchemas.findIndex((f) => f.key === 'age'),
      1
    );
  });

  it('migration: افزودن فیلد جدید به schema و مقداردهی مخاطب جدید', async () => {
    const { useContactsStore } = await import('../../src/stores/contacts');
    const store = useContactsStore();
    const db = new PrismContactsDB();
    const userStore = createMockUserStore();
    // افزودن مخاطب قبل از افزودن فیلد جدید
    await store.addContact(
      {
        name: 'OldUser',
        phoneNumbers: ['09120003333'],
        customFields: { age: 50 },
        createdAt: now,
        updatedAt: now,
      },
      userStore,
      db
    );
    // افزودن فیلد جدید به schema مرکزی
    customFieldSchemas.push({ id: 3, key: 'city', label: 'شهر', type: 'text' });
    // افزودن مخاطب جدید با فیلد جدید
    await store.addContact(
      {
        name: 'NewUser',
        phoneNumbers: ['09120004444'],
        customFields: { age: 28, city: 'تهران' },
        createdAt: now,
        updatedAt: now,
      },
      userStore,
      db
    );
    expect(store.contacts[1].customFields?.city).toBe('تهران');
    expect(store.contacts[0].customFields?.city).toBeUndefined();
  });

  it('migration: حذف فیلد از schema و بررسی رفتار مخاطبین جدید', async () => {
    const { useContactsStore } = await import('../../src/stores/contacts');
    const store = useContactsStore();
    const db = new PrismContactsDB();
    const userStore = createMockUserStore();
    // فرض: فیلد job در schema وجود دارد
    customFieldSchemas.push({ id: 4, key: 'company', label: 'شرکت', type: 'text' });
    await store.addContact(
      {
        name: 'User1',
        phoneNumbers: ['09120005555'],
        customFields: { age: 30, company: 'ACME' },
        createdAt: now,
        updatedAt: now,
      },
      userStore,
      db
    );
    // حذف فیلد company از schema
    const idx = customFieldSchemas.findIndex((f) => f.key === 'company');
    if (idx !== -1) customFieldSchemas.splice(idx, 1);
    await store.fetchContacts(userStore, db);
    // افزودن مخاطب جدید با company (نباید ذخیره شود)
    await store.addContact(
      {
        name: 'User2',
        phoneNumbers: ['09120006666'],
        customFields: { age: 22, company: 'Removed' },
        createdAt: now,
        updatedAt: now,
      },
      userStore,
      db
    );
    await store.fetchContacts(userStore, db);
    expect(store.contacts[1].customFields?.company).toBeUndefined();
    expect(store.contacts[0].customFields?.company).toBeUndefined(); // بعد از حذف schema، همه مخاطبین مقدار company را ندارند
  });

  it('performance: افزودن و واکشی تعداد زیاد مخاطب', async () => {
    const { useContactsStore } = await import('../../src/stores/contacts');
    const store = useContactsStore();
    const db = new PrismContactsDB();
    const userStore = createMockUserStore();
    const N = 500;
    const contacts = Array.from({ length: N }, (_, i) => ({
      name: `User${i}`,
      phoneNumbers: [`0912${i.toString().padStart(7, '0')}`],
      customFields: { age: i % 100 },
      createdAt: now,
      updatedAt: now,
    }));
    const t0 = performance.now();
    for (const c of contacts) {
      await store.addContact(c, userStore, db);
    }
    const t1 = performance.now();
    await store.fetchContacts(userStore, db);
    const t2 = performance.now();
    expect(store.contacts.length).toBeGreaterThanOrEqual(N);
    // log زمان اجرا (اختیاری)
    console.log(`Add: ${(t1 - t0).toFixed(0)}ms, Fetch: ${(t2 - t1).toFixed(0)}ms`);
  });

  it('integration: sync و پایداری schema فیلد سفارشی (افزودن/حذف/ویرایش و بارگذاری مجدد)', async () => {
    const { useContactsStore } = await import('../../src/stores/contacts');
    const store = useContactsStore();
    const db = new PrismContactsDB();
    const userStore = createMockUserStore();
    // پاکسازی اولیه
    await db.customFieldSchemas.clear();
    customFieldSchemas.length = 0;
    await loadCustomFieldSchemas();
    // افزودن فیلد جدید
    customFieldSchemas.push({ id: 10, key: 'testfield', label: 'تست', type: 'text' });
    await saveCustomFieldSchemas();
    customFieldSchemas.length = 0;
    await loadCustomFieldSchemas();
    await store.fetchContacts(userStore, db);
    expect(customFieldSchemas.some((f) => f.key === 'testfield')).toBe(true);
    // ویرایش label
    const field = customFieldSchemas.find((f) => f.key === 'testfield');
    if (field) field.label = 'تست ویرایش';
    await saveCustomFieldSchemas();
    customFieldSchemas.length = 0;
    await loadCustomFieldSchemas();
    await store.fetchContacts(userStore, db);
    expect(customFieldSchemas.find((f) => f.key === 'testfield')?.label).toBe('تست ویرایش');
    // حذف فیلد
    const idx = customFieldSchemas.findIndex((f) => f.key === 'testfield');
    if (idx !== -1) customFieldSchemas.splice(idx, 1);
    await saveCustomFieldSchemas();
    customFieldSchemas.length = 0;
    await loadCustomFieldSchemas();
    await store.fetchContacts(userStore, db);
    expect(customFieldSchemas.some((f) => f.key === 'testfield')).toBe(false);
  });
});

describe('migration: custom field schema', () => {
  beforeEach(async () => {
    customFieldSchemas.length = 0;
    const db = new PrismContactsDB();
    await db.delete();
    await db.open();
    customFieldSchemas.push(
      { id: 1, key: 'age', label: 'سن', type: 'number' },
      { id: 2, key: 'job', label: 'شغل', type: 'text' }
    );
  });

  it('افزودن فیلد جدید به schema و مقداردهی مخاطب جدید', async () => {
    const { useContactsStore } = await import('../../src/stores/contacts');
    const store = useContactsStore();
    const db = new PrismContactsDB();
    const userStore = createMockUserStore();
    // افزودن مخاطب قبل از افزودن فیلد جدید
    await store.addContact(
      {
        name: 'OldUser',
        phoneNumbers: ['09120003333'],
        customFields: { age: 50 },
        createdAt: now,
        updatedAt: now,
      },
      userStore,
      db
    );
    // افزودن فیلد جدید به schema مرکزی
    customFieldSchemas.push({ id: 3, key: 'city', label: 'شهر', type: 'text' });
    // افزودن مخاطب جدید با فیلد جدید
    await store.addContact(
      {
        name: 'NewUser',
        phoneNumbers: ['09120004444'],
        customFields: { age: 28, city: 'تهران' },
        createdAt: now,
        updatedAt: now,
      },
      userStore,
      db
    );
    expect(store.contacts[1].customFields?.city).toBe('تهران');
    expect(store.contacts[0].customFields?.city).toBeUndefined();
  });

  it('حذف فیلد از schema و بررسی رفتار مخاطبین جدید', async () => {
    const { useContactsStore } = await import('../../src/stores/contacts');
    const store = useContactsStore();
    const db = new PrismContactsDB();
    const userStore = createMockUserStore();
    // فرض: فیلد job در schema وجود دارد
    customFieldSchemas.push({ id: 4, key: 'company', label: 'شرکت', type: 'text' });
    await store.addContact(
      {
        name: 'User1',
        phoneNumbers: ['09120005555'],
        customFields: { age: 30, company: 'ACME' },
        createdAt: now,
        updatedAt: now,
      },
      userStore,
      db
    );
    // حذف فیلد company از schema
    const idx = customFieldSchemas.findIndex((f) => f.key === 'company');
    if (idx !== -1) customFieldSchemas.splice(idx, 1);
    await store.fetchContacts(userStore, db);
    // افزودن مخاطب جدید با company (نباید ذخیره شود)
    await store.addContact(
      {
        name: 'User2',
        phoneNumbers: ['09120006666'],
        customFields: { age: 22, company: 'Removed' },
        createdAt: now,
        updatedAt: now,
      },
      userStore,
      db
    );
    await store.fetchContacts(userStore, db);
    expect(store.contacts[1].customFields?.company).toBeUndefined();
    expect(store.contacts[0].customFields?.company).toBeUndefined(); // بعد از حذف schema، همه مخاطبین مقدار company را ندارند
  });
});
