<template>
  <div class="space-y-2">
    <div v-if="suggestedGroups.length > 0" class="flex flex-wrap gap-2 items-center">
      <span class="text-xs text-blue-600">پیشنهاد گروه:</span>
      <FormButton
        v-for="group in suggestedGroups"
        :key="group.id"
        type="button"
        size="xs"
        variant="secondary"
        @click="emit('add-group', group.id)"
      >
        {{ group.name }}
      </FormButton>
    </div>

    <div class="form-control">
      <label for="groups" class="label">
        <span class="label-text">گروه‌ها</span>
      </label>
      <select id="groups" v-model="selectedGroup" class="select select-bordered w-full">
        <option
          v-for="group in allGroups"
          :key="group.id"
          :value="group.id"
          :disabled="group.id === '0' && selectedGroup !== '0'"
        >
          {{ group.name }}
        </option>
      </select>
      <label class="label">
        <span class="label-text-alt text-gray-500">
          برای انتخاب یک گروه، گزینه مورد نظر را انتخاب کنید
        </span>
      </label>
    </div>

    <div
      v-if="allGroups.length === 1 && allGroups[0].id === '0'"
      class="text-sm text-gray-500 p-2 bg-base-100 rounded"
    >
      هیچ گروهی یافت نشد. می‌توانید از بخش "مدیریت گروه‌ها" یک گروه جدید بسازید.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import FormButton from './ui/FormButton.vue';

// --- Type Definitions ---
interface Group {
  id: string;
  name: string;
}

const DEFAULT_GROUP: Group = { id: '0', name: 'بدون گروه' };

// --- Props ---
const props = withDefaults(
  defineProps<{
    modelValue: string[];
    groups: Group[];
    suggestedGroups?: Group[];
  }>(),
  {
    suggestedGroups: () => [],
  }
);

// --- Emits ---
const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void;
  (e: 'add-group', groupId: string): void;
}>();

// --- Computed Properties ---

// Combine provided groups with the default "No Group" option
const allGroups = computed(() => {
  if (props.groups && props.groups.length > 0) {
    const hasDefaultGroup = props.groups.some((g) => g.id === DEFAULT_GROUP.id);
    return hasDefaultGroup ? [...props.groups] : [DEFAULT_GROUP, ...props.groups];
  }
  return [DEFAULT_GROUP];
});

// Computed property to manage the v-model for the select element
const selectedGroup = computed({
  get: (): string => {
    // If no group is selected, return the ID of the default group
    return props.modelValue?.[0] || DEFAULT_GROUP.id;
  },
  set: (value: string) => {
    // If the user selects the default group, emit an empty array.
    // Otherwise, emit an array with the selected group's ID.
    // This component currently supports single group selection via dropdown.
    emit('update:modelValue', value === DEFAULT_GROUP.id ? [] : [value]);
  },
});
</script>
