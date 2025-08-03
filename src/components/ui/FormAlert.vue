<template>
  <div class="px-4 py-3 rounded relative mb-4" :class="alertClasses" role="alert">
    <span class="block sm:inline">{{ message }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}>();

const alertClasses = computed(() => {
  const base = 'border';
  const typeMap = {
    success: 'bg-green-100 border-green-400 text-green-700',
    error: 'bg-red-100 border-red-400 text-red-700',
    warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
    info: 'bg-blue-100 border-blue-400 text-blue-700',
  };
  return `${base} ${typeMap[props.type]}`;
});
</script>
