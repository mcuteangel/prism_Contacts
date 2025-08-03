<template>
  <div class="max-w-6xl mx-auto px-4 py-6">
    <div class="flex flex-col md:flex-row gap-6">
      <!-- Sidebar -->
      <div class="w-full md:w-64 flex-shrink-0">
        <div class="bg-base-100 rounded-lg shadow p-4">
          <h2 class="text-lg font-bold mb-4 border-b pb-2">تنظیمات</h2>
          <ul class="menu p-0">
            <li>
              <a :class="{ active: activeTab === 'general' }" @click="activeTab = 'general'">
                <span class="iconify" data-icon="lucide:settings-2" />
                تنظیمات عمومی
              </a>
            </li>
            <li v-if="isAdmin">
              <a :class="{ active: activeTab === 'users' }" @click="activeTab = 'users'">
                <span class="iconify" data-icon="lucide:users" />
                مدیریت کاربران
              </a>
            </li>
            <li>
              <a :class="{ active: activeTab === 'account' }" @click="activeTab = 'account'">
                <span class="iconify" data-icon="lucide:user" />
                حساب کاربری
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1">
        <div v-if="activeTab === 'general'" class="bg-base-100 rounded-lg shadow p-6">
          <h2 class="text-xl font-bold mb-6 flex items-center gap-2">
            <span class="iconify" data-icon="lucide:settings-2" />
            تنظیمات عمومی
          </h2>
          <div class="space-y-6">
            <div class="form-control">
              <label class="label">
                <span class="label-text">زبان سیستم</span>
              </label>
              <select class="select select-bordered w-full max-w-xs">
                <option selected>فارسی</option>
                <option>English</option>
              </select>
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">تم</span>
              </label>
              <div class="flex gap-4">
                <div v-for="theme in themes" :key="theme" class="flex-1">
                  <input
                    type="radio"
                    :id="theme"
                    name="theme"
                    :value="theme"
                    class="hidden peer"
                    :checked="selectedTheme === theme"
                    @change="changeTheme(theme)"
                  />
                  <label
                    :for="theme"
                    class="block p-4 border rounded-lg cursor-pointer text-center peer-checked:border-primary peer-checked:ring-2 peer-checked:ring-primary"
                  >
                    <div
                      class="w-8 h-8 mx-auto mb-2 rounded-full"
                      :class="
                        theme === 'light'
                          ? 'bg-base-200'
                          : theme === 'dark'
                            ? 'bg-base-300'
                            : 'bg-gradient-to-r from-base-200 to-base-300'
                      "
                    ></div>
                    <span class="text-sm">
                      {{ theme === 'light' ? 'روشن' : theme === 'dark' ? 'تاریک' : 'سیستمی' }}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div class="flex justify-end mt-8">
              <button class="btn btn-primary">ذخیره تغییرات</button>
            </div>
          </div>
        </div>

        <div v-else-if="activeTab === 'users'" class="bg-base-100 rounded-lg shadow">
          <UserManager />
        </div>

        <div v-else-if="activeTab === 'account'" class="bg-base-100 rounded-lg shadow p-6">
          <h2 class="text-xl font-bold mb-6 flex items-center gap-2">
            <span class="iconify" data-icon="lucide:user" />
            اطلاعات حساب کاربری
          </h2>

          <div class="space-y-6">
            <div class="form-control">
              <label class="label">
                <span class="label-text">نام و نام خانوادگی</span>
              </label>
              <input
                type="text"
                class="input input-bordered w-full"
                :value="user?.full_name"
                disabled
              />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">آدرس ایمیل</span>
              </label>
              <input
                type="email"
                class="input input-bordered w-full"
                :value="user?.email"
                disabled
              />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">تاریخ عضویت</span>
              </label>
              <input
                type="text"
                class="input input-bordered w-full"
                :value="formatDate(user?.created_at)"
                disabled
              />
            </div>

            <div class="divider">تغییر رمز عبور</div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">رمز عبور فعلی</span>
              </label>
              <input
                type="password"
                class="input input-bordered w-full"
                v-model="currentPassword"
              />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">رمز عبور جدید</span>
              </label>
              <input type="password" class="input input-bordered w-full" v-model="newPassword" />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">تکرار رمز عبور جدید</span>
              </label>
              <input
                type="password"
                class="input input-bordered w-full"
                v-model="confirmPassword"
              />
            </div>

            <div class="flex justify-end gap-2 mt-8">
              <button class="btn btn-ghost">انصراف</button>
              <button class="btn btn-primary">ذخیره تغییرات</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/authStore';
import UserManager from '../components/UserManager.vue';

const authStore = useAuthStore();
const user = computed(() => authStore.user);
const isAdmin = computed(() => authStore.isAdmin);

// Tab management
const activeTab = ref('general');

// Theme settings
const themes = ['light', 'dark', 'system'] as const;
type Theme = (typeof themes)[number];
const selectedTheme = ref<Theme>('system');

// Password change
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');

// Format date to Persian
const formatDate = (dateString?: string) => {
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

// Change theme
const changeTheme = (theme: Theme) => {
  selectedTheme.value = theme;
  // Implement theme change logic here
  document.documentElement.setAttribute('data-theme', theme === 'system' ? '' : theme);
};

// Initialize theme from localStorage or system preference
onMounted(() => {
  const savedTheme = localStorage.getItem('theme') as Theme | null;
  if (savedTheme && themes.includes(savedTheme)) {
    selectedTheme.value = savedTheme;
    document.documentElement.setAttribute('data-theme', savedTheme === 'system' ? '' : savedTheme);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
});
</script>
