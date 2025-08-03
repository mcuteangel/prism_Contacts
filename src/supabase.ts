import { createClient } from '@supabase/supabase-js';

// این مقادیر از فایل .env بارگذاری می‌شوند
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// بررسی وجود متغیرهای محیطی
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'لطفاً متغیرهای محیطی VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY را در فایل .env تنظیم کنید.'
  );
}

// ایجاد کلاینت Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // ذخیره وضعیت احراز هویت در localStorage
    autoRefreshToken: true, // تمدید خودکار توکن
    detectSessionInUrl: true, // تشخیص وضعیت احراز هویت از URL
  },
});

// تابع کمکی برای گرفتن شناسه کاربر جاری
export const getCurrentUserId = async (): Promise<string | undefined> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id;
};
