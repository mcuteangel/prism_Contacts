<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click.self="handleClose"
      >
        <div class="bg-base-100 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
          <h3 class="text-lg font-bold mb-4">
            {{ title }}
          </h3>
          <p class="text-base-content/80">{{ message }}</p>

          <div v-if="errorMessage" class="mt-4 p-3 bg-error/10 text-error rounded-lg text-sm">
            <div class="flex items-center gap-2">
              <span class="iconify" data-icon="lucide:alert-circle" />
              <span>{{ errorMessage }}</span>
            </div>
          </div>

          <div class="modal-action mt-6 flex justify-end gap-2">
            <button class="btn btn-ghost" :disabled="isLoading" @click="handleCancel">
              {{ cancelButtonText }}
            </button>
            <button
              class="btn btn-error"
              :class="{ loading: isLoading }"
              :disabled="isLoading"
              @click="handleConfirm"
            >
              <span
                v-if="!isLoading && confirmButtonIcon"
                class="iconify mr-1"
                :data-icon="confirmButtonIcon"
              />
              {{ confirmButtonText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch } from 'vue';

const props = withDefaults(
  defineProps<{
    isOpen: boolean;
    title?: string;
    message: string;
    confirmButtonText?: string;
    confirmButtonIcon?: string;
    cancelButtonText?: string;
    isLoading?: boolean;
    errorMessage?: string | null;
  }>(),
  {
    title: 'تایید عملیات',
    confirmButtonText: 'تایید',
    confirmButtonIcon: 'lucide:check-circle',
    cancelButtonText: 'انصراف',
    isLoading: false,
    errorMessage: null,
  }
);

const emit = defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
  (e: 'update:isOpen', value: boolean): void;
}>();

watch(
  () => props.isOpen,
  (newVal, oldVal) => {
    if (newVal && !oldVal) {
      document.addEventListener('keydown', handleEscapeKey);
    } else if (!newVal && oldVal) {
      document.removeEventListener('keydown', handleEscapeKey);
    }
  }
);

const handleConfirm = () => {
  emit('confirm');
};

const handleCancel = () => {
  emit('cancel');
  closeModal();
};

const handleClose = () => {
  // Only close on backdrop click if not loading
  if (!props.isLoading) {
    handleCancel();
  }
};

const closeModal = () => {
  emit('update:isOpen', false);
  document.removeEventListener('keydown', handleEscapeKey);
};

const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.isOpen) {
    handleClose();
  }
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
