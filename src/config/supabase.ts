/**
 * Supabase configuration
 *
 * This file contains all the configuration related to Supabase,
 * including table names, storage buckets, and other constants.
 */

export const TABLES = {
  CONTACTS: 'contacts',
  // Add other table names here as needed
} as const;

export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  ATTACHMENTS: 'attachments',
} as const;

export const AUTH_EVENTS = {
  SIGNED_IN: 'SIGNED_IN',
  SIGNED_OUT: 'SIGNED_OUT',
  TOKEN_REFRESHED: 'TOKEN_REFRESHED',
  USER_UPDATED: 'USER_UPDATED',
  PASSWORD_RECOVERY: 'PASSWORD_RECOVERY',
} as const;

export const SUBSCRIPTION_EVENTS = {
  INSERT: 'INSERT',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  // Add other subscription events as needed
} as const;

// Default query options
export const DEFAULT_QUERY_OPTIONS = {
  limit: 50,
  ascending: false,
  sortBy: 'updated_at',
} as const;

// Cache settings
export const CACHE_KEYS = {
  USER_PROFILE: 'user_profile',
  USER_SETTINGS: 'user_settings',
  // Add other cache keys as needed
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NOT_AUTHENTICATED: 'لطفا وارد حساب کاربری خود شوید',
  PERMISSION_DENIED: 'شما مجوز انجام این عملیات را ندارید',
  NETWORK_ERROR: 'خطا در اتصال به سرور. لطفا اتصال اینترنت خود را بررسی کنید',
  UNKNOWN_ERROR: 'خطای ناشناخته ای رخ داد. لطفا دوباره امتحان کنید',
  INVALID_EMAIL: 'فرمت ایمیل نامعتبر است',
  WEAK_PASSWORD: 'رمز عبور باید حداقل ۶ کاراکتر داشته باشد',
  EMAIL_ALREADY_IN_USE: 'این ایمیل قبلا ثبت نام کرده است',
  USER_NOT_FOUND: 'کاربری با این مشخصات یافت نشد',
  WRONG_PASSWORD: 'کلمه عبور اشتباه است',
  // Add other error messages as needed
} as const;

// Validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
  // Add other validation patterns as needed
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'sb:auth_token',
  REFRESH_TOKEN: 'sb:refresh_token',
  USER_ID: 'sb:user_id',
  // Add other storage keys as needed
} as const;
