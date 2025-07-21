<template>
  <div class="glass p-4 mb-6">
    <h2 class="font-bold mb-2">مدیریت گروه‌ها</h2>
    <form
class="flex gap-2 mb-2" @submit.prevent="editingId ? update() : add()"
>
      <input
v-model="form.name" type="text" placeholder="نام گروه" class="input flex-1" required />
      <button
v-if="!editingId" type="submit" class="btn btn-primary">افزودن</button>
      <button
v-else type="submit" class="btn btn-success">ذخیره</button>
      <button v-if="editingId" type="button" class="btn btn-secondary" @click="cancelEdit">
        انصراف
      </button>
    </form>
    <ul>
      <li v-for="g in groups" :key="g.id" class="flex items-center gap-2 mb-1">
        <span class="font-bold">{{ g.name }}</span>
        <button
class="btn btn-warning btn-xs" @click="edit(g)">ویرایش</button>
        <button
class="btn btn-error btn-xs" @click="remove(g.id ?? 0)">حذف</button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useGroupsStore } from '../stores/groups';

const groupStore = useGroupsStore();
const groups = groupStore.groups;

const form = ref({ name: '' });
const editingId = ref<number | null>(null);

const add = async () => {
  await groupStore.addGroup({ name: form.value.name });
  form.value = { name: '' };
};

const edit = (g: any) => {
  editingId.value = g.id;
  form.value = { name: g.name };
};

const update = async () => {
  if (!editingId.value) return;
  await groupStore.updateGroup({ id: editingId.value, name: form.value.name });
  editingId.value = null;
  form.value = { name: '' };
};

const cancelEdit = () => {
  editingId.value = null;
  form.value = { name: '' };
};

const remove = async (id: number) => {
  await groupStore.deleteGroup(id);
};

watch(groups, () => {
  if (editingId.value && !groups.find((g) => g.id === editingId.value)) {
    cancelEdit();
  }
});
</script>
