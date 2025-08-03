<template>
  <div class="max-w-2xl mx-auto p-4">
    <div v-if="loading" class="text-center py-8">
      <div
        class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"
      ></div>
      <p class="mt-2 text-gray-600">در حال بارگذاری اطلاعات مخاطب...</p>
    </div>

    <div v-else-if="!contact" class="text-center py-8">
      <p class="text-red-500">مخاطب مورد نظر یافت نشد</p>
      <router-link
        to="/contacts"
        class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        بازگشت به لیست مخاطبین
      </router-link>
    </div>

    <div v-else class="bg-white shadow overflow-hidden sm:rounded-lg">
      <div class="px-4 py-5 sm:px-6 flex justify-between items-center bg-gray-50">
        <div>
          <h3 class="text-lg leading-6 font-medium text-gray-900">
            {{ contact.firstName }} {{ contact.lastName }}
          </h3>
          <p class="mt-1 max-w-2xl text-sm text-gray-500">جزئیات مخاطب</p>
        </div>
        <div class="flex space-x-2 rtl:space-x-reverse">
          <router-link
            :to="`/contacts/edit/${contact.id}`"
            class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            ویرایش
          </router-link>
          <button
            @click="handleRemove"
            class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            حذف
          </button>
        </div>
      </div>
      <div class="border-t border-gray-200">
        <dl>
          <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">نام</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {{ contact.firstName }}
            </dd>
          </div>
          <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">نام خانوادگی</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {{ contact.lastName }}
            </dd>
          </div>
          <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">شماره تلفن</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {{ contact.phoneNumber }}
            </dd>
          </div>
          <div
            v-if="contact.email"
            class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"
          >
            <dt class="text-sm font-medium text-gray-500">ایمیل</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {{ contact.email }}
            </dd>
          </div>
          <div
            v-if="contactGroups.length > 0"
            class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"
          >
            <dt class="text-sm font-medium text-gray-500">گروه‌ها</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="group in contactGroups"
                  :key="group.id"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {{ group.name }}
                </span>
              </div>
            </dd>
          </div>
          <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt class="text-sm font-medium text-gray-500">تاریخ ایجاد</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {{ formatDate(contact.createdAt) }}
            </dd>
          </div>
          <div
            v-if="contact.updatedAt"
            class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"
          >
            <dt class="text-sm font-medium text-gray-500">آخرین به‌روزرسانی</dt>
            <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {{ formatDate(contact.updatedAt) }}
            </dd>
          </div>
        </dl>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <ConfirmationModal
      :is-open="showDeleteModal"
      title="حذف مخاطب"
      message="آیا از حذف این مخاطب اطمینان دارید؟"
      :is-loading="isDeleting"
      confirm-button-text="حذف"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
      @update:is-open="(val) => (showDeleteModal = val)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useContactsStore } from '../stores/contactsStore';
import { useGroupsStore } from '../stores/groupsStore';
import { useNotificationStore } from '../stores/notificationStore';
import type { Contact, Group } from '../types/supabase';
import ConfirmationModal from '../components/ConfirmationModal.vue';

const route = useRoute();
const router = useRouter();
const contactsStore = useContactsStore();
const groupsStore = useGroupsStore();
const notificationStore = useNotificationStore();

const contact = ref<Contact | null>(null);
const loading = ref(true);
const showDeleteModal = ref(false);
const isDeleting = ref(false);

const contactId = computed(() => route.params.id as string);

const contactGroups = computed<Group[]>(() => {
  if (!contact.value?.groupIds?.length || !groupsStore.groups) return [];
  const groupIds = new Set(contact.value.groupIds);
  return groupsStore.groups.filter((g: Group) => groupIds.has(g.id));
});

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('fa-IR');
};

const handleRemove = () => {
  showDeleteModal.value = true;
};

const confirmDelete = async () => {
  if (!contactId.value) return;
  isDeleting.value = true;
  try {
    await contactsStore.deleteContact(contactId.value);
    // Notification is handled by the store
    router.push('/contacts');
  } catch (error) {
    console.error('Error deleting contact:', error);
    // Notification is handled by the store
  } finally {
    isDeleting.value = false;
    showDeleteModal.value = false;
  }
};

// Load contact data
const loadContact = async () => {
  if (!contactId.value) {
    notificationStore.error('شناسه مخاطب نامعتبر است.');
    router.push('/contacts');
    return;
  }

  try {
    loading.value = true;
    const foundContact = await contactsStore.getContactById(contactId.value);

    if (foundContact) {
      contact.value = foundContact;

      // Load groups if not already loaded
      if (groupsStore.groups.length === 0) {
        await groupsStore.sync();
      }
    } else {
      notificationStore.error('مخاطب مورد نظر یافت نشد.');
      router.push('/contacts');
    }
  } catch (error) {
    console.error('Error loading contact:', error);
    notificationStore.error('خطا در بارگذاری اطلاعات مخاطب');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadContact();
});
</script>

<style scoped>
.badge {
  @apply px-3 py-1 text-sm rounded-full border border-gray-200 dark:border-gray-700;
}

.badge-outline {
  @apply bg-transparent text-current border-current;
}
</style>
