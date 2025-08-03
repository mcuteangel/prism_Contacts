# راهنمای نصب و راه‌اندازی Supabase

این سند مراحل نصب و راه‌اندازی Supabase را برای پروژه مدیریت مخاطبین توضیح می‌دهد.

## پیش‌نیازها

- حساب کاربری در [Supabase](https://supabase.com/)
- پروژه‌ای در Supabase ایجاد شده
- Node.js نسخه ۱۶ یا بالاتر
- npm یا yarn

## مراحل راه‌اندازی

### ۱. تنظیم متغیرهای محیطی

فایل `.env` را در ریشه پروژه ایجاد کرده و مقادیر زیر را وارد کنید:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### ۲. ایجاد جداول و سیاست‌های دسترسی

۱. به کنسول Supabase بروید
۲. به بخش SQL Editor بروید
۳. محتوای فایل `supabase/migrations/20240730_initial_schema.sql` را کپی کرده و اجرا کنید

### ۳. فعال‌سازی احراز هویت

۱. به بخش Authentication در کنسول Supabase بروید
۲. در تب Providers، سرویس Email/Password را فعال کنید
۳. در تب Email Templates می‌توانید قالب‌های ایمیل را سفارشی کنید

## استفاده در پروژه

### راه‌اندازی اولیه

کلاینت Supabase به طور خودکار در فایل `src/supabase.ts` تنظیم شده است. برای استفاده در کامپوننت‌ها:

```typescript
import { supabase } from '@/supabase';

// مثال: دریافت مخاطبین
const fetchContacts = async () => {
  const { data, error } = await supabase.from('contacts').select('*');

  if (error) {
    console.error('خطا در دریافت مخاطبین:', error);
    return [];
  }

  return data;
};
```

### استورهای Pinia

دو استور اصلی برای مدیریت وضعیت برنامه ایجاد شده‌اند:

1. **authStore**: مدیریت احراز هویت کاربر
2. **supabaseContactsStore**: مدیریت مخاطبین با قابلیت همگام‌سازی با Supabase

#### مثال استفاده از authStore

```typescript
import { useAuthStore } from '@/stores/authStore';

const authStore = useAuthStore();

// ورود کاربر
await authStore.signIn('user@example.com', 'password');

// ثبت‌نام کاربر جدید
await authStore.signUp('user@example.com', 'password', 'نام کاربر');

// خروج کاربر
authStore.signOut();
```

#### مثال استفاده از supabaseContactsStore

```typescript
import { useContactsStore } from '@/stores/supabaseContactsStore';

const contactsStore = useContactsStore();

// دریافت مخاطبین
await contactsStore.fetchContacts();

// اضافه کردن مخاطب جدید
const newContact = {
  first_name: 'نام',
  last_name: 'خانوادگی',
  email: 'email@example.com',
  phone: '09123456789',
};

await contactsStore.addContact(newContact);

// به‌روزرسانی مخاطب
await contactsStore.updateContact({
  id: 'contact-id',
  first_name: 'نام جدید',
});

// حذف مخاطب
await contactsStore.deleteContact('contact-id');
```

## تست‌ها

برای اجرای تست‌ها:

```bash
npm run test
```

## خطاهای رایج

### خطای "Invalid API key"

مطمئن شوید که کلید Anon Key را به درستی در فایل `.env` قرار داده‌اید.

### خطای "permission denied for table contacts"

مطمئن شوید که:
۱. کاربر احراز هویت شده است
۲. RLS برای جدول contacts فعال است
۳. پالیسی‌های دسترسی به درستی تنظیم شده‌اند

### خطای "Network Error"

مطمئن شوید که:
۱. به اینترنت متصل هستید
۲. URL پروژه Supabase را به درستی وارد کرده‌اید
۳. محدودیت‌های CORS به درستی تنظیم شده‌اند

## توسعه بیشتر

- اضافه کردن آپلود فایل‌های پیوست
- پیاده‌سازی جستجوی پیشرفته
- اضافه کردن دسته‌بندی و برچسب به مخاطبین
- همگام‌سازی آفلاین با IndexedDB

## منابع مفید

- [مستندات Supabase](https://supabase.com/docs)
- [مستندات Pinia](https://pinia.vuejs.org/)
- [مستندات Vue 3](https://v3.vuejs.org/)
