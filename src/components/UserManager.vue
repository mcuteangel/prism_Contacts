<template>
  <div class="user-manager">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-xl font-bold flex items-center gap-2">
        <span class="iconify" data-icon="lucide:users" /> مدیریت کاربران
      </h2>
      <button
        @click="showAddUserModal = true"
        class="btn btn-primary btn-sm flex items-center gap-1"
      >
        <span class="iconify" data-icon="lucide:user-plus" />
        افزودن کاربر
      </button>
    </div>

    <div v-if="isLoading" class="text-center py-8">
      <span class="loading loading-spinner loading-lg"></span>
      <p class="mt-2 text-gray-500">در حال بارگذاری کاربران...</p>
    </div>

    <div v-else-if="error" class="alert alert-error mb-6">
      <span class="iconify" data-icon="lucide:alert-circle" />
      <span>خطا در دریافت لیست کاربران: {{ error }}</span>
    </div>

    <div v-else class="bg-base-100 rounded-lg shadow overflow-hidden">
      <div class="overflow-x-auto">
        <table class="table table-zebra w-full">
          <thead>
            <tr>
              <th class="text-right">نام و نام خانوادگی</th>
              <th class="text-right">ایمیل</th>
              <th class="text-right">نقش</th>
              <th class="text-right">تاریخ عضویت</th>
              <th class="text-right">وضعیت</th>
              <th class="text-right">عملیات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.full_name || 'تعیین نشده' }}</td>
              <td>{{ user.email || 'بدون ایمیل' }}</td>
              <td>
                <span
                  class="badge"
                  :class="{
                    'badge-primary': user.role === 'admin',
                    'badge-ghost': user.role !== 'admin',
                  }"
                >
                  {{ user.role === 'admin' ? 'مدیر' : 'کاربر عادی' }}
                </span>
              </td>
              <td>{{ formatDate(user.created_at) }}</td>
              <td>
                <span
                  class="badge"
                  :class="{
                    'badge-success': user.email_confirmed_at,
                    'badge-warning': !user.email_confirmed_at,
                  }"
                >
                  {{ user.email_confirmed_at ? 'تأیید شده' : 'در انتظار تأیید' }}
                </span>
              </td>
              <td class="space-x-2">
                <button
                  v-if="user.role !== 'admin'"
                  @click="promoteToAdmin(user.id)"
                  class="btn btn-ghost btn-xs text-blue-600 hover:text-blue-800"
                  :disabled="isUpdating === user.id"
                  title="ارتقا به مدیر"
                >
                  <span
                    v-if="isUpdating === user.id"
                    class="loading loading-spinner loading-xs"
                  ></span>
                  <span v-else class="iconify" data-icon="lucide:shield-check" />
                </button>
                <button
                  @click="confirmDelete(user)"
                  class="btn btn-ghost btn-xs text-red-600 hover:text-red-800"
                  :disabled="isDeleting === user.id"
                  title="حذف کاربر"
                >
                  <span
                    v-if="isDeleting === user.id"
                    class="loading loading-spinner loading-xs"
                  ></span>
                  <span v-else class="iconify" data-icon="lucide:trash-2" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add User Modal -->
    <div v-if="showAddUserModal" class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">افزودن کاربر جدید</h3>
        <div class="space-y-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">نام و نام خانوادگی</span>
            </label>
            <input
              v-model="newUser.full_name"
              type="text"
              class="input input-bordered w-full"
              placeholder="نام کاربر را وارد کنید"
            />
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text">آدرس ایمیل</span>
            </label>
            <input
              v-model="newUser.email"
              type="email"
              class="input input-bordered w-full"
              placeholder="example@domain.com"
            />
          </div>
          <div class="form-control">
            <label class="label">
              <span class="label-text">نقش کاربر</span>
            </label>
            <select v-model="newUser.role" class="select select-bordered w-full">
              <option value="user">کاربر عادی</option>
              <option value="admin">مدیر سیستم</option>
            </select>
          </div>
        </div>
        <div class="modal-action">
          <button class="btn btn-ghost" @click="showAddUserModal = false" :disabled="isAdding">
            انصراف
          </button>
          <button class="btn btn-primary" @click="addUser" :disabled="isAdding">
            <span v-if="isAdding" class="loading loading-spinner loading-sm"></span>
            {{ isAdding ? 'در حال ثبت...' : 'ثبت کاربر' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="userToDelete" class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg">حذف کاربر</h3>
        <p class="py-4">
          آیا از حذف کاربر <span class="font-bold">{{ userToDelete.email }}</span> مطمئن هستید؟ این
          عمل قابل بازگشت نیست.
        </p>
        <div class="modal-action">
          <button class="btn btn-ghost" @click="userToDelete = null" :disabled="isDeleting">
            انصراف
          </button>
          <button class="btn btn-error" @click="deleteUser" :disabled="isDeleting">
            <span v-if="isDeleting" class="loading loading-spinner loading-sm"></span>
            {{ isDeleting ? 'در حال حذف...' : 'حذف کاربر' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { supabase } from '../supabase';
import { useNotificationStore } from '../stores/notificationStore';

// Define types for better type safety
interface User {
  id: string;
  email?: string;
  full_name?: string;
  role: 'user' | 'admin';
  created_at: string;
  email_confirmed_at: string | null;
  last_sign_in_at?: string;
  phone?: string;
}

// State
const users = ref<User[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);
const isDeleting = ref<string | null>(null);
const isUpdating = ref<string | null>(null);
const isAdding = ref(false);
const showAddUserModal = ref(false);
const userToDelete = ref<User | null>(null);

// New user form
const newUser = ref({
  email: '',
  full_name: '',
  role: 'user' as 'user' | 'admin',
});

// Format date to a readable Persian format
const formatDate = (dateString: string) => {
  if (!dateString) return 'نامشخص';

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    calendar: 'persian',
    numberingSystem: 'latn',
  };

  try {
    return new Date(dateString).toLocaleDateString('fa-IR', options);
  } catch (e) {
    return 'نامشخص';
  }
};

// Fetch users using Edge Function
const fetchUsers = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    const { data, error: fetchError } = await supabase.functions.invoke('admin-users', {
      method: 'GET',
    });

    if (fetchError) throw fetchError;

    users.value = data.users;
  } catch (err: any) {
    console.error('Error fetching users:', err);
    error.value = 'خطا در دریافت لیست کاربران';
    notificationStore.error('خطا در دریافت لیست کاربران');
  } finally {
    isLoading.value = false;
  }
};

// Confirm user deletion
const confirmDelete = (user: User) => {
  userToDelete.value = user;
};

// Delete a user
const deleteUser = async () => {
  if (!userToDelete.value) return;

  isDeleting.value = userToDelete.value.id;

  try {
    const { error: deleteError } = await supabase.functions.invoke('admin-users', {
      method: 'DELETE',
      body: { userId: userToDelete.value.id },
    });

    if (deleteError) throw deleteError;

    // Refresh the users list
    await fetchUsers();

    notificationStore.success('کاربر با موفقیت حذف شد');
  } catch (err: any) {
    console.error('Error deleting user:', err);
    notificationStore.error('خطا در حذف کاربر: ' + (err.message || 'خطای ناشناخته'));
  } finally {
    isDeleting.value = null;
    userToDelete.value = null;
  }
};

// Promote user to admin
const promoteToAdmin = async (userId: string) => {
  isUpdating.value = userId;

  try {
    const { error: updateError } = await supabase.functions.invoke('admin-users', {
      method: 'PUT',
      body: {
        userId,
        role: 'admin',
      },
    });

    if (updateError) throw updateError;

    // Refresh the users list
    await fetchUsers();

    notificationStore.success('کاربر با موفقیت به مدیر ارتقا یافت');
  } catch (err: any) {
    console.error('Error promoting user to admin:', err);
    notificationStore.error('خطا در ارتقای کاربر به مدیر');
  } finally {
    isUpdating.value = null;
  }
};

// Add a new user
const addUser = async () => {
  if (!newUser.value.email) {
    notificationStore.error('لطفا ایمیل کاربر را وارد کنید');
    return;
  }

  isAdding.value = true;

  try {
    const { error: createError } = await supabase.functions.invoke('admin-users', {
      method: 'POST',
      body: {
        email: newUser.value.email,
        full_name: newUser.value.full_name || '',
        role: newUser.value.role,
      },
    });

    if (createError) throw createError;

    // Refresh the users list
    await fetchUsers();

    // Reset form
    newUser.value = {
      email: '',
      full_name: '',
      role: 'user',
    };

    showAddUserModal.value = false;
    notificationStore.success('کاربر جدید با موفقیت اضافه شد');
  } catch (err: any) {
    console.error('Error adding user:', err);
    notificationStore.error('خطا در اضافه کردن کاربر: ' + (err.message || 'خطای ناشناخته'));
  } finally {
    isAdding.value = false;
  }
};

// Initialize notification store
const notificationStore = useNotificationStore();

// Fetch users when component is mounted
onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
.user-manager {
  max-width: 100%;
  margin: 0 auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  background-color: white;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

th {
  background-color: #f3f4f6;
  font-weight: 600;
  text-align: right;
  padding: 0.75rem 1rem;
  color: #374151;
}

td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
}

tr:last-child td {
  border-bottom: none;
}

.loading {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  table {
    background-color: #1f2937;
    color: #f9fafb;
  }

  th {
    background-color: #111827;
    color: #f3f4f6;
  }

  td {
    border-bottom-color: #374151;
  }
}
</style>
