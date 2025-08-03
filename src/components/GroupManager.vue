<template>
  <div class="glass p-4 mb-6">
    <h2 class="font-bold mb-2">مدیریت گروه‌ها</h2>
    <div v-if="groupStore.isLoading" class="text-center">در حال بارگذاری...</div>
    <div v-else-if="groupStore.error" class="alert alert-error">{{ groupStore.error }}</div>

    <form class="flex gap-2 mb-4" @submit.prevent="handleSubmit">
      <input
        v-model="form.name"
        type="text"
        placeholder="نام گروه"
        class="input input-bordered flex-1"
        required
      />
      <input
        v-model="form.color"
        type="color"
        class="input input-bordered w-16"
        title="انتخاب رنگ"
      />
      <button v-if="!editingId" type="submit" class="btn btn-primary">افزودن</button>
      <button v-else type="submit" class="btn btn-success">ذخیره</button>
      <button v-if="editingId" type="button" class="btn btn-ghost" @click="cancelEdit">
        انصراف
      </button>
    </form>

    <ul class="space-y-2">
      <li
        v-for="g in groupStore.groups as Group[]"
        :key="g.id"
        class="flex items-center gap-2 p-2 rounded hover:bg-base-200"
      >
        <span class="w-4 h-4 rounded-full" :style="{ backgroundColor: g.color || '#ccc' }"></span>
        <span class="font-bold flex-1">{{ g.name }}</span>
        <button class="btn btn-ghost btn-xs" @click="edit(g)">ویرایش</button>
        <button class="btn btn-ghost btn-xs text-error" @click="handleRemoveClick(g)">حذف</button>
      </li>
    </ul>

    <!-- Confirmation Modal for Delete -->
    <ConfirmationModal
      v-if="groupToDelete"
      v-model:is-open="showDeleteModal"
      title="تایید حذف گروه"
      :message="`آیا از حذف گروه '${groupToDelete?.name}' اطمینان دارید؟`"
      confirm-button-text="حذف"
      cancel-button-text="انصراف"
      :is-loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useGroupsStore } from '../stores/groupsStore';
import ConfirmationModal from './ConfirmationModal.vue';
import type { Group, GroupUpdate } from '../types/supabase';

const groupStore = useGroupsStore();

// Form state
const form = ref<Omit<Group, 'id' | 'created_at' | 'updated_at' | 'user_id'>>({
  name: '',
  color: '#cccccc',
});

const editingId = ref<string | null>(null);
const groupToDelete = ref<Group | null>(null);
const showDeleteModal = ref(false);
const isDeleting = ref(false);

const handleSubmit = async () => {
  try {
    if (editingId.value) {
      const updateData: GroupUpdate = {
        id: editingId.value,
        name: form.value.name,
        color: form.value.color,
        updated_at: new Date().toISOString(),
      };
      await groupStore.updateGroup(editingId.value, updateData);
    } else {
      await groupStore.addGroup({
        name: form.value.name,
        color: form.value.color,
      });
    }
    cancelEdit();
  } catch (error) {
    console.error('خطا در ذخیره گروه:', error);
  }
};

const edit = (group: Group) => {
  editingId.value = group.id;
  form.value = {
    name: group.name,
    color: group.color || '#cccccc',
  };
};

const cancelEdit = () => {
  editingId.value = null;
  form.value = { name: '', color: '#cccccc' };
};

const handleRemoveClick = (group: Group) => {
  groupToDelete.value = group;
  showDeleteModal.value = true;
};

const confirmDelete = async () => {
  if (!groupToDelete.value) return;

  isDeleting.value = true;
  try {
    await groupStore.deleteGroup(groupToDelete.value.id);
    showDeleteModal.value = false;
    groupToDelete.value = null;
  } catch (error) {
    console.error('خطا در حذف گروه:', error);
  } finally {
    isDeleting.value = false;
  }
};

const cancelDelete = () => {
  showDeleteModal.value = false;
  groupToDelete.value = null;
};

onMounted(() => {
  // If we don't have any groups yet, sync with the server
  if ((groupStore.groups as Group[]).length === 0) {
    groupStore.sync();
  }
});
</script>
