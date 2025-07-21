<template>
  <div class="p-4 max-w-2xl mx-auto">
    <div v-if="!userStore.currentUser" class="glass p-6 max-w-md mx-auto mt-10">
      <h2 class="text-xl font-bold mb-4 text-center">
        {{ showRegister ? 'ثبت‌نام' : 'ورود' }}
      </h2>
      <form v-if="!showRegister" @submit.prevent="handleLogin" class="flex flex-col gap-3">
        <input
          v-model="loginForm.username"
          type="text"
          placeholder="نام کاربری"
          class="input"
          required
        />
        <input
          v-model="loginForm.password"
          type="password"
          placeholder="رمز عبور"
          class="input"
          required
        />
        <button
type="submit" class="btn btn-primary">ورود</button>
        <div class="text-xs text-center mt-2">
          حساب ندارید؟
          <button type="button" class="text-blue-600 underline" @click="showRegister = true">
            ثبت‌نام
          </button>
        </div>
        <div v-if="userStore.error" class="text-red-500 text-xs text-center">
          {{ userStore.error }}
        </div>
      </form>
      <form v-else @submit.prevent="handleRegister" class="flex flex-col gap-3">
        <input
          v-model="registerForm.username"
          type="text"
          placeholder="نام کاربری"
          class="input"
          required
        />
        <input
          v-model="registerForm.password"
          type="password"
          placeholder="رمز عبور"
          class="input"
          required
        />
        <button
type="submit" class="btn btn-success">ثبت‌نام</button>
        <div class="text-xs text-center mt-2">
          حساب دارید؟
          <button type="button" class="text-blue-600 underline" @click="showRegister = false">
            ورود
          </button>
        </div>
        <div v-if="userStore.error" class="text-red-500 text-xs text-center">
          {{ userStore.error }}
        </div>
      </form>
    </div>
    <template v-else>
      <div class="flex justify-between items-center mb-2 gap-2">
        <div class="text-xs text-gray-600">
          کاربر: {{ userStore.currentUser.username }} ({{
            userStore.currentUser.role === 'admin' ? 'مدیر' : 'عادی'
          }})
        </div>
        <div class="flex gap-2">
          <button class="btn btn-secondary" @click="toggleTheme">
            {{ isDark ? 'تم روشن' : 'تم تاریک' }}
          </button>
          <button
class="btn btn-error" @click="handleLogout">خروج</button>
        </div>
      </div>
      <!-- باقی کدهای قبلی صفحه مدیریت مخاطبین -->
      <DashboardStats :contacts="contacts" :groups="groups" />
      <GroupManager />
      <CustomFieldManager />
      <h1 class="text-2xl font-bold mb-4 text-center drop-shadow">مدیریت مخاطبین</h1>
      <div class="flex flex-col sm:flex-row gap-2 mb-4 justify-center">
        <button
class="btn btn-secondary flex-1" @click="exportContacts">خروجی JSON</button>
        <button
class="btn btn-secondary flex-1" @click="exportContactsCsv">خروجی CSV</button>
        <label class="btn btn-secondary flex-1 cursor-pointer">
          ورود از JSON
          <input
type="file" accept="application/json" class="hidden" @change="importContacts" />
        </label>
        <label class="btn btn-secondary flex-1 cursor-pointer">
          ورود از CSV
          <input
type="file" accept="text/csv" class="hidden" @change="importContactsCsv" />
        </label>
      </div>
      <ContactForm
        :form="form"
        :editing-id="editingId"
        :groups="groups.map((g) => ({ id: g.id ?? 0, name: g.name }))"
        @submit="onFormSubmit"
        @cancel="cancelEdit"
      />
      <div class="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          v-model="search"
          type="text"
          placeholder="جستجو بر اساس نام یا شماره..."
          class="input flex-1"
        />
        <select v-model="sortBy" class="input w-auto">
          <option value="name">مرتب‌سازی بر اساس نام</option>
          <option value="phone">مرتب‌سازی بر اساس شماره</option>
        </select>
        <select v-model="sortDir" class="input w-auto">
          <option value="asc">صعودی</option>
          <option value="desc">نزولی</option>
        </select>
      </div>
      <div v-if="filteredContacts.length === 0" class="text-gray-500 text-center">
        مخاطبی وجود ندارد.
      </div>
      <ContactList
        :contacts="filteredContacts"
        :groups="groups.map((g) => ({ id: g.id ?? 0, name: g.name }))"
        @edit="edit"
        @remove="remove"
      />
      <div
        v-if="showDuplicates"
        class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      >
        <div class="glass p-6 max-w-lg w-full relative">
          <button
            class="absolute top-2 left-2 btn btn-error btn-xs"
            @click="showDuplicates = false"
          >
            بستن
          </button>
          <h3 class="font-bold mb-2">مخاطبین تکراری</h3>
          <div
v-if="duplicates.length === 0" class="text-gray-500">مخاطب تکراری یافت نشد.</div>
          <ul v-else>
            <li v-for="group in duplicates" :key="group.key" class="mb-4">
              <div class="font-bold text-blue-700 mb-1 flex items-center gap-2">
                {{ group.key }}
                <button class="btn btn-success btn-xs ml-2" @click="mergeGroup(group.contacts)">
                  ادغام همه
                </button>
              </div>
              <ul class="ml-4">
                <li v-for="c in group.contacts" :key="c.id" class="flex items-center gap-2">
                  {{ c.name }} - {{ c.phoneNumbers[0] }}
                  <button
class="btn btn-error btn-xs" @click="remove(c.id)">حذف</button>
                </li>
              </ul>
            </li>
          </ul>
          <div v-if="fuzzyDuplicates.length" class="mt-6">
            <h4 class="font-bold text-purple-700 mb-2">مشابه هوشمند</h4>
            <ul>
              <li v-for="group in fuzzyDuplicates" :key="group.key" class="mb-4">
                <div class="font-bold text-purple-700 mb-1 flex items-center gap-2">
                  {{ group.key }}
                  <button class="btn btn-success btn-xs ml-2" @click="mergeGroup(group.contacts)">
                    ادغام همه
                  </button>
                </div>
                <ul class="ml-4">
                  <li v-for="c in group.contacts" :key="c.id" class="flex items-center gap-2">
                    {{ c.name }} - {{ c.phoneNumbers[0] }}
                    <button
class="btn btn-error btn-xs" @click="remove(c.id)">حذف</button>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
          <div
            v-if="successMsg"
            class="fixed top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded shadow z-50"
          >
            {{ successMsg }}
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useContactsStore } from '../stores/contacts';
import { useGroupsStore } from '../stores/groups';
import { useUserStore } from '../stores/user';
import { db } from '../database/dexie';
import ContactForm from '../components/ContactForm.vue';
import ContactList from '../components/ContactList.vue';
import GroupManager from '../components/GroupManager.vue';
import DashboardStats from '../components/DashboardStats.vue';
import CustomFieldManager from '../components/CustomFieldManager.vue';
import stringSimilarity from 'string-similarity';
import { loadCustomFieldSchemas } from '../database/customFieldSchema';

const store = useContactsStore();
const groupStore = useGroupsStore();
const userStore = useUserStore();
userStore.loadFromStorage(db);
const contacts = store.contacts;
const groups = groupStore.groups;

const form = ref({ name: '', phone: '', groupIds: [] as number[] });
const search = ref('');
const editingId = ref<number | null>(null);
const sortBy = ref<'name' | 'phone'>('name');
const sortDir = ref<'asc' | 'desc'>('asc');
const isDark = ref(false);
const showDuplicates = ref(false);
const successMsg = ref('');

const showSuccess = (msg: string) => {
  successMsg.value = msg;
  setTimeout(() => (successMsg.value = ''), 2000);
};

const setTheme = (dark: boolean) => {
  isDark.value = dark;
  document.documentElement.classList.toggle('dark', dark);
  localStorage.setItem('theme', dark ? 'dark' : 'light');
};
const toggleTheme = () => setTheme(!isDark.value);

const loginForm = ref({ username: '', password: '' });
const registerForm = ref({ username: '', password: '' });
const showRegister = ref(false);

const handleLogin = async () => {
  await userStore.login(loginForm.value.username, loginForm.value.password, db);
};
const handleRegister = async () => {
  await userStore.register(registerForm.value.username, registerForm.value.password, 'user', db);
  showRegister.value = false;
};
const handleLogout = () => {
  userStore.logout();
};

const add = async (data: { name: string; phone: string; groupIds?: number[]; customFields?: Record<string, any> }) => {
  await store.addContact({
    name: data.name,
    phoneNumbers: [data.phone],
    groupIds: data.groupIds || [],
    customFields: data.customFields || {},
    createdAt: '',
    updatedAt: '',
  });
  await store.fetchContacts(userStore, db);
  form.value = { name: '', phone: '', groupIds: [] };
};

const update = async (data: {
  name: string;
  phone: string;
  groupIds?: number[];
  customFields?: Record<string, any>;
}) => {
  if (!editingId.value) return;
  await store.updateContact({
    id: editingId.value,
    name: data.name,
    phoneNumbers: [data.phone],
    groupIds: data.groupIds || [],
    customFields: data.customFields || {},
    createdAt: '',
    updatedAt: '',
  });
  await store.fetchContacts(userStore, db);
  editingId.value = null;
  form.value = { name: '', phone: '', groupIds: [] };
};

const onFormSubmit = (data: { name: string; phone: string; groupIds?: number[]; customFields?: Record<string, any> }) => {
  if (editingId.value) update(data);
  else add(data);
};

const edit = (c: any) => {
  editingId.value = c.id;
  form.value = {
    name: c.name,
    phone: c.phoneNumbers[0],
    groupIds: c.groupIds ? [...c.groupIds] : [],
  };
};

const cancelEdit = () => {
  editingId.value = null;
  form.value = { name: '', phone: '', groupIds: [] };
};

const remove = async (id: number) => {
  await store.deleteContact(id);
};

const exportContacts = () => {
  const data = JSON.stringify(contacts, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'contacts.json';
  a.click();
  URL.revokeObjectURL(url);
};

const exportContactsCsv = () => {
  if (!contacts.length) return;
  // جمع‌آوری همه کلیدهای فیلد سفارشی
  const customKeys = Array.from(
    new Set(contacts.flatMap((c) => (c.customFields ? Object.keys(c.customFields) : [])))
  );
  const headers = ['name', 'phoneNumbers', 'groupNames', ...customKeys];
  const rows = contacts.map((c) => {
    const groupNames =
      c.groupIds && groups.length
        ? c.groupIds.map((gid: number) => groups.find((g) => g.id === gid)?.name || '').join(';')
        : '';
    return [
      c.name,
      (c.phoneNumbers || []).join(';'),
      groupNames,
      ...customKeys.map((k) => (c.customFields ? (c.customFields[k] ?? '') : '')),
    ];
  });
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'contacts.csv';
  a.click();
  URL.revokeObjectURL(url);
};

const importContacts = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (!input.files?.length) return;
  const file = input.files[0];
  const text = await file.text();
  try {
    const imported = JSON.parse(text);
    if (!Array.isArray(imported)) throw new Error('فرمت فایل صحیح نیست');
    for (const c of imported) {
      await store.addContact({
        name: c.name,
        phoneNumbers: c.phoneNumbers,
        groupIds: c.groupIds || [],
        createdAt: '',
        updatedAt: '',
      });
    }
    store.fetchContacts();
  } catch {
    alert('خطا در ورود فایل یا فرمت نامعتبر است');
  }
};

const importContactsCsv = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (!input.files?.length) return;
  const file = input.files[0];
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return;
  const headers = lines[0].split(',').map((h) => h.replace(/^"|"$/g, ''));
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i]
      .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
      .map((cell) => cell.replace(/^"|"$/g, '').replace(/""/g, '"'));
    const obj: any = {};
    headers.forEach((h, idx) => (obj[h] = row[idx]));
    // تبدیل فیلدها
    const contact: any = {
      name: obj.name || '',
      phoneNumbers: obj.phoneNumbers ? obj.phoneNumbers.split(';') : [],
      groupIds: [],
      customFields: {},
    };
    if (obj.groupNames && groups.length) {
      const groupNames = obj.groupNames.split(';');
      contact.groupIds = groupNames
        .map((gn: string) => {
          const g = groups.find((g) => g.name === gn);
          return g ? g.id : undefined;
        })
        .filter(Boolean);
    }
    // فیلدهای سفارشی
    for (const key of headers) {
      if (!['name', 'phoneNumbers', 'groupNames'].includes(key) && obj[key]) {
        contact.customFields[key] = obj[key];
      }
    }
    await store.addContact(contact);
  }
  store.fetchContacts();
};

const filteredContacts = computed(() => {
  let list = contacts;
  if (search.value) {
    const q = search.value.toLowerCase();
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phoneNumbers && c.phoneNumbers.some((p) => p.includes(q))) ||
        (c.customFields &&
          Object.values(c.customFields).some((val) => String(val).toLowerCase().includes(q)))
    );
  }
  list = [...list].sort((a, b) => {
    let aVal = sortBy.value === 'name' ? a.name : a.phoneNumbers[0] || '';
    let bVal = sortBy.value === 'name' ? b.name : b.phoneNumbers[0] || '';
    if (sortDir.value === 'asc') return aVal.localeCompare(bVal, 'fa');
    else return bVal.localeCompare(aVal, 'fa');
  });
  return list;
});

const duplicates = computed(() => {
  // بر اساس نام یا شماره
  const map: Record<string, any[]> = {};
  for (const c of contacts) {
    // کلیدهای تکراری: نام و هر شماره
    const keys = [c.name, ...(c.phoneNumbers || [])];
    for (const key of keys) {
      if (!key) continue;
      if (!map[key]) map[key] = [];
      map[key].push(c);
    }
  }
  // فقط گروه‌هایی که بیش از یک مخاطب دارند
  return Object.entries(map)
    .filter(([_, arr]) => arr.length > 1)
    .map(([key, contacts]) => ({ key, contacts }));
});

const fuzzyThreshold = 0.85;
const fuzzyDuplicates = computed(() => {
  const result: { key: string; contacts: any[] }[] = [];
  const used = new Set<number>();
  for (let i = 0; i < contacts.length; i++) {
    const idI = contacts[i].id;
    if (typeof idI === 'number' && used.has(idI)) continue;
    const group = [contacts[i]];
    for (let j = i + 1; j < contacts.length; j++) {
      const idJ = contacts[j].id;
      if (typeof idJ === 'number' && used.has(idJ)) continue;
      // Compare name similarity
      const nameSim = stringSimilarity.compareTwoStrings(contacts[i].name, contacts[j].name);
      // Compare phone similarity (first number)
      const phoneSim =
        contacts[i].phoneNumbers[0] && contacts[j].phoneNumbers[0]
          ? stringSimilarity.compareTwoStrings(
              contacts[i].phoneNumbers[0],
              contacts[j].phoneNumbers[0]
            )
          : 0;
      if (nameSim > fuzzyThreshold || phoneSim > fuzzyThreshold) {
        group.push(contacts[j]);
        if (typeof idJ === 'number') used.add(idJ);
      }
    }
    if (group.length > 1) {
      result.push({ key: group.map((c) => c.name).join(' / '), contacts: group });
      group.forEach((c) => {
        if (typeof c.id === 'number') used.add(c.id);
      });
    }
  }
  return result;
});

const mergeGroup = async (contactsToMerge: any[]) => {
  if (!contactsToMerge.length) return;
  // Keep the first, merge others into it, then delete the rest
  const [base, ...rest] = contactsToMerge;
  let merged = { ...base };
  for (const c of rest) {
    // Merge phone numbers
    merged.phoneNumbers = Array.from(
      new Set([...(merged.phoneNumbers || []), ...(c.phoneNumbers || [])])
    );
    // Merge groupIds
    merged.groupIds = Array.from(new Set([...(merged.groupIds || []), ...(c.groupIds || [])]));
    // Merge customFields
    merged.customFields = { ...(merged.customFields || {}), ...(c.customFields || {}) };
    // Merge notes
    if (c.notes && !merged.notes) merged.notes = c.notes;
    // Merge avatar
    if (c.avatar && !merged.avatar) merged.avatar = c.avatar;
  }
  await store.updateContact(merged);
  for (const c of rest) {
    await store.deleteContact(c.id);
  }
  await store.fetchContacts();
  showSuccess('ادغام انجام شد');
};

onMounted(async () => {
  setTheme(
    localStorage.getItem('theme') === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  await loadCustomFieldSchemas();
  await store.fetchContacts();
  groupStore.fetchGroups();
});
</script>

<style scoped>
.input {
  @apply border rounded px-2 py-1 w-full bg-white/70 backdrop-blur text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 transition;
}
.btn {
  @apply px-3 py-1 rounded font-bold transition shadow-sm;
}
.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}
.btn-success {
  @apply bg-green-600 text-white hover:bg-green-700;
}
.btn-warning {
  @apply bg-yellow-400 text-black hover:bg-yellow-500;
}
.btn-secondary {
  @apply bg-gray-400 text-white hover:bg-gray-500;
}
.btn-error {
  @apply bg-red-500 text-white hover:bg-red-600;
}
/* glass کلاس را فقط از استایل global استفاده کن */
html.dark {
  background: #18181b;
  color-scheme: dark;
}
html.dark body {
  background: #18181b;
  color: #e5e7eb;
}
html.dark .glass {
  background: rgba(36, 36, 36, 0.5) !important;
  color: #e5e7eb;
}
html.dark .input {
  background: #23232b !important;
  color: #e5e7eb;
}
html.dark .btn-secondary {
  background: #27272a !important;
  color: #e5e7eb;
}
</style>
