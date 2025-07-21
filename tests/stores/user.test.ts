import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismContactsDB } from '../../src/database/dexie';
import * as dexieModule from '../../src/database/dexie';

describe('Pinia Store: user', () => {
  let db: PrismContactsDB;
  let store: ReturnType<Awaited<ReturnType<typeof import('../../src/stores/user')['useUserStore']>>>;
  beforeEach(async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    localStorage.clear();
    db = new PrismContactsDB('TestDB_' + Date.now() + '_' + Math.random());
    await db.delete();
    await new Promise((r) => setTimeout(r, 20));
    await db.open();
    const { useUserStore } = await import('../../src/stores/user');
    store = useUserStore();
  });
  afterEach(async () => {
    if (db) await db.close();
    if (store) store.$reset();
  });

  it('ثبت‌نام کاربر جدید', async () => {
    await db.open();
    const usersBefore = await db.users.toArray();
    console.log('users before register:', usersBefore);
    console.log('قبل از register:', store.currentUser, store.error);
    const result = await store.register('ali', '1234', 'admin', db);
    console.log('بعد از register:', result, store.currentUser, store.error);
    const usersAfter = await db.users.toArray();
    console.log('users after register:', usersAfter);
    expect(result).toBe(true);
    expect(store.currentUser?.username).toBe('ali');
    expect(store.currentUser?.role).toBe('admin');
    const userFromDb = await db.users.where('username').equals('ali').first();
    expect(userFromDb).toBeTruthy();
  });

  it('ثبت‌نام با نام کاربری تکراری (لبه‌ای)', async () => {
    await store.register('reza', 'pass', 'user', db);
    const result = await store.register('reza', 'pass', 'user', db);
    expect(result).toBe(false);
    expect(store.error).toContain('قبلاً ثبت شده');
  });

  it('ورود موفق کاربر', async () => {
    await store.register('sara', 'pass', 'user', db);
    console.log('قبل از login:', store.currentUser, store.error);
    const result = await store.login('sara', 'pass', db);
    console.log('بعد از login:', result, store.currentUser, store.error);
    expect(result).toBe(true);
    expect(store.currentUser?.username).toBe('sara');
    expect(store.error).toBeNull();
  });

  it('ورود با رمز اشتباه (لبه‌ای)', async () => {
    await store.register('mina', 'pass', 'user', db);
    const result = await store.login('mina', 'wrong', db);
    expect(result).toBe(false);
    expect(store.currentUser).toBeNull();
    expect(store.error).toContain('اشتباه');
  });

  it('ورود با نام کاربری ناموجود (لبه‌ای)', async () => {
    const result = await store.login('ghost', '1234', db);
    expect(result).toBe(false);
    expect(store.currentUser).toBeNull();
    expect(store.error).toContain('اشتباه');
  });

  it('خروج کاربر', async () => {
    await store.register('amir', 'pass', 'user', db);
    store.logout();
    expect(store.currentUser).toBeNull();
    expect(localStorage.getItem('currentUser')).toBeNull();
  });

  it('بارگذاری کاربر از localStorage', async () => {
    await store.register('nima', 'pass', 'user', db);
    const data = localStorage.getItem('currentUser');
    store.currentUser = null;
    expect(store.currentUser).toBeNull();
    localStorage.setItem('currentUser', data!);
    store.loadFromStorage(db);
    expect(store.currentUser?.username).toBe('nima');
  });

  it('migration: افزودن فیلد جدید به مدل کاربر', async () => {
    await store.register('mohsen', 'pass', 'user', db);
    (store.currentUser as any).bio = 'توسعه‌دهنده';
    expect((store.currentUser as any).bio).toBe('توسعه‌دهنده');
  });

  it('performance: ثبت‌نام و ورود تعداد زیاد کاربر', async () => {
    const N = 200;
    for (let i = 0; i < N; i++) {
      await store.register('user' + i, 'p' + i, 'user', db);
    }
    for (let i = 0; i < N; i++) {
      const result = await store.login('user' + i, 'p' + i, db);
      expect(result).toBe(true);
      expect(store.currentUser?.username).toBe('user' + i);
    }
    const users = await db.users.toArray();
    expect(users.length).toBeGreaterThanOrEqual(N);
  });
}); 