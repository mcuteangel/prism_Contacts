<template>
  <div class="form-control">
    <label v-if="label" class="label">
      <span class="label-text">{{ label }}</span>
    </label>
    <input
      v-bind="$attrs"
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      :class="inputClasses"
      class="input input-bordered w-full"
    />
    <label v-if="errorMessage || $slots.help" class="label">
      <span v-if="errorMessage" class="label-text-alt text-error">{{ errorMessage }}</span>
      <span v-else-if="$slots.help" class="label-text-alt text-gray-500">
        <slot name="help"></slot>
      </span>
    </label>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  modelValue: [String, Number],
  label: String,
  required: {
    type: Boolean,
    default: false,
  },
  error: Boolean,
  errorMessage: String,
  state: {
    type: String,
    validator: (value: string) => ['', 'success', 'error', 'checking'].includes(value),
    default: '',
  },
});

const emit = defineEmits(['update:modelValue']);

const inputClasses = computed(() => {
  const classes = [];
  if (props.error) classes.push('input-error');
  if (props.state === 'success') classes.push('input-success');
  if (props.state === 'error') classes.push('input-error');
  return classes.join(' ');
});
</script>
