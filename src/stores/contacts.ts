import { defineStore } from 'pinia'
import { db, type Contact } from '../database/dexie'
import { useUserStore } from './user'

export const useContactsStore = defineStore('contacts', {
  state: () => ({
    contacts: [] as Contact[],
    loading: false,
    error: null as string | null,
  }),
  actions: {
    async fetchContacts() {
      this.loading = true
      try {
        const userStore = useUserStore()
        const user = userStore.currentUser
        if (user?.role === 'admin') {
          this.contacts = await db.contacts.toArray()
        } else if (user?.id) {
          this.contacts = await db.contacts.where('userId').equals(user.id).toArray()
        } else {
          this.contacts = []
        }
        this.error = null
      } catch (e) {
        this.error = 'خطا در دریافت مخاطبین'
      } finally {
        this.loading = false
      }
    },
    async addContact(contact: Contact) {
      try {
        const userStore = useUserStore()
        const user = userStore.currentUser
        if (!user?.id) throw new Error('کاربر وارد نشده است')
        const now = new Date().toISOString()
        const newContact = { ...contact, createdAt: now, updatedAt: now, userId: user.id }
        const id = await db.contacts.add(newContact)
        this.contacts.push({ ...newContact, id })
        this.error = null
      } catch (e) {
        this.error = 'خطا در افزودن مخاطب'
      }
    },
    async updateContact(contact: Contact) {
      if (!contact.id) return
      try {
        const updated = { ...contact, updatedAt: new Date().toISOString() }
        await db.contacts.update(contact.id, updated)
        const idx = this.contacts.findIndex(c => c.id === contact.id)
        if (idx !== -1) this.contacts[idx] = updated
        this.error = null
      } catch (e) {
        this.error = 'خطا در ویرایش مخاطب'
      }
    },
    async deleteContact(id: number) {
      try {
        await db.contacts.delete(id)
        this.contacts = this.contacts.filter(c => c.id !== id)
        this.error = null
      } catch (e) {
        this.error = 'خطا در حذف مخاطب'
      }
    },
  },
}) 