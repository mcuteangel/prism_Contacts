import { config } from '@vue/test-utils';

// Mock Vue Router
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  go: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  currentRoute: { value: { path: '/', name: 'home' } },
  resolve: vi.fn((to) => ({ href: to })),
};

// Simple translation mock
const t = (key: string) => key;

// Global mocks
config.global.mocks = {
  $t: t,
  $router: mockRouter,
  $route: mockRouter.currentRoute,
  $i18n: { t },
};

// Global components
config.global.components = {
  'font-awesome-icon': { template: '<span />' },
  'router-link': { props: ['to'], template: '<a :href="to"><slot /></a>' },
};

// Global stubs
config.global.stubs = {
  'font-awesome-icon': true,
  'router-link': { template: '<a><slot /></a>' },
};
