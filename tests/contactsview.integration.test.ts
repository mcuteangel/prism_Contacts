import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { customFieldSchemas, loadCustomFieldSchemas } from '../src/database/customFieldSchema';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ContactsView from '../src/views/ContactsView.vue';
import { useContactsStore } from '../src/stores/contacts';
import { useUserStore } from '../src/stores/user';
import { PrismContactsDB } from '../src/database/dexie';

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

const mockUser = { id: 1, username: 'ali', role: 'admin' as const, passwordHash: 'x' };

let db: PrismContactsDB;

beforeEach(async () => {
  setActivePinia(createPinia());
  db = new PrismContactsDB();
  await db.delete();
  await db.open();
});
afterEach(async () => {
  await db.close();
});

describe('ContactsView.vue integration', () => {
  it('افزودن مخاطب جدید باید لیست را آپدیت کند', async () => {
    const wrapper = mount(ContactsView, { global: { plugins: [createPinia()] } });
    // مقداردهی userStore واقعی
    const userStore = useUserStore();
    userStore.currentUser = mockUser;
    await flushPromises();
    // افزودن مخاطب
    await wrapper
      .findComponent({ name: 'ContactForm' })
      .vm.$emit('submit', { name: 'علی', phone: '0912' });
    await flushPromises();
    const store = useContactsStore();
    await store.fetchContacts(userStore, db);
    await flushPromises();
    expect(store.contacts.length).toBe(1);
    expect(store.contacts[0].name).toBe('علی');
    expect(wrapper.text()).toContain('علی');
  });

  it('integration: پشتیبان‌گیری و بازیابی مخاطبین (export/import JSON)', async () => {
    const wrapper = mount(ContactsView, { global: { plugins: [createPinia()] } });
    const userStore = useUserStore();
    userStore.currentUser = mockUser;
    await flushPromises();
    // افزودن مخاطب
    await wrapper
      .findComponent({ name: 'ContactForm' })
      .vm.$emit('submit', { name: 'Sara', phone: '0935' });
    await flushPromises();
    // export
    const store = useContactsStore();
    const exported = JSON.stringify(store.contacts);
    // پاکسازی و import
    store.contacts.length = 0;
    await flushPromises();
    const imported = JSON.parse(exported);
    for (const c of imported)
      await store.addContact(
        { ...c, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        userStore,
        db
      );
    await flushPromises();
    await loadCustomFieldSchemas();
    await flushPromises();
    await store.fetchContacts(userStore, db);
    await flushPromises();
    await wrapper.vm.$forceUpdate();
    await flushPromises();
    expect(wrapper.text()).toContain('Sara');
  });

  // سایر تست‌های integration مشابه را نیز منتقل و اصلاح کن...
});
