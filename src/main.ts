// ===== IMPORTS & DEPENDENCIES =====
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { useAuthStore } from './stores/authStore';

// styles
import './style.css';
import 'floating-vue/dist/style.css';

// plugins
import FloatingVue from 'floating-vue';
import '@iconify/iconify';

// VeeValidate Configuration
import { configure, defineRule } from 'vee-validate';
import * as AllRules from '@vee-validate/rules';
import { localize } from '@vee-validate/i18n';
// @ts-ignore - Ignore TypeScript error for JSON import
import fa from '@vee-validate/i18n/dist/locale/fa.json';

// ===== CONFIGURATION & CONSTANTS =====

// Configure VeeValidate Rules and Localization
// 1. Define all validation rules from @vee-validate/rules
Object.keys(AllRules).forEach((rule) => {
  // Only define the rule if it's actually a function
  if (typeof (AllRules as any)[rule] === 'function') {
    defineRule(rule, (AllRules as any)[rule]);
  }
});

// 2. Configure VeeValidate to use Persian localization
configure({
  generateMessage: localize({
    fa,
  }),
  validateOnInput: true, // Validate fields on input for better UX
});

// ===== INITIALIZATION & STARTUP =====

/**
 * Initialize the application with offline-first authentication
 */
async function initializeApp() {
  const app = createApp(App);
  const pinia = createPinia();

  app.use(pinia);

  // Initialize auth store with offline-first approach
  const authStore = useAuthStore();
  await authStore.initializeAuth();

  // Set up router and other plugins
  app.use(router);
  app.use(FloatingVue);

  // Mount the app after auth state is ready
  app.mount('#app');

  console.log('🚀 Application initialized with offline-first authentication');
}

// Start the application
initializeApp().catch((error) => {
  console.error('Failed to initialize application:', error);
});
