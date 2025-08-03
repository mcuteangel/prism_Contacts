<template>
  <div class="container mx-auto px-4 py-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">مخاطبین</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">مدیریت و سازماندهی مخاطبین شما</p>
      </div>

      <div class="flex items-center gap-2">
        <!-- View Toggle -->
        <div class="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            @click="viewMode = 'grid'"
            :class="[
              'p-2 rounded-md',
              viewMode === 'grid'
                ? 'bg-white dark:bg-gray-600 shadow'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
            ]"
            title="نمایش شبکه‌ای"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          </button>
          <button
            @click="viewMode = 'list'"
            :class="[
              'p-2 rounded-md',
              viewMode === 'list'
                ? 'bg-white dark:bg-gray-600 shadow'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
            ]"
            title="نمای لیست"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        <!-- Add Contact Button -->
        <button
          @click="$router.push('/contacts/new')"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg
            class="-ml-1 mr-2 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
              clip-rule="evenodd"
            />
          </svg>
          افزودن مخاطب
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="contactsStore.isLoading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="contacts.length === 0" class="text-center py-12">
      <svg
        class="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">هیچ مخاطبی وجود ندارد</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">با افزودن مخاطب جدید شروع کنید.</p>
      <div class="mt-6">
        <button
          @click="$router.push('/contacts/new')"
          type="button"
          class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg
            class="-ml-1 mr-2 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
              clip-rule="evenodd"
            />
          </svg>
          افزودن مخاطب
        </button>
      </div>
    </div>

    <!-- Contacts Grid/List View -->
    <div v-else>
      <!-- Toolbar -->
      <div class="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <!-- Search -->
        <div class="relative flex-1 max-w-md">
          <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg
              class="h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <input
            v-model="searchQuery"
            type="text"
            class="block w-full pr-10 sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="جستجو در مخاطبین..."
          />
        </div>

        <!-- Bulk Actions -->
        <div v-if="isSelectMode" class="flex items-center gap-2">
          <span class="text-sm text-gray-700 dark:text-gray-300">
            {{ selectedContactIds.size }} مورد انتخاب شده
          </span>
          <button
            @click="showBulkDeleteModal = true"
            class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-800"
          >
            حذف انتخاب‌شده‌ها
          </button>
          <button
            @click="
              isSelectMode = false;
              selectedContactIds.clear();
            "
            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            انصراف
          </button>
        </div>
        <button
          v-else
          @click="isSelectMode = true"
          class="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
        >
          انتخاب چندتایی
        </button>
      </div>

      <!-- Contacts Grid View -->
      <div v-if="viewMode === 'grid'" class="mt-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <ContactCard
            v-for="contact in filteredContacts"
            :key="contact.id"
            :contact="contact"
            :groups-map="groupsMap"
            :is-select-mode="isSelectMode"
            :selected-contact-ids="selectedContactIds"
            @edit="handleEditContact"
            @delete="handleDeleteContact"
            @select="handleSelectContact"
          />
        </div>
      </div>

      <!-- Contacts List View -->
      <div v-else class="mt-4">
        <div class="bg-white shadow overflow-hidden sm:rounded-md dark:bg-gray-800">
          <ul role="list" class="divide-y divide-gray-200 dark:divide-gray-700">
            <li v-for="contact in filteredContacts" :key="contact.id">
              <ContactListItem
                :contact="contact"
                :groups-map="groupsMap"
                :is-select-mode="isSelectMode"
                :selected-contact-ids="selectedContactIds"
                @edit="handleEditContact"
                @delete="handleDeleteContact"
                @select="handleSelectContact"
              />
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <ConfirmationModal
      :is-open="showDeleteModal"
      title="حذف مخاطب"
      message="آیا از حذف این مخاطب اطمینان دارید؟ این عمل قابل بازگشت نیست."
      confirm-button-text="حذف کن"
      confirm-button-icon="lucide:trash-2"
      :is-loading="isDeleting"
      :error-message="deleteError"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
      @update:is-open="(value) => (showDeleteModal = value)"
    />

    <ConfirmationModal
      :is-open="showBulkDeleteModal"
      title="حذف چندین مخاطب"
      :message="`آیا از حذف ${selectedContactIds.size} مخاطب انتخاب شده اطمینان دارید؟`"
      confirm-button-text="حذف همه"
      confirm-button-icon="lucide:trash-2"
      :is-loading="isDeleting"
      :error-message="deleteError"
      @confirm="confirmBulkDelete"
      @cancel="cancelBulkDelete"
      @update:is-open="(value) => (showBulkDeleteModal = value)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useContactsStore } from '../stores/contactsStore';
import { useGroupsStore } from '../stores/groupsStore';
import type { Contact, Group } from '../types/supabase';
import ContactCard from '../components/ContactCard.vue';
import ContactListItem from '../components/ContactListItem.vue';
import ConfirmationModal from '../components/ConfirmationModal.vue';
import { useToast } from 'vue-toastification';

const router = useRouter();
const contactsStore = useContactsStore();
const groupsStore = useGroupsStore();
const toast = useToast();

// --- State ---
type ViewMode = 'grid' | 'list';

// Reactive state
const viewMode = ref<ViewMode>('grid');
const selectedContactIds = ref<Set<string>>(new Set());
const isSelectMode = ref(false);
const searchQuery = ref('');
const showDeleteModal = ref(false);
const showBulkDeleteModal = ref(false);
const isDeleting = ref(false);
const contactToDelete = ref<Contact | null>(null);
const deleteError = ref<string | null>(null);

// UI State
// ...

// Get contacts from the store with proper typing
const contacts = computed<Contact[]>(() => {
  const storeContacts = contactsStore.contacts;
  if (Array.isArray(storeContacts)) {
    return [...storeContacts]; // Return a new array to prevent read-only issues
  }
  return [];
});

// Filtered contacts based on search query
const filteredContacts = computed<Contact[]>(() => {
  if (!searchQuery.value) return contacts.value;

  const query = searchQuery.value.toLowerCase();
  return contacts.value.filter((contact) => {
    const fullName = `${contact.firstName || ''} ${contact.lastName || ''}`.toLowerCase();
    const phoneNumbers = Array.isArray(contact.phoneNumbers) ? contact.phoneNumbers : [];
    const emails = Array.isArray(contact.emails) ? contact.emails : [];

    return (
      fullName.includes(query) ||
      phoneNumbers.some((p: any) => p?.number?.toLowerCase().includes(query)) ||
      emails.some((e: any) => e?.email?.toLowerCase().includes(query))
    );
  });
});

// --- Methods ---
const handleEditContact = (contact: Contact) => {
  router.push(`/contacts/edit/${contact.id}`);
};

const handleDeleteContact = (contact: Contact) => {
  contactToDelete.value = contact;
  showDeleteModal.value = true;
};

const handleSelectContact = (contact: Contact, isSelected: boolean) => {
  if (isSelected) {
    selectedContactIds.value.add(contact.id);
  } else {
    selectedContactIds.value.delete(contact.id);
  }
};

const confirmDelete = async () => {
  if (!contactToDelete.value) return;

  isDeleting.value = true;
  deleteError.value = null; // Reset error before attempt

  try {
    await contactsStore.deleteContact(contactToDelete.value.id);

    // Show success notification
    toast.success(
      `مخاطب «${contactToDelete.value.firstName} ${contactToDelete.value.lastName}» با موفقیت حذف شد`
    );

    // Only close modal on success
    showDeleteModal.value = false;
    contactToDelete.value = null;
  } catch (error: any) {
    console.error('Error deleting contact:', error);
    // Set error message to show in the modal
    deleteError.value = error.message || 'خطا در حذف مخاطب. لطفاً دوباره تلاش کنید.';
    // The store already shows a generic error toast, this provides specific feedback in the modal
  } finally {
    isDeleting.value = false;
  }
};

const confirmBulkDelete = async () => {
  if (selectedContactIds.value.size === 0) return;

  isDeleting.value = true;
  deleteError.value = null; // Reset error before attempt
  const count = selectedContactIds.value.size;

  try {
    // Create an array of delete promises
    const deletePromises = Array.from(selectedContactIds.value).map((id) =>
      contactsStore.deleteContact(id)
    );

    // Wait for all deletes to complete
    await Promise.all(deletePromises);

    // Show success notification
    toast.success(`${count} مخاطب با موفقیت حذف شدند`);

    // Reset selection and close modal only on success
    selectedContactIds.value.clear();
    isSelectMode.value = false;
    showBulkDeleteModal.value = false;
  } catch (error: any) {
    console.error('Error in bulk delete:', error);
    // Set error message to show in the modal
    deleteError.value = 'امکان حذف برخی از مخاطبین وجود نداشت. لطفاً دوباره تلاش کنید.';
    // The store already shows a generic error toast, this provides specific feedback in the modal
  } finally {
    isDeleting.value = false;
  }
};

// --- Computed Properties ---
const groupsMap = computed(() => {
  const map = new Map<string, Group>();
  groupsStore.groups.forEach((group) => {
    map.set(group.id, group);
  });
  return map;
});

// --- Methods ---
const changeViewMode = (mode: ViewMode) => {
  viewMode.value = mode;
  localStorage.setItem('contactsViewMode', mode);
};

const handleView = (id: string) => {
  router.push({ name: 'contact-details', params: { id } });
};

const handleEdit = (id: string) => {
  router.push({ name: 'edit-contact', params: { id } });
};

const handleRemove = (id: string) => {
  contactToDelete.value =
    contactsStore.contacts.find((contact: Contact) => contact.id === id) || null;
  if (contactToDelete.value) {
    showDeleteModal.value = true;
  }
};

const cancelDelete = () => {
  showDeleteModal.value = false;
  contactToDelete.value = null;
  deleteError.value = null; // Clear any error messages
};

const cancelBulkDelete = () => {
  showBulkDeleteModal.value = false;
  deleteError.value = null; // Clear any error messages
};

const toggleSelectMode = () => {
  isSelectMode.value = !isSelectMode.value;
  if (!isSelectMode.value) {
    selectedContactIds.value.clear();
  }
};

const toggleContactSelection = (id: string) => {
  if (selectedContactIds.value.has(id)) {
    selectedContactIds.value.delete(id);
  } else {
    selectedContactIds.value.add(id);
  }
};

const handleBulkDelete = async () => {
  if (selectedContactIds.value.size === 0) return;

  try {
    const deletePromises = Array.from(selectedContactIds.value).map((id) =>
      contactsStore.deleteContact(id)
    );

    await Promise.all(deletePromises);

    // Reset selection
    selectedContactIds.value.clear();
    isSelectMode.value = false;

    // پیام موفقیت به صورت خودکار توسط store نمایش داده می‌شود
  } catch (error) {
    console.error('Error in bulk delete:', error);
    toast.error('خطا در حذف مخاطبین. لطفاً دوباره تلاش کنید.');
  } finally {
    showBulkDeleteModal.value = false;
  }
};

// --- Lifecycle & Watchers ---
onMounted(async () => {
  // Load initial data
  try {
    await Promise.all([contactsStore.sync(), groupsStore.sync()]);
  } catch (error) {
    console.error('خطا در بارگذاری اولیه داده‌ها:', error);
    toast.error('خطا در بارگذاری داده‌ها. لطفاً اتصال اینترنت خود را بررسی کنید.');
  }
});

// Watch for changes in contacts and update the selection state
watch(
  () => contactsStore.contacts,
  (newContacts: unknown) => {
    if (!Array.isArray(newContacts)) return;

    // Update selection mode if all selected contacts were removed
    if (selectedContactIds.value.size > 0) {
      const existingIds = new Set((newContacts as Contact[]).map((contact) => contact.id));
      const updatedSelectedIds = new Set(selectedContactIds.value);
      let hasChanges = false;

      for (const id of Array.from(updatedSelectedIds)) {
        if (!existingIds.has(id)) {
          updatedSelectedIds.delete(id);
          hasChanges = true;
        }
      }

      if (hasChanges) {
        // Update the ref with a new Set to trigger reactivity
        selectedContactIds.value = new Set(updatedSelectedIds);

        if (updatedSelectedIds.size === 0) {
          isSelectMode.value = false;
        }
      }
    }
  },
  { deep: true }
);
</script>
