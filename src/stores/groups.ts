import { defineStore } from 'pinia'
import { db, type Group } from '../database/dexie'

export const useGroupsStore = defineStore('groups', {
  state: () => ({
    groups: [] as Group[],
    loading: false,
    error: null as string | null,
  }),
  actions: {
    async fetchGroups() {
      this.loading = true
      try {
        this.groups = await db.groups.toArray()
        this.error = null
      } catch (e) {
        this.error = 'خطا در دریافت گروه‌ها'
      } finally {
        this.loading = false
      }
    },
    async addGroup(group: Group) {
      try {
        const id = await db.groups.add(group)
        this.groups.push({ ...group, id })
        this.error = null
      } catch (e) {
        this.error = 'خطا در افزودن گروه'
      }
    },
    async updateGroup(group: Group) {
      if (!group.id) return
      try {
        await db.groups.update(group.id, group)
        const idx = this.groups.findIndex(g => g.id === group.id)
        if (idx !== -1) this.groups[idx] = group
        this.error = null
      } catch (e) {
        this.error = 'خطا در ویرایش گروه'
      }
    },
    async deleteGroup(id: number) {
      try {
        await db.groups.delete(id)
        this.groups = this.groups.filter(g => g.id !== id)
        this.error = null
      } catch (e) {
        this.error = 'خطا در حذف گروه'
      }
    },
  },
}) 