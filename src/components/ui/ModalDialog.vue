<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  >
    <div class="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-bold">{{ title }}</h3>
        <button @click="closeModal" class="btn btn-sm btn-circle btn-ghost">&times;</button>
      </div>

      <div class="mb-6">
        <slot name="body"></slot>
      </div>

      <div class="flex justify-end gap-2">
        <slot name="actions"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue', 'close']);

const closeModal = () => {
  emit('update:modelValue', false);
  emit('close');
};

const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    closeModal();
  }
};

// Track if we've added the event listener
let isListenerAdded = false;

const addKeyListener = () => {
  if (!isListenerAdded) {
    document.addEventListener('keydown', handleEscape);
    isListenerAdded = true;
  }
};

const removeKeyListener = () => {
  if (isListenerAdded) {
    document.removeEventListener('keydown', handleEscape);
    isListenerAdded = false;
  }
};

// Add event listener when component is mounted
onMounted(() => {
  if (props.modelValue) {
    addKeyListener();
  }
});

// Clean up event listener when component is unmounted
onUnmounted(() => {
  removeKeyListener();
});

// Handle modelValue changes
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      addKeyListener();
    } else {
      removeKeyListener();
    }
  }
);
</script>
