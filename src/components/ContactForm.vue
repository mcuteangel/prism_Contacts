<template>
  <form @submit.prevent="onSubmit" class="flex flex-col gap-2 glass p-4 shadow-lg mb-6">
    <div class="flex flex-col sm:flex-row gap-2">
      <input v-model="localForm.name" type="text" placeholder="نام" class="input input-bordered flex-1" required />
      <input v-model="localForm.phone" type="text" placeholder="شماره تلفن" class="input input-bordered flex-1" required />
    </div>
    <div class="flex flex-col sm:flex-row gap-2">
      <select v-model="localForm.groupIds" multiple class="input flex-1" :size="Math.max(2, groups.length)">
        <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
      </select>
      <span class="text-xs text-gray-500">(برای انتخاب چند گروه، Ctrl یا Cmd را نگه دارید)</span>
    </div>
    <div v-if="suggestedGroups.length" class="mb-2 flex flex-wrap gap-2">
      <span class="text-xs text-blue-600">پیشنهاد گروه:</span>
      <button v-for="g in suggestedGroups" :key="g.id" type="button" class="btn btn-secondary btn-xs" @click="addSuggestedGroup(g.id)">{{ g.name }}</button>
    </div>
    <div class="mb-2">
      <div class="flex items-center gap-2 mb-1">
        <span class="font-bold">فیلدهای سفارشی</span>
        <button type="button" class="btn btn-primary btn-xs" @click="addCustomField">افزودن فیلد</button>
      </div>
      <div v-for="(field, idx) in customFields" :key="field.key" class="flex gap-2 mb-1 items-center">
        <input v-model="field.key" type="text" placeholder="نام فیلد" class="input input-bordered w-32" required />
        <select v-model="field.type" class="input input-bordered w-24">
          <option value="text">متن</option>
          <option value="number">عدد</option>
          <option value="date">تاریخ</option>
        </select>
        <input v-if="field.type === 'text'" v-model="field.value" type="text" class="input input-bordered flex-1" />
        <input v-else-if="field.type === 'number'" v-model.number="field.value" type="number" class="input input-bordered flex-1" />
        <input v-else-if="field.type === 'date'" v-model="field.value" type="date" class="input input-bordered flex-1" />
        <button type="button" class="btn btn-error btn-xs" @click="removeCustomField(idx)">حذف</button>
      </div>
    </div>
    <div class="flex gap-2 justify-end">
      <button v-if="!editingId" type="submit" class="btn btn-primary">افزودن مخاطب</button>
      <button v-else type="submit" class="btn btn-success">ذخیره تغییرات</button>
      <button v-if="editingId" type="button" @click="$emit('cancel')" class="btn btn-secondary">انصراف</button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'

const props = defineProps<{
  form: { name: string; phone: string; groupIds?: number[]; customFields?: Record<string, any> }
  editingId: number | null
  groups: { id: number; name: string }[]
}>()
const emit = defineEmits(['submit', 'cancel'])

const localForm = ref({ ...props.form, groupIds: props.form.groupIds ? [...props.form.groupIds] : [], customFields: { ...props.form.customFields } })

const customFields = ref<{ key: string; type: 'text' | 'number' | 'date'; value: any }[]>([])

watch(() => props.form, (val) => {
  localForm.value = { ...val, groupIds: val.groupIds ? [...val.groupIds] : [], customFields: { ...val.customFields } }
  customFields.value = val.customFields ? Object.entries(val.customFields).map(([key, value]) => {
    let type: 'text' | 'number' | 'date' = 'text'
    if (typeof value === 'number') type = 'number'
    else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) type = 'date'
    return { key, type, value }
  }) : []
})

watch(customFields, (fields) => {
  localForm.value.customFields = {}
  for (const f of fields) {
    localForm.value.customFields[f.key] = f.value
  }
}, { deep: true })

const addCustomField = () => {
  customFields.value.push({ key: '', type: 'text', value: '' })
}
const removeCustomField = (idx: number) => {
  customFields.value.splice(idx, 1)
}

// مقداردهی اولیه هنگام mount
if (props.form.customFields) {
  customFields.value = Object.entries(props.form.customFields).map(([key, value]) => {
    let type: 'text' | 'number' | 'date' = 'text'
    if (typeof value === 'number') type = 'number'
    else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) type = 'date'
    return { key, type, value }
  })
}

const onSubmit = () => {
  emit('submit', { ...localForm.value })
}

const suggestedGroups = computed(() => {
  const name = localForm.value.name.toLowerCase()
  const custom = Object.values(localForm.value.customFields || {}).map(v => String(v).toLowerCase())
  return props.groups.filter(g => {
    const gname = g.name.toLowerCase()
    return name.includes(gname) || custom.some(val => val.includes(gname))
  }).filter(g => !localForm.value.groupIds.includes(g.id))
})
const addSuggestedGroup = (id: number) => {
  if (!localForm.value.groupIds.includes(id))
    localForm.value.groupIds.push(id)
}
</script> 