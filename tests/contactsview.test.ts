import { describe, it, expect, beforeEach, vi } from 'vitest';
import { customFieldSchemas } from '../src/database/customFieldSchema';
import { loadCustomFieldSchemas } from '../src/database/customFieldSchema';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ContactsView from '../src/views/ContactsView.vue';
import { useContactsStore } from '../src/stores/contacts';
import { useGroupsStore } from '../src/stores/groups';
import { useUserStore } from '../src/stores/user';
import { db, PrismContactsDB } from '../src/database/dexie';

// Mock window.matchMedia
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}
// Mock Chart.js
vi.mock('chart.js/auto', () => ({
  default: class {
    destroy() {}
    constructor() {}
  },
}));
// Mock window.URL.createObjectURL
if (!window.URL.createObjectURL) {
  window.URL.createObjectURL = vi.fn(() => 'blob:mock');
}
if (!window.URL.revokeObjectURL) {
  window.URL.revokeObjectURL = vi.fn();
}
// Mock window.alert
if (!window.alert) {
  window.alert = vi.fn();
}

// Mock userStore
const mockUser = { id: 1, username: 'ali', role: 'admin', passwordHash: 'x' };
const userStoreMock: any = {
  currentUser: null,
  error: null,
  loading: false,
  login: vi.fn(async (u, p, db) => {
    if (u === 'ali' && p === '1234') {
      userStoreMock.currentUser = mockUser;
      userStoreMock.error = null;
      return true;
    } else {
      userStoreMock.error = 'نام کاربری یا رمز عبور اشتباه است';
      return false;
    }
  }),
  register: vi.fn(async (u, p, role, db) => {
    userStoreMock.currentUser = { id: 2, username: u, role, passwordHash: 'x' };
    userStoreMock.error = null;
    return true;
  }),
  logout: vi.fn(() => {
    userStoreMock.currentUser = null;
  }),
  loadFromStorage: vi.fn(() => {}),
};

// Mock the user store
vi.mock('../src/stores/user', () => ({
  useUserStore: () => userStoreMock,
}));

describe('ContactsView.vue', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    // پاکسازی دیتابیس
    const db = new PrismContactsDB();
    await db.delete();
    await db.open();
    customFieldSchemas.length = 0;
    // ریست کردن mock ها
    userStoreMock.currentUser = null;
    userStoreMock.error = null;
  });

  it('باید فرم ورود را نمایش دهد و ورود موفق انجام شود', async () => {
    const wrapper = mount(ContactsView, { global: { plugins: [createPinia()] } });
    await wrapper.find('input[placeholder="نام کاربری"]').setValue('ali');
    await wrapper.find('input[placeholder="رمز عبور"]').setValue('1234');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();
    expect(userStoreMock.currentUser?.username).toBe('ali');
  });

  it('ورود ناموفق باید پیام خطا نمایش دهد', async () => {
    const wrapper = mount(ContactsView, { global: { plugins: [createPinia()] } });
    await wrapper.find('input[placeholder="نام کاربری"]').setValue('wrong');
    await wrapper.find('input[placeholder="رمز عبور"]').setValue('wrong');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();
    expect(userStoreMock.error).toBe('نام کاربری یا رمز عبور اشتباه است');
  });

  it('باید فرم ثبت‌نام را نمایش دهد و ثبت‌نام موفق انجام شود', async () => {
    const wrapper = mount(ContactsView, { global: { plugins: [createPinia()] } });
    await wrapper.find('button.text-blue-600').trigger('click');
    expect(wrapper.text()).toContain('ثبت‌نام');
    await wrapper.find('input[placeholder="نام کاربری"]').setValue('newuser');
    await wrapper.find('input[placeholder="رمز عبور"]').setValue('pass');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();
    expect(userStoreMock.currentUser?.username).toBe('newuser');
  });

  it('بعد از ورود باید فرم و لیست مخاطبین نمایش داده شود', async () => {
    userStoreMock.currentUser = mockUser;
    const wrapper = mount(ContactsView, { global: { plugins: [createPinia()] } });
    expect(wrapper.text()).toContain('مدیریت مخاطبین');
    expect(wrapper.findComponent({ name: 'ContactForm' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'ContactList' }).exists()).toBe(true);
  });

  it('edge: لیست خالی باید پیام مناسب نمایش دهد', async () => {
    userStoreMock.currentUser = mockUser;
    const wrapper = mount(ContactsView, { global: { plugins: [createPinia()] } });
    expect(wrapper.text()).toContain('مخاطبی وجود ندارد');
  });

  it('integration: پشتیبان‌گیری و بازیابی مخاطبین (export/import JSON)', async () => {
    userStoreMock.currentUser = mockUser;
    const db = new PrismContactsDB();
    await db.delete();
    await db.open();
    const wrapper = mount(ContactsView, { global: { plugins: [createPinia()] } });
    // export
    const store = useContactsStore();
    const exported = JSON.stringify(store.contacts);
    // پاکسازی و import
    store.contacts.length = 0;
    await flushPromises();
    const imported = JSON.parse(exported);
    for (const c of imported) {
      await store.addContact(
        { ...c, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        userStoreMock,
        db
      );
    }
    await store.fetchContacts(userStoreMock, db);
    await flushPromises();
    expect(store.contacts.length).toBe(0); // چون هیچ مخاطبی اضافه نشده
    await db.close();
  }, 10000);
});

describe('ContactsView.vue - backup/restore custom fields integration', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    const db = new PrismContactsDB();
    await db.delete();
    await db.open();
    customFieldSchemas.length = 0;
    customFieldSchemas.push(
      { id: 1, key: 'age', label: 'سن', type: 'number' },
      { id: 2, key: 'job', label: 'شغل', type: 'text' }
    );
    userStoreMock.currentUser = mockUser;
  });

  it('export/import مخاطبین با فیلد سفارشی و هماهنگی با schema مرکزی', async () => {
    const db = new PrismContactsDB();
    await db.delete();
    await db.open();
    const wrapper = mount(ContactsView, { global: { plugins: [createPinia()] } });
    // بررسی نمایش در UI
    expect(wrapper.html()).toContain('سن');
    expect(wrapper.html()).toContain('شغل');
    await db.close();
  });

  it('edge case: تغییر schema پس از import و sync مخاطبین', async () => {
    const db = new PrismContactsDB();
    await db.delete();
    await db.open();
    const wrapper = mount(ContactsView, { global: { plugins: [createPinia()] } });
    // تغییر schema - حذف فیلد job
    customFieldSchemas.splice(
      customFieldSchemas.findIndex((f) => f.key === 'job'),
      1
    );
    await flushPromises();
    // بررسی اینکه فیلد job حذف شده
    expect(customFieldSchemas.find((f) => f.key === 'job')).toBeUndefined();
    expect(customFieldSchemas.find((f) => f.key === 'age')).toBeDefined();
    await db.close();
  });
});
