import { defineStore } from 'pinia';
import { supabase } from '../supabase';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '../types/supabase';
import { authRepository } from '../services/AuthRepository';

// Global variable to prevent multiple listeners
let authListenerUnsubscribe: (() => void) | null = null;

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    session: null as Session | null,
    profile: null as Profile | null,
    isLoading: false,
    error: null as string | null,
    isAuthReady: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    userName: (state) => state.profile?.full_name || state.user?.email?.split('@')[0],
    userRole: (state) => state.profile?.role ?? 'user',
    isAdmin: (state) => state.profile?.role === 'admin',
  },

  actions: {
    async fetchProfile(userId: string) {
      if (!userId) {
        this.profile = null;
        return;
      }
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        if (error) throw error;
        this.profile = data;
        return data;
      } catch (error: any) {
        console.error('خطا در دریافت پروفایل:', error.message);
        this.profile = null;
        return null;
      }
    },

    /**
     * Initializes the auth state. Tries to load from local DB first (offline-first),
     * then sets up the online listener with Supabase.
     */
    async initializeAuth() {
      // 1. Load from local DB for a fast, offline-first startup
      try {
        const localAuthState = await authRepository.getAuthState();
        if (localAuthState) {
          console.log('✅ وضعیت احراز هویت از حافظه محلی بازیابی شد.');
          this.session = localAuthState.session;
          this.user = localAuthState.session.user;
          this.profile = localAuthState.profile;
        }
      } catch (e) {
        console.error('🔴 خطا در خواندن وضعیت احراز هویت محلی:', e);
      }

      // 2. The app is now ready to be displayed, based on local data.
      if (!this.isAuthReady) {
        this.isAuthReady = true;
        console.log('✅ وضعیت احراز هویت آماده است (بر اساس حافظه محلی).');
      }

      // 3. Set up the Supabase listener for ONLINE changes and sync.
      if (authListenerUnsubscribe) return;

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        console.log('📡 رویداد آنلاین از Supabase دریافت شد:', _event);
        this.isLoading = true;

        if (session) {
          // User is logged in, update state and save to local DB
          this.session = session;
          this.user = session.user;
          const profile = await this.fetchProfile(session.user.id);

          if (profile) {
            await authRepository.saveAuthState(session, profile);
            console.log('💾 وضعیت احراز هویت آنلاین در حافظه محلی ذخیره شد.');
          }
        } else {
          // User is logged out, clear state and local DB
          this.user = null;
          this.session = null;
          this.profile = null;
          await authRepository.clearAuthState();
          console.log('🗑️ وضعیت احراز هویت از حافظه محلی پاک شد.');
        }

        this.isLoading = false;
      });

      authListenerUnsubscribe = () => subscription.unsubscribe();
    },

    async signIn(email: string, password: string) {
      this.isLoading = true;
      this.error = null;
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // Fetch and save profile after successful login
        if (data.session) {
          const profile = await this.fetchProfile(data.user.id);
          if (profile) {
            await authRepository.saveAuthState(data.session, profile);
          }
        }

        return data;
      } catch (error: any) {
        this.error = error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async signUp(email: string, password: string, fullName: string = '') {
      this.isLoading = true;
      this.error = null;
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + '/auth',
            data: {
              full_name: fullName || email.split('@')[0],
            },
          },
        });

        if (error) throw error;

        return {
          ...data,
          message: 'ثبت‌نام با موفقیت انجام شد. لطفاً ایمیل خود را بررسی کنید.',
        };
      } catch (error: any) {
        this.error = error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async signOut() {
      this.isLoading = true;
      try {
        await supabase.auth.signOut();
        // Clear local auth state
        await authRepository.clearAuthState();
        // Clear local state
        this.user = null;
        this.session = null;
        this.profile = null;
      } catch (error: any) {
        this.error = error.message;
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async resetPassword(email: string) {
      this.isLoading = true;
      this.error = null;
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        return true;
      } catch (error: any) {
        this.error = error.message || 'خطا در ارسال لینک بازیابی رمز عبور';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
