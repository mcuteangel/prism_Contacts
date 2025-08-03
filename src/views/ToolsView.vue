<template>
  <div class="max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">ابزارها</h1>
    <div class="space-y-6">
      <section class="glass p-4 rounded-lg">
        <h2 class="font-bold mb-2 flex items-center gap-2">
          <span class="iconify" data-icon="lucide:import" /> ورود و خروجی مخاطبین
        </h2>
        <ContactImportExport />
      </section>
      <section class="glass p-4 rounded-lg">
        <h2 class="font-bold mb-2 flex items-center gap-2">
          <span class="iconify" data-icon="lucide:user-x2" /> بررسی مخاطبین تکراری
        </h2>
        <button class="btn btn-secondary" @click="showDuplicates = true">
          <span class="iconify mr-1" data-icon="lucide:search" /> بررسی تکراری‌ها
        </button>
        <DuplicateManager v-model:show-duplicates="showDuplicates" />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ContactImportExport from '../components/ContactImportExport.vue';
import DuplicateManager from '../components/DuplicateManager.vue';

const showDuplicates = ref(false);
</script>

<style scoped>
.btn {
  @apply px-3 py-1.5 rounded font-bold transition shadow-sm;
}
.btn-secondary {
  @apply bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700;
}
</style>
