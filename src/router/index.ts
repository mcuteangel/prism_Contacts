// ===== REFACTORED CODE (src/router/index.ts) =====
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

// تعریف متای مسیرها
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    guestOnly?: boolean;
    title?: string;
  }
}

// تعریف مسیرهای برنامه
const routes = [
  {
    path: '/',
    name: 'home',
    redirect: { name: 'dashboard' },
    meta: { requiresAuth: true },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { requiresAuth: true, title: 'داشبورد' },
  },
  {
    path: '/contacts',
    name: 'contacts',
    component: () => import('../views/ContactsView.vue'),
    meta: { requiresAuth: true, title: 'مخاطبین' },
  },
  {
    path: '/contacts/new',
    name: 'new-contact',
    component: () => import('../views/NewContactView.vue'),
    meta: { requiresAuth: true, title: 'مخاطب جدید' },
  },
  {
    path: '/contacts/:id',
    name: 'contact-details',
    component: () => import('../views/ContactDetailsView.vue'),
    meta: { requiresAuth: true, title: 'جزئیات مخاطب' },
    props: true,
  },
  {
    path: '/contacts/:id/edit',
    name: 'edit-contact',
    component: () => import('../views/EditContactView.vue'),
    meta: { requiresAuth: true, title: 'ویرایش مخاطب' },
    props: true,
  },
  {
    path: '/groups',
    name: 'groups',
    component: () => import('../views/GroupsView.vue'),
    meta: { requiresAuth: true, title: 'گروه‌ها' },
  },
  {
    path: '/fields',
    name: 'fields',
    component: () => import('../views/CustomFieldsView.vue'),
    meta: { requiresAuth: true, title: 'فیلدهای سفارشی' },
  },
  {
    path: '/tools',
    name: 'tools',
    component: () => import('../views/ToolsView.vue'),
    meta: { requiresAuth: true, title: 'ابزارها' },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/SettingsView.vue'),
    meta: { requiresAuth: true, title: 'تنظیمات' },
  },
  {
    path: '/auth',
    name: 'auth',
    component: () => import('../views/AuthView.vue'),
    meta: { guestOnly: true, title: 'ورود / ثبت‌نام' },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('../views/ForgotPasswordView.vue'),
    meta: { guestOnly: true, title: 'بازیابی رمز عبور' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
    meta: { title: 'صفحه پیدا نشد' },
  },
];

// ایجاد روتر
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  scrollBehavior(_to, _from, savedPosition) {
    // بازگشت به موقعیت قبلی یا بالای صفحه
    if (savedPosition) {
      return savedPosition;
    }
    return { left: 0, top: 0 };
  },
});

// میدلور جدید و بدون انتظار (Non-blocking)
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  // ۱. ما دیگر منتظر isAuthReady نمی‌مانیم. صفحه لودینگ در App.vue این کار را می‌کند.
  // ۲. ما فقط وضعیت فعلی را می‌خوانیم.
  const isAuthenticated = authStore.isAuthenticated;

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const guestOnly = to.matched.some((record) => record.meta.guestOnly);

  // تنظیم عنوان صفحه
  document.title = to.meta.title ? `${to.meta.title} | مدیریت مخاطبین` : 'مدیریت مخاطبین';

  // ۳. تصمیم‌گیری بر اساس وضعیت فعلی
  if (requiresAuth && !isAuthenticated && authStore.isAuthReady) {
    // فقط زمانی که مطمئنیم کاربر لاگین نیست، به صفحه ورود هدایت می‌کنیم
    return next({ name: 'auth', query: { redirect: to.fullPath } });
  }

  if (guestOnly && isAuthenticated && authStore.isAuthReady) {
    return next({ name: 'dashboard' });
  }

  // در غیر این صورت (یا زمانی که isAuthReady هنوز false است)، اجازه عبور می‌دهیم
  // چون App.vue صفحه لودینگ را نمایش می‌دهد.
  return next();
});

// هندل خطاهای مسیریابی
router.onError((error) => {
  console.error('خطای مسیریابی:', error);
  // در صورت نیاز می‌توانید کاربر را به صفحه خطا هدایت کنید
  // router.push({ name: 'not-found' });
});

export default router;
