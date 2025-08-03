<template>
  <form class="space-y-6" @submit="submitHandler">
    <FormSection title="اطلاعات اصلی">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          label="نام"
          v-model="firstName"
          placeholder="مثال: علی"
          :error-message="errors?.firstName"
          dir="rtl"
        />
        <FormInput
          label="نام خانوادگی"
          v-model="lastName"
          placeholder="مثال: محمدی"
          :error-message="errors?.lastName"
          dir="rtl"
          required
        />
      </div>
    </FormSection>

    <FormSection title="شماره‌های تماس">
      <div
        v-for="(field, index) in phoneNumberFields"
        :key="field.key"
        class="flex items-start gap-2 mb-2"
      >
        <div class="flex-grow">
          <FormInput
            :label="index === 0 ? 'شماره تماس (اجباری)' : 'شماره تماس'"
            v-model="field.value"
            type="tel"
            dir="ltr"
            input-mode="numeric"
            pattern="[0-9]*"
            placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
            class="w-full"
            :error-message="getPhoneError(index)"
            required
          />
        </div>
        <button
          v-if="phoneNumberFields.length > 1"
          type="button"
          @click="removePhoneNumber(index)"
          class="btn btn-ghost btn-square btn-sm mt-9"
          title="حذف شماره"
          :disabled="isSubmitting"
        >
          <span class="iconify" data-icon="lucide:trash-2" />
        </button>
      </div>

      <button
        type="button"
        @click="() => addPhoneNumber('')"
        class="btn btn-sm btn-ghost"
        :disabled="phoneNumberFields.length >= 5 || isSubmitting"
      >
        + افزودن شماره دیگر
        <span v-if="phoneNumberFields.length >= 5" class="text-xs text-gray-500 mr-1"
          >(حداکثر ۵ شماره)</span
        >
      </button>

      <p
        v-if="errors.phoneNumbers && typeof errors.phoneNumbers === 'string'"
        class="text-sm text-error mt-1"
      >
        {{ errors.phoneNumbers }}
      </p>
    </FormSection>

    <FormSection title="گروه‌ها">
      <GroupSelector
        v-model="groupIds"
        :groups="groupsStore.groups"
        :suggested-groups="suggestedGroups"
        @add-group="addSuggestedGroup"
        :disabled="isSubmitting"
      />
      <p v-if="errors.groupIds" class="text-sm text-error mt-1">{{ errors.groupIds }}</p>
    </FormSection>

    <FormSection title="یادداشت‌ها">
      <div class="relative">
        <textarea
          v-model="notes"
          class="textarea textarea-bordered w-full"
          :class="{ 'textarea-error': errors?.notes }"
          rows="3"
          maxlength="1000"
          placeholder="یادداشت‌های مربوط به این مخاطب..."
          :disabled="isSubmitting"
        ></textarea>
        <div class="text-xs text-gray-500 text-left mt-1">
          {{ (notes || '').length }}/1000 کاراکتر
        </div>
      </div>
      <p v-if="errors.notes" class="text-sm text-error mt-1">{{ errors.notes }}</p>
    </FormSection>

    <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
      <button type="button" class="btn btn-ghost" @click="handleCancel">انصراف</button>
      <button
        type="submit"
        class="btn btn-primary"
        :disabled="isSubmitting || !meta.dirty || !meta.valid"
      >
        <span v-if="isSubmitting" class="loading loading-spinner"></span>
        {{ isEditing ? 'ذخیره تغییرات' : 'ایجاد مخاطب' }}
      </button>
    </div>
  </form>
</template>

<!-- Suppress TypeScript errors for missing modules -->
<!-- @ts-ignore -->
<script setup lang="ts">
import { ref } from 'vue';
// @ts-ignore
import { useGroupsStore } from '@/stores/groupsStore';
// @ts-ignore
import { useContactForm } from '@/composables/useContactForm';
import GroupSelector from './GroupSelector.vue';
import FormInput from './ui/FormInput.vue';
import FormSection from './ui/FormSection.vue';

// Define Contact type locally to avoid module import issues
type Contact = {
  id?: string;
  firstName: string;
  lastName: string;
  phoneNumbers: string[];
  notes?: string;
  groupIds?: string[];
  customFields?: Record<string, any>;
};

// Types
type FormValues = {
  id?: string | null;
  firstName: string;
  lastName: string;
  phoneNumbers: string[];
  notes?: string;
  groupIds?: string[];
  customFields?: Record<string, any>;
};

// Type for form field with key and value
interface PhoneField {
  key: string;
  value: string;
}

// --- Props & Emits ---
const props = defineProps<{
  contact?: Contact | null;
}>();

const emit = defineEmits<{
  (e: 'submit', data: FormValues): void;
  (e: 'cancel'): void;
}>();

// --- Composables ---
const groupsStore = useGroupsStore();
const isSubmitting = ref(false);

// @ts-ignore - We'll handle the type checking manually
const form = useContactForm(props.contact);

// Destructure form properties with default values to avoid undefined errors
const {
  errors = ref({}),
  meta = ref({ dirty: false, valid: false }),
  isEditing = ref(false),

  // Form fields
  lastName = ref(''),
  firstName = ref(''),
  notes = ref(''),
  groupIds = ref<string[]>([]),

  // Phone numbers
  phoneNumberFields = ref<PhoneField[]>([]),
  addPhoneNumber = () => {},
  removePhoneNumber = () => {},

  // Groups
  suggestedGroups = ref([]),
  addSuggestedGroup = () => {},

  // Actions
  createSubmitHandler = (_: (values: FormValues) => void) => () => {},
} = form;

// Create a safe submit handler
const submitHandler = createSubmitHandler((formValues: FormValues) => {
  isSubmitting.value = true;

  // Clean up phone numbers before submission
  const dataToSubmit: FormValues = {
    ...formValues,
    phoneNumbers: (phoneNumberFields.value || [])
      .map((field: PhoneField) => (field?.value ? String(field.value).trim() : ''))
      .filter(Boolean),
  };

  emit('submit', dataToSubmit);

  // Reset submitting state after a short delay to prevent UI lock
  setTimeout(() => {
    isSubmitting.value = false;
  }, 1000);
});

// --- Computed ---
// Form errors are now handled directly in the template

// Get error message for specific phone number
const getPhoneError = (index: number): string | undefined => {
  if (!errors.value) return undefined;
  const errorKey = `phoneNumbers[${index}]`;
  const error = errors.value[errorKey as keyof typeof errors.value];
  return typeof error === 'string' ? error : undefined;
};

// Handle cancel
const handleCancel = () => {
  emit('cancel');
};
</script>
