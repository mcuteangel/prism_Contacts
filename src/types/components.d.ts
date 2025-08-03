import type { Component } from 'vue';

declare module '*.vue' {
  const component: Component;
  export default component;
}

// Types for ContactForm component
declare module '../../components/ContactForm.vue' {
  import type { DefineComponent } from 'vue';

  export interface ContactFormData {
    firstName: string;
    lastName: string;
    phone: string;
    groupIds: number[];
    customFields: Record<string, any>;
    notes?: string;
  }

  export interface ContactFormProps {
    form: Omit<ContactFormData, 'groupIds'> & { groupIds?: number[] };
    groups: Array<{ id: number; name: string }>;
    errorMessage?: string;
    editingId?: number | null;
  }

  export interface PhoneValidation {
    state: 'valid' | 'error' | 'loading';
    message: string;
  }

  const component: DefineComponent<ContactFormProps>;
  export default component;
}

// Mock types for testing
declare module 'vitest' {
  interface MockInstance<T, Y extends any[]> {
    mockResolvedValue(value: T | PromiseLike<T>): this;
    mockResolvedValueOnce(value: T | PromiseLike<T>): this;
    mockRejectedValue(value: any): this;
    mockRejectedValueOnce(value: any): this;
  }
}
