<template>
  <div class="p-4 bg-yellow-50 text-yellow-700 rounded-lg">
    <p class="font-medium">این قابلیت در حال بازنویسی و اتصال به Supabase است.</p>
    <p class="text-sm mt-1">به زودی با قابلیت‌های جدید در دسترس خواهد بود.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useContactsStore } from '../stores/contactsStore';
import stringSimilarity from 'string-similarity';

// Types
interface Contact {
  id: string;
  name: string;
  phoneNumbers?: string[];
  groupIds?: string[];
  customFields?: Record<string, any>;
  notes?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Group {
  id: string;
  name: string;
  color?: string;
}

type AnyGroup = Group & { [key: string]: any };
// Initialize store
const contactsStore = useContactsStore();

// This component will be implemented with the new store
</script>
