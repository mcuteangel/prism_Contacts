<template>
  <ul>
    <li v-for="c in contacts" :key="c.id" class="glass p-3 mb-2 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-md hover:scale-[1.01] transition-transform">
      <div class="flex flex-col sm:flex-row items-center gap-2">
        <span class="font-bold text-lg">{{ c.name }}</span>
        <span class="mx-2 text-gray-400 hidden sm:inline">|</span>
        <span class="text-gray-700">{{ c.phoneNumbers[0] }}</span>
        <span v-if="c.groupIds && c.groupIds.length" class="ml-2 flex flex-wrap gap-1">
          <span v-for="gid in c.groupIds" :key="gid" class="px-2 py-0.5 rounded bg-gray-200 text-xs text-gray-700">
            {{ groupName(gid) }}
          </span>
        </span>
      </div>
      <div v-if="c.customFields && Object.keys(c.customFields).length" class="flex flex-wrap gap-2 mt-1 w-full">
        <span v-for="(val, key) in c.customFields" :key="key" class="bg-blue-50 text-blue-800 px-2 py-0.5 rounded text-xs">
          {{ key }}: {{ val }}
        </span>
      </div>
      <div class="flex gap-2">
        <button @click="$emit('edit', c)" class="btn btn-warning btn-sm">ویرایش</button>
        <button @click="$emit('remove', c.id)" class="btn btn-error btn-sm">حذف</button>
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
const props = defineProps<{ contacts: any[], groups: { id: number, name: string }[] }>()
defineEmits(['edit', 'remove'])
const groupName = (id: number) => props.groups.find(g => g.id === id)?.name || '—'
</script> 