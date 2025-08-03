<template>
  <div class="advanced-filter">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <h3 class="text-lg font-medium">فیلتر پیشرفته</h3>
        <button
          v-if="filters.length > 0"
          class="text-sm text-error hover:underline"
          @click="clearAllFilters"
        >
          حذف همه فیلترها
        </button>
      </div>

      <div class="dropdown dropdown-end">
        <label tabindex="0" class="btn btn-sm btn-ghost">
          <span class="iconify" data-icon="lucide:save"></span>
          ذخیره فیلتر
        </label>
        <div
          tabindex="0"
          class="dropdown-content z-[1] card card-compact w-64 p-2 shadow bg-base-100"
        >
          <div class="card-body">
            <h3 class="card-title text-sm">ذخیره فیلتر فعلی</h3>
            <div class="form-control">
              <input
                v-model="saveFilterName"
                type="text"
                placeholder="نام فیلتر"
                class="input input-bordered input-sm"
                @keyup.enter="saveFilter"
              />
            </div>
            <div class="flex items-center gap-2">
              <input
                id="default-filter"
                v-model="saveAsDefault"
                type="checkbox"
                class="checkbox checkbox-sm"
              />
              <label for="default-filter" class="text-sm">تنظیم به عنوان پیش‌فرض</label>
            </div>
            <div class="card-actions justify-end mt-2">
              <button class="btn btn-sm btn-primary" @click="saveFilter">ذخیره</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Saved and active filters -->
    <div class="mb-4 space-y-2">
      <!-- Saved filters -->
      <div v-if="savedFilters.length > 0" class="flex flex-wrap gap-2 mb-2">
        <div
          v-for="savedFilter in savedFilters"
          :key="savedFilter.id"
          class="dropdown dropdown-hover dropdown-top"
        >
          <div
            tabindex="0"
            class="badge gap-1 cursor-pointer"
            :class="{
              'badge-primary': activeSavedFilterId === savedFilter.id,
              'badge-outline': activeSavedFilterId !== savedFilter.id,
              'badge-accent': savedFilter.isDefault,
            }"
            @click="applySavedFilter(savedFilter)"
          >
            {{ savedFilter.name }}
            <span v-if="savedFilter.isDefault" class="iconify" data-icon="lucide:star" />
          </div>
          <ul
            tabindex="0"
            class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
          >
            <li @click="applySavedFilter(savedFilter)">
              <a>اعمال فیلتر</a>
            </li>
            <li @click="confirmDeleteFilter(savedFilter.id!)">
              <a class="text-error">حذف فیلتر</a>
            </li>
            <li v-if="!savedFilter.isDefault" @click="setAsDefault(savedFilter.id!)">
              <a>تنظیم به عنوان پیش‌فرض</a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Active filter tags -->
      <div v-if="filters.length > 0" class="flex flex-wrap gap-2">
        <div v-for="(filter, index) in filters" :key="index" class="badge badge-outline gap-1">
          <span>{{ getFilterLabel(filter) }}</span>
          <button class="text-gray-500 hover:text-error" @click="removeFilter(filter.field)">
            <span class="iconify" data-icon="lucide:x" />
          </button>
        </div>
      </div>
    </div>

    <!-- Add new filter -->
    <div class="grid grid-cols-12 gap-2 items-end">
      <div class="col-span-4">
        <label class="label label-text">فیلد</label>
        <select
          v-model="newFilter.field"
          class="select select-bordered w-full"
          @change="onFieldChange"
        >
          <option value="" disabled>انتخاب فیلد</option>
          <optgroup label="فیلدهای استاندارد">
            <option
              v-for="field in availableFields.filter((f) => !f.value.startsWith('custom.'))"
              :key="field.value"
              :value="field.value"
            >
              {{ field.label }}
            </option>
          </optgroup>
          <optgroup
            v-if="availableFields.some((f) => f.value.startsWith('custom.'))"
            label="فیلدهای سفارشی"
          >
            <option
              v-for="field in availableFields.filter((f) => f.value.startsWith('custom.'))"
              :key="field.value"
              :value="field.value"
            >
              {{ field.label }}
            </option>
          </optgroup>
        </select>
      </div>

      <div class="col-span-3">
        <label class="label label-text">عملگر</label>
        <select v-model="newFilter.operator" class="select select-bordered w-full">
          <option value="equals">مساوی با</option>
          <option value="contains">شامل</option>
          <option value="startsWith">شروع با</option>
          <option value="endsWith">پایان با</option>
          <option value="greaterThan">بزرگتر از</option>
          <option value="lessThan">کوچکتر از</option>
        </select>
      </div>

      <div class="col-span-4">
        <label class="label label-text">مقدار</label>
        <input
          v-model="newFilter.value"
          type="text"
          class="input input-bordered w-full"
          placeholder="مقدار فیلتر"
        />
      </div>

      <div class="col-span-1">
        <button
          class="btn btn-square btn-ghost"
          :disabled="!isValidFilter"
          title="افزودن فیلتر"
          @click="addFilter"
        >
          <span class="iconify" data-icon="lucide:plus" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useContactsStore } from '../stores/contactsStore';
import { useToast } from 'vue-toastification';

type FilterOperator =
  | 'equals'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan';

interface Filter {
  field: string;
  operator: FilterOperator;
  value: string | number | boolean;
}

const toast = useToast();

const contactsStore = useContactsStore();
const availableFields = ref<Array<{ value: string; label: string }>>([]);

// Saved filters state
const savedFilters = ref<
  Array<{
    id?: number;
    name: string;
    filters: Filter[];
    isDefault?: boolean;
    createdAt?: string;
  }>
>([]);

const activeSavedFilterId = ref<number | null>(null);
const saveFilterName = ref('');
const saveAsDefault = ref(false);
const isSaving = ref(false);

// New filter being composed
const newFilter = ref<Omit<Filter, 'value'> & { value: string }>({
  field: '',
  operator: 'contains',
  value: '',
});

// Get active filters from the store
const filters = computed(() => contactsStore.customFieldFilters);

// Check if the current filter is valid
const isValidFilter = computed(() => {
  return newFilter.value.field.trim() !== '' && newFilter.value.value.trim() !== '';
});

// Extract all available field names from contacts
const extractAvailableFields = () => {
  const standardFields = [
    { value: 'firstName', label: 'نام' },
    { value: 'lastName', label: 'نام خانوادگی' },
    { value: 'phoneNumbers', label: 'شماره تلفن‌ها' },
    { value: 'groupIds', label: 'گروه‌ها' },
    { value: 'notes', label: 'یادداشت‌ها' },
  ];

  // Extract custom fields from contacts
  const customFields = new Set<string>();
  contactsStore.contacts.forEach((contact: any) => {
    if (contact.customFields) {
      Object.keys(contact.customFields).forEach((field: string) => {
        customFields.add(field);
      });
    }
  });

  // Combine standard and custom fields
  const allFields = [
    ...standardFields,
    ...Array.from(customFields).map((field) => ({
      value: `custom.${field}`,
      label: `سفارشی: ${field}`,
    })),
  ];

  availableFields.value = allFields.sort((a, b) => a.label.localeCompare(b.label, 'fa'));
};

// Load saved filters
const loadSavedFilters = async () => {
  try {
    savedFilters.value = await contactsStore.fetchSavedFilters();
    // Apply default filter if exists
    const defaultFilter = savedFilters.value.find((f) => f.isDefault);
    if (defaultFilter && defaultFilter.id) {
      await applySavedFilter(defaultFilter);
    }
  } catch (error) {
    console.error('خطا در بارگذاری فیلترهای ذخیره شده:', error);
    toast.error('خطا در بارگذاری فیلترهای ذخیره شده');
  }
};

// Save current filter
const saveFilter = async () => {
  if (!saveFilterName.value.trim()) {
    toast.error('لطفا نامی برای فیلتر انتخاب کنید');
    return;
  }

  try {
    isSaving.value = true;
    await contactsStore.saveCurrentFilter(saveFilterName.value, saveAsDefault.value);
    toast.success('فیلتر با موفقیت ذخیره شد');
    saveFilterName.value = '';
    saveAsDefault.value = false;
    await loadSavedFilters();
  } catch (error) {
    console.error('خطا در ذخیره فیلتر:', error);
    toast.error('خطا در ذخیره فیلتر');
  } finally {
    isSaving.value = false;
  }
};

// Apply saved filter
const applySavedFilter = async (savedFilter: { id?: number; filters: Filter[] }) => {
  if (!savedFilter.id) return;

  try {
    await contactsStore.applySavedFilter(savedFilter.id);
    activeSavedFilterId.value = savedFilter.id;
    toast.success('فیلتر اعمال شد');
  } catch (error) {
    console.error('خطا در اعمال فیلتر:', error);
    toast.error('خطا در اعمال فیلتر');
  }
};

// Set filter as default
const setAsDefault = async (filterId: number) => {
  try {
    await contactsStore.setDefaultFilter(filterId);
    await loadSavedFilters();
    toast.success('فیلتر پیش‌فرض با موفقیت به‌روزرسانی شد');
  } catch (error) {
    console.error('خطا در تنظیم فیلتر پیش‌فرض:', error);
    toast.error('خطا در تنظیم فیلتر پیش‌فرض');
  }
};

// Confirm before deleting a filter
const confirmDeleteFilter = (filterId: number) => {
  if (confirm('آیا از حذف این فیلتر اطمینان دارید؟')) {
    deleteFilter(filterId);
  }
};

// Delete a saved filter
const deleteFilter = async (filterId: number) => {
  try {
    await contactsStore.deleteSavedFilter(filterId);
    if (activeSavedFilterId.value === filterId) {
      activeSavedFilterId.value = null;
    }
    await loadSavedFilters();
    toast.success('فیلتر با موفقیت حذف شد');
  } catch (error) {
    console.error('خطا در حذف فیلتر:', error);
    toast.error('خطا در حذف فیلتر');
  }
};

// Add a new filter
const addFilter = () => {
  if (!isValidFilter.value) return;

  let { field, operator, value } = newFilter.value;

  // Convert value to appropriate type
  let processedValue: string | number | boolean = value;
  if (!isNaN(Number(value))) {
    processedValue = Number(value);
  } else if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
    processedValue = value.toLowerCase() === 'true';
  }

  // Add prefix for custom fields
  const fieldName = field.startsWith('custom.') ? field.replace('custom.', '') : field;

  contactsStore.addCustomFieldFilter({
    field: fieldName,
    operator: operator,
    value: processedValue,
  });

  // Reset the form but keep the same field for convenience
  newFilter.value = {
    field: field,
    operator: 'contains',
    value: '',
  };
};

// Handle field type changes to adjust operator options if needed
const onFieldChange = () => {
  const field = newFilter.value.field;
  if (field === 'phoneNumbers' || field === 'groupIds' || field.startsWith('custom.')) {
    newFilter.value.operator = 'contains';
  }
};

// Remove a filter
const removeFilter = (fieldName: string) => {
  contactsStore.removeCustomFieldFilter(fieldName);
};

// Clear all filters
const clearAllFilters = () => {
  contactsStore.clearAllCustomFieldFilters();
};

// Get a human-readable label for a filter
const getFilterLabel = (filter: Filter) => {
  const operatorMap: Record<FilterOperator, string> = {
    equals: 'مساوی با',
    contains: 'شامل',
    startsWith: 'شروع با',
    endsWith: 'پایان با',
    greaterThan: 'بزرگتر از',
    lessThan: 'کوچکتر از',
  };

  // Get field label
  const fieldLabel =
    availableFields.value.find((f) => f.value === filter.field)?.label || filter.field;

  return `${fieldLabel} ${operatorMap[filter.operator]} "${filter.value}"`;
};

// Initialize component
onMounted(async () => {
  extractAvailableFields();
  await loadSavedFilters();
});

// Watch for changes in contacts to update available fields
watch(() => contactsStore.contacts, extractAvailableFields, { immediate: true });
</script>

<style scoped>
.advanced-filter {
  @apply bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-6;
}

.label {
  @apply p-0 mb-1 h-auto min-h-0;
}
</style>
