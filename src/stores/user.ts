import { defineStore } from 'pinia';
import type { User } from '../database/dexie';
import type { PrismContactsDB } from '../database/dexie';

function hashPassword(password: string): string {
  // Simple hash for demo (not secure for production)
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = (hash << 5) - hash + password.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString();
}

export const useUserStore = defineStore('user', {
  state: () => ({
    currentUser: null as User | null,
    error: null as string | null,
    loading: false,
  }),
  actions: {
    /**
     * ورود کاربر با نام کاربری و رمز عبور
     * @param username
     * @param password
     * @param dbInstance پایگاه داده مورد استفاده (اجباری)
     */
    async login(username: string, password: string, dbInstance: PrismContactsDB) {
      this.loading = true;
      try {
        const user = await dbInstance.users.where('username').equals(username).first();
        if (!user || user.passwordHash !== hashPassword(password)) {
          this.error = 'نام کاربری یا رمز عبور اشتباه است';
          this.currentUser = null;
          return false;
        }
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.error = null;
        return true;
      } catch (e) {
        console.error('login error:', e);
        this.error = 'خطا در ورود';
        return false;
      } finally {
        this.loading = false;
      }
    },
    /**
     * ثبت‌نام کاربر جدید
     * @param username
     * @param password
     * @param role
     * @param dbInstance پایگاه داده مورد استفاده (اجباری)
     */
    async register(username: string, password: string, role: 'admin' | 'user', dbInstance: PrismContactsDB) {
      this.loading = true;
      try {
        const exists = await dbInstance.users.where('username').equals(username).first();
        if (exists) {
          this.error = 'این نام کاربری قبلاً ثبت شده است';
          return false;
        }
        const user: User = { username, passwordHash: hashPassword(password), role };
        const id = await dbInstance.users.add(user);
        this.currentUser = { ...user, id };
        localStorage.setItem('currentUser', JSON.stringify({ ...user, id }));
        this.error = null;
        return true;
      } catch (e) {
        console.error('register error:', e);
        this.error = 'خطا در ثبت‌نام';
        return false;
      } finally {
        this.loading = false;
      }
    },
    logout() {
      this.currentUser = null;
      localStorage.removeItem('currentUser');
    },
    /**
     * بارگذاری کاربر از localStorage
     * @param dbInstance پایگاه داده مورد استفاده (اجباری)
     */
    loadFromStorage(dbInstance: PrismContactsDB) {
      const data = localStorage.getItem('currentUser');
      if (data) {
        this.currentUser = JSON.parse(data);
      }
    },
  },
});
