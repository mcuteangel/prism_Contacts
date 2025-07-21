import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { CustomFieldSchema } from './customFieldSchema';

export interface Group {
  id?: number;
  name: string;
  color?: string;
}

export interface User {
  id?: number;
  username: string;
  passwordHash: string;
  role: 'admin' | 'user';
}

export interface Contact {
  id?: number;
  name: string;
  phoneNumbers: string[];
  gender?: 'male' | 'female' | 'other';
  notes?: string;
  customFields?: Record<string, string | number | Date | string[]>;
  avatar?: string; // base64
  createdAt: string; // Jalali date
  updatedAt: string; // Jalali date
  groupIds?: number[];
  userId?: number; // new: owner user
}

export class PrismContactsDB extends Dexie {
  contacts!: Table<Contact, number>;
  groups!: Table<Group, number>;
  users!: Table<User, number>;
  customFieldSchemas!: Table<CustomFieldSchema, number>;

  constructor(name: string = 'PrismContactsDB') {
    super(name);
    this.version(4).stores({
      contacts: '++id, name, createdAt, updatedAt, groupIds, userId',
      groups: '++id, name',
      users: '++id, username, role',
      customFieldSchemas: '++id, key',
    });
  }
}

export let db = new PrismContactsDB();
