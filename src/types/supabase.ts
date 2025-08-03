import { Database } from '@/types/supabase-generated';

// Helper types to extract Row and Enum types
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

// --- Profile Type ---
export interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  role?: 'user' | 'admin';
}

// --- Core Types based on DB Schema ---
export type Contact = Tables<'contacts'>;
export type Group = Tables<'groups'>;
export type CustomFieldSchema = Tables<'custom_field_schemas'>;
export type CustomField = Tables<'custom_fields'>;

// --- Insert and Update Types ---
// Contact Types
export type ContactInsert = Omit<Contact, 'id' | 'created_at' | 'updated_at' | 'user_id'> & {
  id?: string; // Optional ID for client-side generation
  user_id?: string;
};

export type ContactUpdate = Partial<
  Omit<Contact, 'id' | 'created_at' | 'updated_at' | 'user_id'>
> & {
  updated_at?: string; // Allow manual setting of updated_at for sync logic
};

// Group Types
export type GroupInsert = Omit<Group, 'id' | 'created_at' | 'updated_at' | 'user_id'> & {
  id?: string;
  user_id?: string;
};

export type GroupUpdate = Partial<Omit<Group, 'id' | 'created_at' | 'updated_at' | 'user_id'>> & {
  id: string;
  updated_at?: string;
};

// Custom Field Schema Types
export type CustomFieldSchemaInsert = Omit<
  CustomFieldSchema,
  'id' | 'created_at' | 'updated_at' | 'user_id'
> & {
  id?: string;
  user_id?: string;
};

export type CustomFieldSchemaUpdate = Partial<
  Omit<CustomFieldSchema, 'id' | 'created_at' | 'updated_at' | 'user_id'>
> & {
  id: string;
  updated_at?: string;
};

// Custom Field Types
export type CustomFieldInsert = Omit<
  CustomField,
  'id' | 'created_at' | 'updated_at' | 'user_id'
> & {
  id?: string;
  user_id?: string;
};

export type CustomFieldUpdate = Partial<
  Omit<CustomField, 'id' | 'created_at' | 'updated_at' | 'user_id'>
> & {
  id: string;
  updated_at?: string;
};

// Response types for API calls
export type ApiResponse<T> = {
  data: T | null;
  error: Error | null;
  status: number;
  statusText: string;
};

// Auth types
export type AuthResponse = {
  user: any | null;
  session: any | null;
  error: Error | null;
};

// Filter types
export type ContactFilter = {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'like' | 'ilike' | 'in';
  value: any;
};

export type SortOption = {
  field: keyof Contact;
  direction: 'asc' | 'desc';
};

// Real-time subscription types
export type RealtimeSubscription = {
  unsubscribe: () => void;
};

export type RealtimeCallback = (payload: any) => void;
