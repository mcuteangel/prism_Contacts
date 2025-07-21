import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismContactsDB } from '../src/database/dexie';
import { ContactService } from '../src/services/ContactService';

let db: PrismContactsDB;

const now = new Date().toISOString();
const sampleContact = {
  name: 'علی',
  phoneNumbers: ['09120000000'],
  createdAt: now,
  updatedAt: now,
};

describe('ContactService', () => {
  beforeEach(async () => {
    db = new PrismContactsDB('TestDB_' + Date.now() + '_' + Math.random());
    await db.delete();
    await new Promise((r) => setTimeout(r, 20));
    await db.open();
  });
  afterEach(async () => {
    if (db) await db.close();
  });

  it('افزودن و بازیابی مخاطب', async () => {
    const id = await ContactService.add(sampleContact);
    expect(typeof id).toBe('number');
    const contact = await ContactService.getById(id);
    expect(contact?.name).toBe('علی');
    expect(contact?.phoneNumbers[0]).toBe('09120000000');
  });

  it('ویرایش مخاطب', async () => {
    const id = await ContactService.add(sampleContact);
    await ContactService.update({ id, ...sampleContact, name: 'رضا' });
    const updated = await ContactService.getById(id);
    expect(updated?.name).toBe('رضا');
  });

  it('حذف مخاطب', async () => {
    const id = await ContactService.add(sampleContact);
    await ContactService.remove(id);
    const contact = await ContactService.getById(id);
    expect(contact).toBeUndefined();
  });

  it('جستجو مخاطب', async () => {
    await ContactService.add(sampleContact);
    await ContactService.add({ ...sampleContact, name: 'Sara', phoneNumbers: ['09123334444'] });
    const results = await ContactService.search('علی');
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('علی');
    const results2 = await ContactService.search('0912');
    expect(results2.length).toBeGreaterThanOrEqual(2);
  });

  it('getAll باید همه مخاطبین را برگرداند', async () => {
    await ContactService.add(sampleContact);
    await ContactService.add({ ...sampleContact, name: 'Sara', phoneNumbers: ['09123334444'] });
    const all = await ContactService.getAll();
    expect(all.length).toBeGreaterThanOrEqual(2);
  });

  it('update با id نامعتبر نباید خطا دهد', async () => {
    await expect(
      ContactService.update({ ...sampleContact, id: undefined })
    ).resolves.toBeUndefined();
  });

  it('migration: افزودن فیلد جدید به مخاطب', async () => {
    const id = await ContactService.add(sampleContact);
    // فرض: فیلد جدید notes اضافه شده
    await ContactService.update({ id, ...sampleContact, notes: 'یادداشت تستی' });
    const updated = await ContactService.getById(id);
    expect((updated as any).notes).toBe('یادداشت تستی');
  });

  it('edge: افزودن مخاطب با داده مخرب', async () => {
    const id = await ContactService.add({ ...sampleContact, name: '<script>alert(1)</script>' });
    const contact = await ContactService.getById(id);
    expect(contact?.name).toContain('<script>');
  });

  it('edge: حذف مخاطب ناموجود نباید خطا دهد', async () => {
    await expect(ContactService.remove(99999)).resolves.toBeUndefined();
  });

  it('performance: افزودن و واکشی تعداد زیاد مخاطب', async () => {
    const N = 200;
    for (let i = 0; i < N; i++) {
      await ContactService.add({ ...sampleContact, name: 'User' + i, phoneNumbers: ['0912' + i] });
    }
    const all = await ContactService.getAll();
    expect(all.length).toBeGreaterThanOrEqual(N);
  });
});
