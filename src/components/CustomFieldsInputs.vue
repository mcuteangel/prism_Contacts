<template>
  <div class="space-y-3">
    <div v-for="field in fieldSchemas" :key="field.key" class="flex gap-2 items-center">
      <label :for="`custom-${field.key}`" class="w-24 truncate">{{ field.label }}</label>

      <!-- Text Input -->
      <FormInput
        v-if="field.type === 'text' || !field.type"
        :id="`custom-${field.key}`"
        v-model="customFields[field.key]"
        type="text"
        class="flex-1"
      />

      <!-- Number Input -->
      <FormInput
        v-else-if="field.type === 'number'"
        :id="`custom-${field.key}`"
        v-model="customFields[field.key]"
        type="number"
        class="flex-1"
      />

      <!-- Date Input -->
      <FormInput
        v-else-if="field.type === 'date'"
        :id="`custom-${field.key}`"
        v-model="customFields[field.key]"
        type="date"
        class="flex-1"
      />

      <button
        v-if="!editing"
        type="button"
        class="btn btn-error btn-xs"
        @click="removeField(field.key)"
      >
        حذف
      </button>
    </div>

    <div v-if="fieldSchemas.length === 0" class="text-sm text-gray-500">
      هیچ فیلد سفارشی تعریف نشده است.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface CustomFieldSchema {
  key: string;
  label: string;
  type: string;
}

const props = defineProps<{
  modelValue: Record<string, any>;
  fieldSchemas: CustomFieldSchema[];
  editing?: boolean;
}>();

const emit = defineEmits(['update:modelValue']);

const customFields = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const removeField = (key: string) => {
  const newFields = { ...customFields.value };
  delete newFields[key];
  customFields.value = newFields;
};
</script>
