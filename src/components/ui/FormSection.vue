<template>
  <div class="border rounded-lg p-4">
    <div class="flex justify-between items-center mb-4">
      <h3 class="font-bold text-lg">{{ title }}</h3>
      <div class="flex gap-2">
        <slot name="actions"></slot>
      </div>
    </div>
    <div class="space-y-4">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SlotsType } from 'vue';

defineProps({
  title: {
    type: String,
    required: true,
  },
});

defineSlots<{
  // Default slot for section content
  default: (props: {}) => any;
  // Actions slot for action buttons
  actions?: (props: {}) => any;
}>();
</script>
