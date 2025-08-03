<template>
  <div
    class="glass p-4 rounded-lg h-full flex flex-col relative transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
    :class="{
      'cursor-pointer': !isSelectMode,
      'ring-2 ring-primary ring-offset-2 ring-offset-base-100': isSelected,
    }"
    @click="handleCardClick"
  >
    <input
      v-if="isSelectMode"
      type="checkbox"
      :checked="isSelected"
      class="checkbox checkbox-primary checkbox-sm absolute right-2 top-2 z-10"
      @change.stop="toggleSelection"
      @click.stop
    />
    <div
      class="flex items-start gap-4 mb-4"
      @click.self="!isSelectMode && $emit('edit', contact.id)"
    >
      <div
        class="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold"
      >
        {{ contact.firstName ? contact.firstName[0].toUpperCase() : '?' }}
      </div>
      <div class="flex-1 min-w-0">
        <h3 class="text-lg font-bold truncate">
          {{ contact.firstName }} {{ contact.lastName || '' }}
        </h3>
        <p class="text-gray-600 dark:text-gray-300">
          {{ contact.phoneNumbers?.[0] || 'بدون شماره' }}
        </p>
      </div>

      <div class="dropdown dropdown-end">
        <label tabindex="0" class="btn btn-ghost btn-sm btn-circle">
          <span class="iconify text-lg" data-icon="lucide:more-vertical" />
        </label>
        <ul
          tabindex="0"
          class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-40"
        >
          <li>
            <button class="text-right" @click.stop="$emit('edit', contact.id)">
              <span class="iconify mr-1" data-icon="lucide:edit" />
              ویرایش
            </button>
          </li>
          <li>
            <button class="text-right text-error" @click.stop="$emit('remove', contact.id)">
              <span class="iconify mr-1" data-icon="lucide:trash-2" />
              حذف
            </button>
          </li>
        </ul>
      </div>
    </div>

    <div v-if="contact.notes" class="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
      {{ contact.notes }}
    </div>

    <div v-if="contactGroupIds.length > 0" class="mt-3 flex flex-wrap gap-2">
      <span
        v-for="groupId in contactGroupIds"
        :key="groupId"
        class="badge badge-outline badge-sm"
        :style="{
          backgroundColor: groupsMap.get(groupId)?.color + '1a',
          borderColor: groupsMap.get(groupId)?.color,
          color: groupsMap.get(groupId)?.color,
        }"
      >
        {{ getGroupName(groupId) }}
      </span>
    </div>

    <div
      class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-sm"
    >
      <div class="flex items-center gap-1 text-gray-500">
        <span class="iconify" data-icon="lucide:clock" />
        <span>{{ formattedDate }}</span>
      </div>

      <div class="flex gap-2">
        <a
          v-if="contact.phoneNumbers && contact.phoneNumbers[0]"
          v-tooltip="'تماس'"
          :href="'tel:' + contact.phoneNumbers[0]"
          class="btn btn-ghost btn-sm btn-circle"
        >
          <span class="iconify text-lg" data-icon="lucide:phone" />
        </a>
        <a
          v-if="contact.phoneNumbers && contact.phoneNumbers[0]"
          v-tooltip="'پیام'"
          :href="'sms:' + contact.phoneNumbers[0]"
          class="btn btn-ghost btn-sm btn-circle"
        >
          <span class="iconify text-lg" data-icon="lucide:message-square" />
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';
import type { Contact } from '../types/supabase'; // Using our central types

// Define the group info type for the groups map
type GroupInfo = {
  name: string;
  color: string;
};

// --- Props ---
const props = defineProps({
  contact: {
    type: Object as PropType<Contact>,
    required: true,
  },
  groupsMap: {
    type: Map as PropType<Map<string, GroupInfo>>,
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
const emit = defineEmits<{
  (e: 'view', id: string): void;
  (e: 'edit', id: string): void;
  (e: 'remove', id: string): void;
  (e: 'toggle-selection', id: string): void;
}>();

// --- Computed Properties ---
const fullName = computed(() => {
  return (
    [props.contact.firstName, props.contact.lastName].filter(Boolean).join(' ') || 'مخاطب بی‌نام'
  );
});

const isSelected = computed(() => props.selectedContactIds.has(props.contact.id));

const contactGroupIds = computed(() => props.contact.groupIds?.filter(Boolean) || []);

const formattedDate = computed(() => {
  const dateString = props.contact.updatedAt || props.contact.createdAt;
  if (!dateString) return '';
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
});

// --- Methods ---
const getGroupName = (groupId: string): string => {
  return props.groupsMap.get(groupId)?.name || 'گروه حذف شده';
};

const getGroupStyle = (
  groupId: string
): { backgroundColor: string; borderColor: string; color: string } => {
  const color = props.groupsMap.get(groupId)?.color || '#cccccc';
  return {
    backgroundColor: `${color}20`, // 12.5% opacity
    borderColor: color,
    color: color,
  };
};

const toggleSelection = () => {
  emit('toggle-selection', props.contact.id);
};

const handleCardClick = () => {
  if (props.isSelectMode) {
    toggleSelection();
  } else {
    emit('view', props.contact.id);
  }
};
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
