// This file provides type information for Vue components
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

// Declare module for each component
declare module './ui/FormAlert.vue' {
  import { DefineComponent } from 'vue';
  const component: DefineComponent<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  }>;
  export default component;
}
