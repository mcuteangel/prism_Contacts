<template>
  <div class="max-w-3xl mx-auto">
    <header class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">افزودن مخاطب جدید</h1>
      <button class="btn btn-ghost" @click="$router.back()">
        <span class="iconify" data-icon="lucide:arrow-left" />
        بازگشت
      </button>
    </header>

    <ContactForm @submit="handleCreateContact" @cancel="$router.back()" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useContactsStore } from '../stores/contactsStore';
import { useGroupsStore } from '../stores/groupsStore';
import type { ContactInsert } from '../types/supabase';
import ContactForm from '../components/ContactForm.vue';

// --- Composables & Stores ---
const router = useRouter();
const contactsStore = useContactsStore();
const groupsStore = useGroupsStore();

// --- Methods ---
const handleCreateContact = async (
  formData: Omit<ContactInsert, 'id' | 'user_id' | 'createdAt' | 'updatedAt'>
) => {
  try {
    // The form data is already prepared by the composable and component
    await contactsStore.addContact(formData);
    // On success, the store's success notification will be shown.
    router.push('/contacts');
  } catch (error) {
    // The store's error notification is already handled by the `handleApiCall` helper.
    // No need for extra error handling here unless you want to do something specific in this view.
    console.error('Failed to create contact from view:', error);
  }
};

// --- Lifecycle Hooks ---
onMounted(() => {
  // Ensure groups are loaded for the GroupSelector inside ContactForm
  if (groupsStore.groups.length === 0) {
    groupsStore.sync();
  }
});
</script>
