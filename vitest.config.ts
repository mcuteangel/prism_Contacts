import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/test-setup.ts'],
    include: ['src/__tests__/**/*.{test,spec}.{js,ts}'],
    environmentOptions: {
      jsdom: {
        url: 'http://localhost:3000',
      },
    },
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{js,ts,vue}'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/coverage/**',
        '**/tests/**',
        '**/*.d.ts',
        '**/main.ts',
        '**/vite-env.d.ts',
        '**/App.vue',
      ],
    },
    server: {
      deps: {
        inline: ['@vue'],
      },
    },
  },
});
