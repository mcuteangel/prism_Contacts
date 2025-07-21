import { db, type Contact } from '../database/dexie';

export const ContactService = {
  async getAll(): Promise<Contact[]> {
    return db.contacts.toArray();
  },
  async getById(id: number): Promise<Contact | undefined> {
    return db.contacts.get(id);
  },
  async add(contact: Contact): Promise<number> {
    const now = new Date().toISOString();
    return db.contacts.add({ ...contact, createdAt: now, updatedAt: now });
  },
  async update(contact: Contact): Promise<void> {
    if (!contact.id) return;
    await db.contacts.update(contact.id, { ...contact, updatedAt: new Date().toISOString() });
  },
  async remove(id: number): Promise<void> {
    await db.contacts.delete(id);
  },
  async search(query: string): Promise<Contact[]> {
    if (!query) return db.contacts.toArray();
    return db.contacts
      .filter(
        (c) =>
          c.name.includes(query) ||
          (c.phoneNumbers && c.phoneNumbers.some((p) => p.includes(query)))
      )
      .toArray();
  },
};
