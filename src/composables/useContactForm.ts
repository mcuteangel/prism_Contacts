// ===== IMPORTS & DEPENDENCIES =====
import { computed } from 'vue';
import { useForm, useFieldArray, useField } from 'vee-validate';
import { useGroupsStore } from '../stores/groupsStore';
import type { Contact, Group } from '../types/supabase';
import { deepClone } from './helpers';
import { validatePhoneNumber } from '@/utils/validators';

// ===== TYPES & INTERFACES =====
interface ContactFormValues {
  id: string | null;
  firstName: string;
  lastName: string;
  phoneNumbers: string[];
  notes?: string;
  groupIds?: string[];
  customFields?: Record<string, any>;
}

// ===== VALIDATION LOGIC =====

/**
 * A function-based validation schema for vee-validate.
 * This approach avoids issues with Zod adapters and gives us full control.
 */
const validationSchema = (values: ContactFormValues) => {
  const errors: Record<string, string> = {};

  // First Name validation
  if (!values.firstName) {
    errors.firstName = 'لطفا نام را وارد کنید';
  } else if (values.firstName.length < 2) {
    errors.firstName = 'نام باید حداقل ۲ کاراکتر باشد';
  } else if (values.firstName.length > 50) {
    errors.firstName = 'نام نمی‌تواند بیشتر از ۵۰ کاراکتر باشد';
  }

  // Last Name validation
  if (!values.lastName) {
    errors.lastName = 'لطفا نام خانوادگی را وارد کنید';
  } else if (values.lastName.length < 2) {
    errors.lastName = 'نام خانوادگی باید حداقل ۲ کاراکتر باشد';
  } else if (values.lastName.length > 100) {
    errors.lastName = 'نام خانوادگی نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد';
  }

  // Phone Numbers validation
  if (!values.phoneNumbers || values.phoneNumbers.length === 0) {
    errors.phoneNumbers = 'حداقل یک شماره تلفن الزامی است';
  } else if (values.phoneNumbers.length > 5) {
    errors.phoneNumbers = 'حداکثر ۵ شماره تلفن می‌توانید وارد کنید';
  } else {
    values.phoneNumbers.forEach((phone, index) => {
      if (!phone) {
        errors[`phoneNumbers[${index}]`] = 'شماره تلفن نمی‌تواند خالی باشد';
      } else {
        const phoneValidation = validatePhoneNumber(phone);
        if (!phoneValidation.isValid) {
          errors[`phoneNumbers[${index}]`] =
            'فرمت شماره تلفن معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹ یا ۹۸۹۱۲۳۴۵۶۷۸۹+)';
        }
      }
    });
  }

  // Notes validation
  if (values.notes && values.notes.length > 1000) {
    errors.notes = 'یادداشت نمی‌تواند بیشتر از ۱۰۰۰ کاراکتر باشد';
  }

  return errors;
};

// ===== COMPOSABLE FUNCTION =====

export function useContactForm(initialContact?: Contact | null) {
  // --- Stores ---
  const groupsStore = useGroupsStore();

  // --- Form Initialization ---
  const { handleSubmit, errors, values, meta, resetForm, setFieldValue } =
    useForm<ContactFormValues>({
      validationSchema,
      initialValues: {
        id: initialContact?.id || null,
        firstName: initialContact?.firstName || '',
        lastName: initialContact?.lastName || '',
        phoneNumbers: initialContact?.phoneNumbers?.length
          ? [...initialContact.phoneNumbers]
          : [''],
        notes: initialContact?.notes || '',
        groupIds: initialContact?.groupIds ? [...initialContact.groupIds] : [],
        customFields: deepClone(initialContact?.customFields || {}),
      },
    });

  // --- Field Definitions using useField ---
  const { value: firstName } = useField<string>('firstName');
  const { value: lastName } = useField<string>('lastName');
  const { value: notes } = useField<string>('notes');
  const { value: groupIds } = useField<string[]>('groupIds');

  const {
    fields: phoneNumberFields,
    remove: removePhoneNumber,
    push: addPhoneNumber,
  } = useFieldArray<string>('phoneNumbers');

  // --- Computed Properties ---
  const isEditing = computed(() => !!values.id);
  const hasChanges = computed(() => meta.value.dirty);

  const suggestedGroups = computed(() => {
    if (!initialContact?.groupIds) return [];
    const selectedGroupIds = new Set(values.groupIds || []);

    return (groupsStore.groups as Group[]).filter(
      (group) => initialContact.groupIds?.includes(group.id) && !selectedGroupIds.has(group.id)
    );
  });

  // --- Methods ---
  const addSuggestedGroup = (groupId: string) => {
    const currentGroupIds = values.groupIds || [];
    if (!currentGroupIds.includes(groupId)) {
      setFieldValue('groupIds', [...currentGroupIds, groupId]);
    }
  };

  const createSubmitHandler = (fn: (formData: ContactFormValues) => void) => {
    return handleSubmit(fn, ({ errors }) => {
      console.log('Validation Failed:', errors);
      // Optional: Add a toast notification for validation errors
    });
  };

  // Helper method to handle phone number field removal
  const handleRemovePhoneNumber = (index: number) => {
    if (phoneNumberFields.value.length > 1) {
      removePhoneNumber(index);
    } else {
      // If it's the last phone number, just clear it instead of removing
      const newPhoneNumbers = [...values.phoneNumbers];
      newPhoneNumbers[index] = '';
      setFieldValue('phoneNumbers', newPhoneNumbers);
    }
  };

  // Helper method to add a new phone number field
  const handleAddPhoneNumber = () => {
    if (values.phoneNumbers?.length < 5) {
      addPhoneNumber('');
    }
  };

  return {
    // Form state
    errors,
    values,
    meta,
    isEditing,
    hasChanges,

    // Fields
    firstName,
    lastName,
    notes,
    groupIds,

    // Phone numbers
    phoneNumbers: computed(() => values.phoneNumbers || []),
    phoneNumberFields,
    addPhoneNumber: handleAddPhoneNumber,
    removePhoneNumber: handleRemovePhoneNumber,

    // Groups
    suggestedGroups,
    addSuggestedGroup,

    // Actions
    createSubmitHandler,
    resetForm,
    setFieldValue,
  };
}
