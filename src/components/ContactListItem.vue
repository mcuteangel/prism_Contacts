<template>
  <div
    class="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
    :class="{ 'cursor-pointer': !isSelectMode, 'bg-blue-50 dark:bg-blue-900/50': isSelected }"
    @click="handleItemClick"
  >
    <div class="flex items-center gap-4 flex-1 min-w-0">
      <input
        v-if="isSelectMode"
        type="checkbox"
        :checked="isSelected"
        class="checkbox checkbox-primary checkbox-sm"
        @change.stop="toggleSelection"
        @click.stop
      />
      <div
        class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold flex-shrink-0"
      >
        {{
          contact.firstName
            ? contact.firstName[0].toUpperCase()
            : contact.lastName
              ? contact.lastName[0].toUpperCase()
              : '?'
        }}
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-bold truncate text-gray-900 dark:text-white">
          {{ fullName }}
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{
            Array.isArray(contact.phoneNumbers) && contact.phoneNumbers.length > 0
              ? contact.phoneNumbers[0].number
              : 'بدون شماره'
          }}
        </p>
      </div>
    </div>

    <div class="hidden md:flex flex-wrap gap-1 mx-4">
      <span
        v-for="groupId in contactGroupIds"
        :key="groupId"
        class="badge badge-outline badge-sm"
        :style="getGroupStyle(groupId)"
      >
        {{ getGroupName(groupId) }}
      </span>
    </div>

    <div class="flex items-center gap-1">
      <router-link
        :to="`/contacts/${contact.id}`"
        @click.stop
        class="btn btn-ghost btn-xs btn-circle"
        title="مشاهده جزئیات"
      >
        <span class="iconify" data-icon="lucide:eye"></span>
      </router-link>
      <button
        @click.stop="$emit('edit', contact)"
        class="btn btn-ghost btn-xs btn-circle"
        title="ویرایش"
      >
        <span class="iconify" data-icon="lucide:edit-2"></span>
      </button>
      <button
        @click.stop="$emit('delete', contact)"
        class="btn btn-ghost btn-xs btn-circle text-error"
        title="حذف"
      >
        <span class="iconify" data-icon="lucide:trash-2"></span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';
import type { Contact, Group } from '../types/supabase';

// --- Props ---
const props = defineProps({
  contact: {
    type: Object as PropType<Contact>,
    required: true,
  },
  groupsMap: {
    type: Map as PropType<Map<string, Group>>,
    required: true,
  },
  isSelectMode: {
    type: Boolean,
    default: false,
  },
  selectedContactIds: {
    type: Set as PropType<Set<string>>,
    required: true,
  },
});

// --- Emits ---
const emit = defineEmits({
  edit: (contact: Contact) => true,
  delete: (contact: Contact) => true,
  select: (contact: Contact, isSelected: boolean) => true,
});

// --- Computed Properties ---
const fullName = computed(() => {
  return (
    [props.contact.firstName, props.contact.lastName].filter(Boolean).join(' ') || 'مخاطب بی‌نام'
  );
});

const isSelected = computed(() => props.selectedContactIds.has(props.contact.id));

const contactGroupIds = computed(() =>
  Array.isArray(props.contact.groupIds) ? props.contact.groupIds.filter(Boolean) : []
);

// --- Methods ---
const getGroupName = (groupId: string): string => {
  return props.groupsMap.get(groupId)?.name || 'گروه حذف شده';
};

const getGroupStyle = (
  groupId: string
): { backgroundColor: string; borderColor: string; color: string } => {
  const color = props.groupsMap.get(groupId)?.color || '#cccccc';
  return {
    backgroundColor: `${color}20`, // opacity
    borderColor: color,
    color: color,
  };
};

const toggleSelection = () => {
  emit('select', props.contact, !isSelected.value);
};

const handleItemClick = () => {
  if (props.isSelectMode) {
    toggleSelection();
  }
  // In non-select mode, clicking is handled by router-link
};
</script>
