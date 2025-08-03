import { ref, watch } from 'vue';
import { deepClone, isEqual } from './helpers';

export function useForm<T extends object>(initialData?: Partial<T>, defaults?: T) {
  const formData = ref<T>({ ...(defaults || ({} as T)), ...(initialData || {}) } as T);

  const initForm = (data?: Partial<T>) => {
    formData.value = { ...(defaults || ({} as T)), ...(data || {}) } as T;
  };

  const resetForm = () => {
    formData.value = { ...(defaults || ({} as T)) } as T;
  };

  const syncWith = (source: Partial<T>) => {
    if (!isEqual(formData.value, source)) {
      formData.value = deepClone({ ...formData.value, ...source });
    }
  };

  const syncCustomFields = (customFields: Record<string, any>) => {
    formData.value = {
      ...formData.value,
      customFields: {
        ...(formData.value as any).customFields,
        ...customFields,
      },
    };
  };

  return {
    formData,
    initForm,
    resetForm,
    syncWith,
    syncCustomFields,
  };
}
