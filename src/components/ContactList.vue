<template>
  <ul>
    <li
      v-for="c in contacts"
      :key="c.id"
      class="glass p-3 mb-2 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-md hover:scale-[1.01] transition-transform"
    >
      <div class="flex flex-col sm:flex-row items-center gap-2">
        <span class="font-bold text-lg">{{ c.name }}</span>
        <span class="mx-2 text-gray-400 hidden sm:inline">|</span>
        <span class="text-gray-700">{{ c.phoneNumbers[0] }}</span>
        <span v-if="c.groupIds && c.groupIds.length" class="ml-2 flex flex-wrap gap-1">
          <span
            v-for="gid in c.groupIds"
            :key="gid"
            class="px-2 py-0.5 rounded bg-gray-200 text-xs text-gray-700"
          >
            {{ groupName(gid) }}
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
        <button
class="btn btn-warning btn-sm" @click="$emit('edit', c)">ویرایش</button>
        <button
class="btn btn-error btn-sm" @click="$emit('remove', c.id)">حذف</button>
      </div>
    </li>
  </ul>
  <div v-if="!contacts.length" class="text-center text-gray-400 py-4">مخاطبی وجود ندارد</div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, computed } from 'vue';
import { customFieldSchemas } from '../database/customFieldSchema';
const props = defineProps<{ contacts: any[]; groups: { id: number; name: string }[] }>();
defineEmits(['edit', 'remove']);
const groupName = (id: number) => props.groups.find((g) => g.id === id)?.name || '—';
const customFieldLabel = (key: string) => customFieldSchemas.find((f) => f.key === key)?.label || key;
const filteredCustomFields = (customFields: Record<string, any>) =>
  Object.entries(customFields ?? {}).filter(([key]) =>
    customFieldSchemas.some((f) => f.key === key)
  );
</script>
