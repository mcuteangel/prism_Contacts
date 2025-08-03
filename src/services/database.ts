import Dexie, { type Table } from 'dexie';
import type { Contact, Group, CustomFieldSchema, CustomField, Profile } from '../types/supabase';
import type { Session } from '@supabase/supabase-js';

// نوع داده برای آیتم‌های صف همگام‌سازی
export interface SyncQueueItem {
  id?: number;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'contacts' | 'groups' | 'custom_fields' | 'custom_field_schemas';
  payload: any;
  status: 'PENDING' | 'SYNCING' | 'FAILED';
  createdAt: Date;
  attempts: number;
  lastError?: string;
}

// +++ NEW: Type for storing auth state in Dexie +++
export interface AuthState {
  id: number; // Always 1, as it's a singleton state
  session: Session;
  profile: Profile;
  lastAuthenticated: Date;
}

export interface CustomFieldDB extends Omit<CustomField, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  needsSync?: boolean;
  isDeleted?: boolean;
  deletedAt?: Date | null;
}

export class LocalDatabase extends Dexie {
  // تعریف نوع جداول برای type-safety کامل
  contacts!: Table<Contact>;
  groups!: Table<Group>;
  customFieldSchemas!: Table<CustomFieldSchema>;
  customFields!: Table<CustomFieldDB>;
  syncQueue!: Table<SyncQueueItem>;
  auth_state!: Table<AuthState>; // +++ NEW: Auth state table +++ // جدول جدید برای صف همگام‌سازی

  constructor() {
    super('prismContactsDatabase'); // نام دیتابیس در مرورگر

    // Version 1 - Initial schema
    this.version(1).stores({
      contacts: '++id, lastName, firstName, *groupIds, createdAt, updatedAt',
      groups: '++id, name',
      customFieldSchemas: '++id, name, label',
    });

    // Version 2 - Add customFields table
    this.version(2).stores({
      contacts: '++id, lastName, firstName, *groupIds, createdAt, updatedAt',
      groups: '++id, name',
      customFieldSchemas: '++id, name, label',
      customFields: '++id, contactId, fieldName, [contactId+fieldName], needsSync, isDeleted',
    });

    // Version 3 - Add sync queue table
    this.version(3).stores({
      contacts: '++id, lastName, firstName, *groupIds, createdAt, updatedAt',
      groups: '++id, name',
      customFieldSchemas: '++id, name, label',
      customFields: '++id, contactId, fieldName, [contactId+fieldName], needsSync, isDeleted',
      syncQueue: '++id, status, entity, createdAt', // ایندکس برای پردازش سریع صف
    });

    // +++ NEW: Version 4 with auth_state table for offline-first auth ++
    this.version(4).stores({
      contacts: '++id, lastName, firstName, *groupIds, createdAt, updatedAt',
      groups: '++id, name',
      customFieldSchemas: '++id, name, label',
      customFields: '++id, contactId, fieldName, [contactId+fieldName], needsSync, isDeleted',
      syncQueue: '++id, status, entity, createdAt',
      auth_state: '&id', // Primary key for the singleton auth state
    });
  }
}

// یک نمونه از دیتابیس برای استفاده در کل برنامه
export const db = new LocalDatabase();
