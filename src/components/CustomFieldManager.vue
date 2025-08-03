<template>
  <div class="glass p-4 mb-6">
    <h2 class="font-bold mb-2">مدیریت فیلدهای سفارشی</h2>

    <form
      @submit.prevent="addField"
      class="flex items-end gap-2 mb-4 p-3 bg-base-200/50 rounded-lg"
    >
      <div class="form-control flex-grow">
        <label class="label"><span class="label-text">نام نمایشی فیلد</span></label>
        <input
          v-model="newField.label"
          type="text"
          placeholder="مثال: تاریخ تولد"
          class="input input-sm input-bordered w-full"
          required
        />
      </div>
      <div class="form-control">
        <label class="label"><span class="label-text">نوع فیلد</span></label>
        <select v-model="newField.type" class="select select-sm select-bordered">
          <option value="text">متن</option>
          <option value="number">عدد</option>
          <option value="date">تاریخ</option>
        </select>
      </div>
      <button type="submit" class="btn btn-sm btn-primary" :disabled="!newField.label.trim()">
        افزودن
      </button>
    </form>

    <div v-if="isLoading" class="text-center py-4">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else-if="schemas.length === 0" class="text-center text-gray-500 py-4">
      هنوز هیچ فیلد سفارشی ایجاد نشده است.
    </div>

    <div v-else>
      <ul class="space-y-2">
        <li
          v-for="field in schemas"
          :key="field.id"
          class="flex items-center gap-2 p-2 rounded hover:bg-base-200"
        >
          <span class="font-bold flex-1">{{ field.label }}</span>
          <span class="badge badge-ghost">{{ field.field_type }}</span>
          <button
            class="btn btn-ghost btn-xs text-error"
            @click="handleRemoveClick(field)"
            :disabled="isDeleting === field.id"
          >
            <span v-if="isDeleting === field.id" class="loading loading-spinner loading-xs"></span>
            <span v-else>حذف</span>
          </button>
        </li>
      </ul>
    </div>
  </div>

  <ConfirmationModal
    :is-open="showDeleteModal"
    title="تایید حذف فیلد"
    :message="`آیا از حذف فیلد '${fieldToDelete?.label}' اطمینان دارید؟ تمام داده‌های مرتبط با این فیلد در مخاطبین نیز حذف خواهد شد.`"
    confirm-button-text="حذف"
    :is-loading="!!(fieldToDelete && isDeleting === fieldToDelete.id)"
    @confirm="confirmDelete"
    @cancel="cancelDelete"
    @update:is-open="(value) => (showDeleteModal = value)"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useCustomFieldsSchemaStore } from '@/stores/customFieldsSchemaStore';
import type { CustomFieldSchema, CustomFieldSchemaInsert } from '@/types/supabase';
import ConfirmationModal from './ConfirmationModal.vue';

const customFieldsStore = useCustomFieldsSchemaStore();
const { schemas, isLoading } = storeToRefs(customFieldsStore);

const isDeleting = ref<string | null>(null);
const newField = ref<{ label: string; type: 'text' | 'number' | 'date' }>({
  label: '',
  type: 'text',
});

const showDeleteModal = ref(false);
const fieldToDelete = ref<CustomFieldSchema | null>(null);

onMounted(() => {
  if (schemas.value.length === 0) {
    customFieldsStore.sync();
  }
});

const addField = async () => {
  if (!newField.value.label.trim()) return;

  const schemaData: CustomFieldSchemaInsert = {
    label: newField.value.label.trim(),
    field_type: newField.value.type,
    is_active: true,
  };

  try {
    await customFieldsStore.addSchema(schemaData);
    newField.value = { label: '', type: 'text' };
  } catch (err) {
    console.error('خطا در اضافه کردن فیلد سفارشی:', err);
  }
};

const handleRemoveClick = (field: CustomFieldSchema) => {
  fieldToDelete.value = field;
  showDeleteModal.value = true;
};

const confirmDelete = async () => {
  if (!fieldToDelete.value) return;

  isDeleting.value = fieldToDelete.value.id;
  try {
    await customFieldsStore.deleteSchema(fieldToDelete.value.id);
  } catch (err) {
    console.error('خطا در حذف فیلد سفارشی:', err);
  } finally {
    isDeleting.value = null;
    showDeleteModal.value = false;
    fieldToDelete.value = null;
  }
};

const cancelDelete = () => {
  showDeleteModal.value = false;
  fieldToDelete.value = null;
};
</script>
