// jest-dom و سایر ابزارها
import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';

// موک userStore
vi.mock('../../src/stores/user', () => ({
  useUserStore: () => ({
    currentUser: { id: 1, username: 'test', role: 'admin', passwordHash: '' },
    loadFromStorage: () => {},
  }),
}));

// موک db (Dexie)
let contactsData: any[] = [];
vi.mock('../../src/database/dexie', () => ({
  db: {
    contacts: {
      toArray: async () => contactsData,
      where: () => ({ equals: async () => contactsData }),
      add: async (contact: any) => {
        const id = contactsData.length + 1;
        contactsData.push({ ...contact, id });
        return id;
      },
      update: async (id: number, updated: any) => {
        const idx = contactsData.findIndex((c) => c.id === id);
        if (idx !== -1) contactsData[idx] = { ...contactsData[idx], ...updated };
      },
      delete: async (id: number) => {
        contactsData = contactsData.filter((c) => c.id !== id);
      },
    },
  },
  Contact: {} as any,
}));

beforeEach(() => {
  // دیتابیس fake-indexeddb را قبل هر تست ریست کن
  if (typeof indexedDB !== 'undefined' && indexedDB.databases) {
    indexedDB.databases().then((dbs) => {
      dbs.forEach((db) => indexedDB.deleteDatabase(db.name!));
    });
  }
}); 