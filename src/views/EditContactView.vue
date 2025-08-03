<template>
  <div class="max-w-3xl mx-auto">
    <header class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">ویرایش مخاطب</h1>
      <button class="btn btn-ghost" @click="$router.back()">
        <span class="iconify" data-icon="lucide:arrow-left" />
        بازگشت
      </button>
    </header>

    <div v-if="isLoading" class="text-center py-16">
      <span class="loading loading-spinner loading-lg text-primary"></span>
      <p class="mt-2">در حال بارگذاری اطلاعات...</p>
    </div>

    <div v-else-if="error" class="alert alert-error">
      <span class="iconify" data-icon="lucide:alert-circle" />
      <span>{{ error }}</span>
    </div>

    <ContactForm
      v-else-if="contactToEdit"
      :contact="contactToEdit"
      @submit="handleUpdateContact"
      @cancel="$router.back()"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useContactsStore } from '../stores/contactsStore';
import { useGroupsStore } from '../stores/groupsStore';
import type { Contact, ContactUpdate } from '../types/supabase';
import ContactForm from '../components/ContactForm.vue';

// --- Composables & Stores ---
const route = useRoute();
const router = useRouter();
const toast = useToast();
const contactsStore = useContactsStore();
const groupsStore = useGroupsStore();

// Groups will be loaded on demand when needed

// --- State ---
const contactToEdit = ref<Contact | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

// --- Methods ---
const handleUpdateContact = async (formData: ContactUpdate) => {
  if (!contactToEdit.value?.id) return;

  try {
    // Update contact and wait for sync to complete
    await contactsStore.updateContact(contactToEdit.value.id, formData);

    // Show success message
    toast.success('مخاطب با موفقیت به‌روزرسانی شد.');

    // Redirect to contacts list
    router.push({ name: 'contacts' });
  } catch (err) {
    // Show error message
    toast.error('خطا در به‌روزرسانی مخاطب. لطفاً دوباره تلاش کنید.');
    console.error('Failed to update contact from view:', err);
  }
};

const fetchContactData = async () => {
  const contactId = route.params.id as string;
  if (!contactId) {
    error.value = 'شناسه مخاطب ارائه نشده است.';
    isLoading.value = false;
    return;
  }

  try {
    // First, ensure groups are synced
    if (groupsStore.groups.length === 0) {
      await groupsStore.sync();
    }

    // Then, fetch the specific contact from local DB
    const fetchedContact = await contactsStore.getContactById(contactId);

    if (fetchedContact) {
      contactToEdit.value = fetchedContact;
    } else {
      error.value = 'مخاطب مورد نظر یافت نشد.';
      // Optionally, redirect after a delay
      setTimeout(() => router.push('/contacts'), 3000);
    }
  } catch (err: any) {
    error.value = err.message || 'خطا در بارگذاری اطلاعات مخاطب.';
    console.error(err);
  } finally {
    isLoading.value = false;
  }
};

// --- Lifecycle Hooks ---
onMounted(() => {
  fetchContactData();
});
</script>

<style scoped>
.btn {
  @apply px-3 py-1.5 rounded font-bold transition shadow-sm;
}
.btn-secondary {
  @apply bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700;
}
</style>
