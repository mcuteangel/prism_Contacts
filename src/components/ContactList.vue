<template>
  <ul>
    <li
      v-for="c in contacts"
      :key="c.id"
      class="glass p-3 mb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-md hover:scale-[1.01] transition-transform relative"
    >
      <div class="flex flex-col sm:flex-row items-center gap-2 flex-1 relative">
        <div
          v-if="isSelectMode"
          class="absolute right-0 top-1/2 -translate-y-1/2 pr-2 flex items-center h-full"
          @click.stop
        >
          <input
            type="checkbox"
            :checked="selectedContactIds.has(c.id)"
            @change="emit('toggle-selection', c.id)"
            class="checkbox checkbox-sm"
          />
        </div>
        <router-link
          :to="`/contacts/${c.id}`"
          class="font-bold text-lg hover:underline hover:text-primary transition-colors pr-8"
        >
          {{ c.name }}
        </router-link>
        <span class="mx-2 text-gray-400 hidden sm:inline">|</span>
        <span class="text-gray-700">{{ c.phoneNumbers[0] }}</span>
        <span v-if="c.groupIds && c.groupIds.length" class="ml-2 flex flex-wrap gap-1">
          <span
            v-for="gid in c.groupIds"
            :key="gid"
            class="px-2 py-0.5 rounded bg-gray-200 text-xs text-gray-700"
          >
            {{ groupName(gid as string) }}
          </span>
        </span>
      </div>
      <div
        v-if="c.customFields && Object.keys(c.customFields).length"
        class="flex flex-wrap gap-2 mt-1 w-full"
      >
        <span
          v-for="[key, val] in filteredCustomFields(c.customFields)"
          :key="String(key)"
          class="bg-blue-50 text-blue-800 px-2 py-0.5 rounded text-xs"
        >
          {{ customFieldLabel(String(key)) }}: {{ val }}
        </span>
      </div>
      <div class="flex gap-2">
        <router-link
          :to="`/contacts/${c.id}`"
          class="btn btn-ghost btn-sm flex items-center gap-1"
          v-tooltip="'مشاهده جزئیات'"
        >
          <span class="iconify" data-icon="lucide:eye" />
        </router-link>
        <button
          class="btn btn-warning btn-sm flex items-center gap-1"
          @click="$emit('edit', c)"
          v-tooltip="'ویرایش'"
        >
          <span class="iconify" data-icon="lucide:edit-2" />
        </button>
        <button
          class="btn btn-error btn-sm flex items-center gap-1"
          @click="handleDeleteClick(c.id as string)"
          v-tooltip="'حذف'"
        >
          <span class="iconify" data-icon="lucide:trash-2" />
        </button>
      </div>
    </li>
  </ul>
  <div v-if="!contacts.length" class="text-center text-gray-400 py-4">مخاطبی وجود ندارد</div>
  <!-- Delete Confirmation Modal -->
  <ConfirmationModal
    v-model:isOpen="showDeleteModal"
    title="تایید حذف مخاطب"
    message="آیا از حذف این مخاطب اطمینان دارید؟ این عمل قابل بازگشت نیست."
    confirm-button-text="حذف"
    :is-loading="isDeleting"
    @confirm="confirmDelete"
    @cancel="cancelDelete"
  />
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, computed } from 'vue';
import type { PropType } from 'vue';

// Types
interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  phoneNumbers?: string[];
  groupIds?: string[];
  customFields?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

interface Group {
  id: string;
  name: string;
  color?: string;
}

// For backward compatibility with different group type definitions
type AnyGroup = Group & { [key: string]: any };

const props = defineProps({
  contacts: {
    type: Array as PropType<Contact[]>,
    required: true,
  },
  groups: {
    type: Array as PropType<Group[]>,
    default: () => [] as Group[],
  },
  customFieldLabels: {
    type: Object as PropType<Record<string, string>>,
    default: () => ({}),
  },
  isSelectMode: {
    type: Boolean,
    default: false,
  },
  selectedContactIds: {
    type: Set as unknown as PropType<Set<string>>,
    default: () => new Set<string>(),
  },
});

const emit = defineEmits(['toggle-selection', 'edit', 'remove']);

// Delete confirmation state
const showDeleteModal = ref(false);
const isDeleting = ref(false);
let contactToDelete: string | null = null;

const handleDeleteClick = (id: string) => {
  contactToDelete = id;
  showDeleteModal.value = true;
};

const confirmDelete = () => {
  if (contactToDelete !== null) {
    isDeleting.value = true;
    emit('remove', contactToDelete);
    // The modal will be closed when the parent component updates the contacts list
    // or after a short delay if the parent doesn't handle the promise
    setTimeout(() => {
      isDeleting.value = false;
      showDeleteModal.value = false;
    }, 1000);
  }
};

const cancelDelete = () => {
  showDeleteModal.value = false;
  contactToDelete = null;
  isDeleting.value = false;
};

const groupName = (id: string) => {
  const group = props.groups.find((g) => String(g.id) === String(id));
  return group ? group.name : '';
};

const customFieldLabel = (key: string) => props.customFieldLabels[key] || key;

const filteredCustomFields = (customFields: Record<string, any>) =>
  Object.entries(customFields ?? {}).filter(([key]) =>
    Object.keys(props.customFieldLabels).includes(key)
  );
</script>
