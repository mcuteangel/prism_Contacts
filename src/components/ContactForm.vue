<template>
  <form class="flex flex-col gap-2 glass p-4 shadow-lg mb-6" @submit.prevent="onSubmit">
    <div class="flex flex-col sm:flex-row gap-2">
      <input
        v-model="localForm.name"
        type="text"
        placeholder="نام"
        class="input input-bordered flex-1"
        required
      />
      <input
        v-model="localForm.phone"
        type="text"
        placeholder="شماره تلفن"
        class="input input-bordered flex-1"
        required
      />
    </div>
    <div class="flex flex-col sm:flex-row gap-2">
      <select
        v-model="localForm.groupIds"
        multiple
        class="input flex-1"
        :size="Math.max(2, groups.length)"
      >
        <option v-for="g in groups" :key="g.id" :value="g.id">
          {{ g.name }}
        </option>
      </select>
      <span class="text-xs text-gray-500">(برای انتخاب چند گروه، Ctrl یا Cmd را نگه دارید)</span>
    </div>
    <div v-if="suggestedGroups.length"
class="mb-2 flex flex-wrap gap-2">
      <span class="text-xs text-blue-600">پیشنهاد گروه:</span>
      <button
        v-for="g in suggestedGroups"
        :key="g.id"
        type="button"
        class="btn btn-secondary btn-xs"
        @click="addSuggestedGroup(g.id)"
      >
        {{ g.name }}
      </button>
    </div>
    <div class="mb-2">
      <div class="flex items-center gap-2 mb-1">
        <span class="font-bold">فیلدهای سفارشی</span>
        <button type="button"
class="btn btn-primary btn-xs" @click="addCustomField">
          افزودن فیلد
        </button>
      </div>
      <div
        v-for="field in customFieldSchemas" :key="field.key" class="flex gap-2 mb-1 items-center">
        <label :for="'custom-' + field.key" class="w-24">{{ field.label }}</label>
        <input
          v-if="field.type === 'number'"
          :id="'custom-' + field.key"
          type="number"
          class="input input-bordered flex-1"
          v-model="localForm.customFields[field.key]"
        />
        <input
          v-else-if="field.type === 'text'"
          :id="'custom-' + field.key"
          type="text"
          class="input input-bordered flex-1"
          v-model="localForm.customFields[field.key]"
        />
        <input
          v-else-if="field.type === 'date'"
          :id="'custom-' + field.key"
          type="date"
          class="input input-bordered flex-1"
          v-model="localForm.customFields[field.key]"
        />
        <input
          v-else-if="field.type === 'list'"
          :id="'custom-' + field.key"
          type="text"
          class="input input-bordered flex-1"
          v-model="localForm.customFields[field.key]"
        />
        <button type="button"
class="btn btn-error btn-xs" @click="removeCustomField(field.key)">
          حذف
        </button>
      </div>
    </div>
    <div class="flex gap-2 justify-end">
      <button v-if="!editingId" type="submit" class="btn btn-primary">افزودن مخاطب</button>
      <button v-else type="submit" class="btn btn-success">ذخیره تغییرات</button>
      <button v-if="editingId"
type="button" class="btn btn-secondary" @click="$emit('cancel')">
        انصراف
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref, watch, onMounted, computed } from 'vue';
import { customFieldSchemas } from '../database/customFieldSchema';

const props = defineProps<{
  form: { name: string; phone: string; groupIds?: number[]; customFields?: Record<string, any> };
  editingId: number | null;
  groups: { id: number; name: string }[];
}>();
const emit = defineEmits(['submit', 'cancel']);

// مقداردهی اولیه localForm به صورت deep clone و تضمین groupIds و customFields:
function deepClone(obj: any) {
  return JSON.parse(JSON.stringify(obj));
}
function getInitialForm(form: any) {
  return {
    ...deepClone(form),
    groupIds: Array.isArray(form.groupIds) ? [...form.groupIds] : [],
    customFields: form.customFields ? { ...form.customFields } : {},
  };
}
const localForm = ref(getInitialForm(props.form));

// مقداردهی اولیه فیلدهای سفارشی بر اساس schema
function syncCustomFieldsWithSchema() {
  const fields = customFieldSchemas.map(f => f.key);
  localForm.value.customFields = localForm.value.customFields || {};
  // فقط فیلدهای موجود در schema را نگه دار
  Object.keys(localForm.value.customFields).forEach(key => {
    if (!fields.includes(key)) delete localForm.value.customFields[key];
  });
  // فیلدهای جدید را مقداردهی کن (اولویت: localForm > props.form > '')
  fields.forEach(key => {
    if (!(key in localForm.value.customFields)) {
      if (props.form.customFields && props.form.customFields[key] !== undefined) {
        localForm.value.customFields[key] = props.form.customFields[key];
      } else {
        localForm.value.customFields[key] = '';
      }
    }
  });
}

onMounted(() => {
  localForm.value = getInitialForm(props.form);
  syncCustomFieldsWithSchema();
});
watch(() => props.form, (newForm) => {
  localForm.value = getInitialForm(newForm);
  syncCustomFieldsWithSchema();
}, { deep: true });

const customFields = ref<{ key: string; type: 'text' | 'number' | 'date' | 'list'; value: any }[]>([]);

watch(
  () => props.form,
  (val) => {
    localForm.value = {
      ...val,
      groupIds: val.groupIds ? [...val.groupIds] : [],
      customFields: { ...val.customFields },
    };
    // مقداردهی فقط بر اساس schema مرکزی
    customFields.value = customFieldSchemas.map((schema) => {
      let value = val.customFields?.[schema.key];
      return { key: schema.key, type: schema.type, value: value ?? '' };
    });
  },
  { immediate: true }
);

watch(
  customFields,
  (fields) => {
    localForm.value.customFields = {};
    for (const f of fields) {
      localForm.value.customFields[f.key] = f.value;
    }
  },
  { deep: true }
);

const addCustomField = () => {
  // فقط افزودن فیلد جدید از طریق CustomFieldManager مجاز است
};
const removeCustomField = (key: string) => {
  delete localForm.value.customFields[key];
};

const onTypeChange = (idx: number) => {
  if (props.editingId !== null) {
    // بازگرداندن مقدار قبلی type
    const prevType = customFields.value[idx].type;
    customFields.value[idx].type = prevType;
    alert('تغییر نوع فیلد مجاز نیست. فقط می‌توانید نام را ویرایش کنید.');
  }
};

const suggestedGroups = computed(() => {
  const name = localForm.value.name.toLowerCase();
  const custom = Object.values(localForm.value.customFields || {}).map((v) =>
    String(v).toLowerCase()
  );
  return props.groups
    .filter((g) => {
      const gname = g.name.toLowerCase();
      return name.includes(gname) || custom.some((val) => val.includes(gname));
    })
    .filter((g) => !localForm.value.groupIds.includes(g.id));
});
const addSuggestedGroup = (id: number) => {
  if (!localForm.value.groupIds.includes(id)) localForm.value.groupIds.push(id);
};

const onSubmit = () => {
  // validation
  if (!localForm.value.name.trim()) return;
  if (!localForm.value.phone.trim()) return;
  if (!/^09\d{9}$/.test(localForm.value.phone)) return;

  emit('submit', {
    name: localForm.value.name,
    phone: localForm.value.phone,
    groupIds: localForm.value.groupIds,
    customFields: localForm.value.customFields,
  });
};
</script>
