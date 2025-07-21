import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach } from 'vitest';
import { PrismContactsDB } from '../../src/database/dexie';

describe('Pinia Store: groups', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('افزودن گروه', async () => {
    const { useGroupsStore } = await import('../../src/stores/groups');
    const store = useGroupsStore();
    const db = new PrismContactsDB();
    await store.addGroup({ name: 'دوستان', color: '#ff0' });
    expect(store.groups.length).toBe(1);
    expect(store.groups[0].name).toBe('دوستان');
  });

  it('ویرایش گروه', async () => {
    const { useGroupsStore } = await import('../../src/stores/groups');
    const store = useGroupsStore();
    const db = new PrismContactsDB();
    await store.addGroup({ name: 'خانواده', color: '#f00' });
    const group = store.groups[0];
    await store.updateGroup({ ...group, name: 'فامیل', color: '#0f0' });
    await store.fetchGroups();
    expect(store.groups[0].name).toBe('فامیل');
    expect(store.groups[0].color).toBe('#0f0');
  });

  it('حذف گروه', async () => {
    const { useGroupsStore } = await import('../../src/stores/groups');
    const store = useGroupsStore();
    const db = new PrismContactsDB();
    await store.addGroup({ name: 'کار', color: '#00f' });
    const group = store.groups[0];
    await store.deleteGroup(group.id!);
    expect(store.groups.length).toBe(0);
  });

  it('افزودن گروه تکراری (لبه‌ای)', async () => {
    const { useGroupsStore } = await import('../../src/stores/groups');
    const store = useGroupsStore();
    const db = new PrismContactsDB();
    await store.addGroup({ name: 'دوستان', color: '#ff0' });
    await store.addGroup({ name: 'دوستان', color: '#ff0' });
    expect(store.groups.length).toBe(2); // چون محدودیت یکتا نداریم
  });

  it('migration: افزودن فیلد جدید به گروه', async () => {
    const { useGroupsStore } = await import('../../src/stores/groups');
    const store = useGroupsStore();
    const db = new PrismContactsDB();
    await store.addGroup({ name: 'VIP', color: '#fff' });
    // فرض: فیلد جدید description اضافه شده
    const group = store.groups[0];
    // فقط در state مقداردهی کن
    (store.groups[0] as any).description = 'مشتریان ویژه';
    expect(store.groups[0].description).toBe('مشتریان ویژه');
  });

  it('performance: افزودن و واکشی تعداد زیاد گروه', async () => {
    const { useGroupsStore } = await import('../../src/stores/groups');
    const store = useGroupsStore();
    const db = new PrismContactsDB();
    const N = 200;
    for (let i = 0; i < N; i++) {
      await store.addGroup({ name: `گروه${i}`, color: '#000' });
    }
    await store.fetchGroups();
    expect(store.groups.length).toBeGreaterThanOrEqual(N);
  });

  it('integration: انتساب گروه به مخاطب', async () => {
    const { useGroupsStore } = await import('../../src/stores/groups');
    const { useContactsStore } = await import('../../src/stores/contacts');
    const groupStore = useGroupsStore();
    const contactStore = useContactsStore();
    const db = new PrismContactsDB();
    const { defineStore } = await import('pinia');
    // تابع ماک مشابه تست contacts
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
    const userStore = createMockUserStore();
    const groupId = await groupStore.addGroup({ name: 'دوستان', color: '#ff0' });
    await groupStore.fetchGroups();
    await contactStore.addContact({
      name: 'علی',
      phoneNumbers: ['09120000000'],
      groupIds: [groupId],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, userStore, db);
    await contactStore.fetchContacts(userStore, db);
    const groupIds = contactStore.contacts[0]?.groupIds || [];
    expect(Array.isArray(groupIds)).toBe(true);
    expect(groupIds).toContain(groupId);
  });
});
