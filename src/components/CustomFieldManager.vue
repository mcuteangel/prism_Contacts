<template>
  <div class="glass p-4 mb-6">
    <h2 class="font-bold mb-2">مدیریت فیلدهای سفارشی</h2>
    <ul class="mb-4">
      <li v-for="field in fields" :key="field.id" class="flex items-center gap-2 mb-2">
        <input v-model="field.label" class="input w-32" />
        <select :value="field.type" class="input w-28" disabled>
          <option value="text">متنی</option>
          <option value="number">عددی</option>
          <option value="date">تاریخ</option>
          <option value="list">لیستی</option>
        </select>
        <span class="text-xs text-gray-400">(نوع غیرقابل تغییر)</span>
        <button class="btn btn-error btn-xs" @click="removeField(field.id)">حذف</button>
      </li>
    </ul>
    <form class="flex gap-2 items-center" @submit.prevent="addField">
      <input v-model="newLabel" class="input w-32" placeholder="برچسب جدید" required />
      <select v-model="newType" class="input w-28" required>
        <option value="text">متنی</option>
        <option value="number">عددی</option>
        <option value="date">تاریخ</option>
        <option value="list">لیستی</option>
      </select>
      <button class="btn btn-primary btn-xs" type="submit">افزودن</button>
    </form>
    <div class="text-xs text-yellow-600 mt-2">
      نوع فیلد پس از ساخت قابل تغییر نیست. فقط برچسب را می‌توانید ویرایش کنید.
    </div>
    <div
      v-if="message"
      :class="['mt-2', 'text-xs', messageType === 'success' ? 'text-green-600' : 'text-red-600']"
    >
      {{ message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { customFieldSchemas } from '../database/customFieldSchema';
import { saveCustomFieldSchemas } from '../database/customFieldSchema';
import type { CustomFieldType } from '../database/customFieldSchema';

const fields = ref([...customFieldSchemas]);
const newLabel = ref('');
const newType = ref<CustomFieldType>('text');
const message = ref('');
const messageType = ref<'success' | 'error'>('success');

function showMessage(msg: string, type: 'success' | 'error' = 'success') {
  message.value = msg;
  messageType.value = type;
  setTimeout(() => (message.value = ''), 2000);
}

const addField = () => {
  const label = newLabel.value.trim();
  if (!label) {
    showMessage('برچسب نمی‌تواند خالی باشد', 'error');
    return;
  }
  const key = label.replace(/\s+/g, '_');
  if (fields.value.some((f) => f.key === key)) {
    showMessage('کلید تکراری است', 'error');
    return;
  }
  const id = Math.max(0, ...fields.value.map((f) => f.id)) + 1;
  const newField = {
    id,
    key,
    label,
    type: newType.value,
  };
  fields.value.push(newField);
  customFieldSchemas.push(newField);
  saveCustomFieldSchemas();
  showMessage('فیلد با موفقیت افزوده شد', 'success');
  newLabel.value = '';
  newType.value = 'text';
};

const removeField = (id: number) => {
  const idx = fields.value.findIndex((f) => f.id === id);
  if (idx !== -1) {
    fields.value.splice(idx, 1);
    const schemaIdx = customFieldSchemas.findIndex((f) => f.id === id);
    if (schemaIdx !== -1) customFieldSchemas.splice(schemaIdx, 1);
    saveCustomFieldSchemas();
    showMessage('فیلد حذف شد', 'success');
  }
};

watch(
  fields,
  (val, oldVal) => {
    for (const f of val) {
      const schema = customFieldSchemas.find((s) => s.id === f.id);
      if (schema && schema.label !== f.label) {
        if (!f.label.trim()) {
          showMessage('برچسب نمی‌تواند خالی باشد', 'error');
          f.label = schema.label;
          continue;
        }
        schema.label = f.label;
        saveCustomFieldSchemas();
        showMessage('برچسب با موفقیت ویرایش شد', 'success');
      }
    }
  },
  { deep: true }
);
</script>

<style scoped>
.input {
  @apply border rounded px-2 py-1 w-full bg-white/70 backdrop-blur text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 transition;
}
.btn {
  @apply px-3 py-1 rounded font-bold transition shadow-sm;
}
.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}
.btn-error {
  @apply bg-red-500 text-white hover:bg-red-600;
}
</style>
