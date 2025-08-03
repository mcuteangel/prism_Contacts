import { vi, beforeAll, afterAll } from 'vitest';
import { config } from '@vue/test-utils';

// Mock global components
config.global.components = {
  'router-link': {
    template: '<a><slot></slot></a>',
  },
  'font-awesome-icon': {
    template: '<i><slot></slot></i>',
  },
};

// Simple i18n mock
const i18n = {
  install: (app: any) => {
    app.config.globalProperties.$t = (key: string) => key;
    app.config.globalProperties.$i18n = {
      locale: 'fa',
      t: (key: string) => key,
    };
  },
};

// Simple Pinia mock
const pinia = {
  install: (app: any) => {
    app.config.globalProperties.$pinia = {
      state: {},
      _p: [],
      _a: null,
      _e: { scope: { effects: [] } },
      _s: new Map(),
      use: vi.fn(),
    };
  },
};

const IDBKeyRange = class {};

// Global config
config.global.plugins = [i18n, pinia];

// Mock document
const mockElement = {
  tagName: 'div',
  nodeType: 1,
  style: {},
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
    contains: vi.fn().mockReturnValue(false),
  },
  setAttribute: vi.fn(),
  getAttribute: vi.fn().mockReturnValue(null),
  removeAttribute: vi.fn(),
  appendChild: vi.fn().mockImplementation(function (this: any, child: any) {
    if (child) child.parentNode = this;
    return child;
  }),
  insertBefore: vi.fn().mockImplementation(function (this: any, newNode: any) {
    if (newNode) newNode.parentNode = this;
    return newNode;
  }),
  removeChild: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  contains: vi.fn().mockReturnValue(false),
  parentNode: null,
  nextSibling: null,
  previousSibling: null,
  firstChild: null,
  lastChild: null,
};

// Set up document mock
const document = {
  createElement: vi.fn().mockReturnValue({ ...mockElement }),
  createTextNode: vi.fn().mockImplementation((text: string) => ({
    nodeType: 3,
    textContent: text,
    parentNode: null,
  })),
  createComment: vi.fn().mockImplementation((text: string) => ({
    nodeType: 8,
    textContent: text,
    parentNode: null,
  })),
  getElementById: vi.fn().mockReturnValue(null),
  querySelector: vi.fn().mockReturnValue(null),
  querySelectorAll: vi.fn().mockReturnValue([]),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  documentElement: { ...mockElement, tagName: 'HTML' },
  head: { ...mockElement, tagName: 'HEAD' },
  body: { ...mockElement, tagName: 'BODY' },
};

// Set up window mock
const window = {
  document,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  requestAnimationFrame: (callback: FrameRequestCallback) => {
    return setTimeout(callback, 0);
  },
  cancelAnimationFrame: (id: number) => {
    clearTimeout(id);
  },
  matchMedia: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
  HTMLElement: class {},
  customElements: {
    define: vi.fn(),
    get: vi.fn(),
    whenDefined: vi.fn().mockResolvedValue(undefined),
  },
};

// Assign mocks to global objects
Object.assign(global, {
  window,
  document,
  HTMLElement: class {},
  customElements: window.customElements,
  ResizeObserver: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
});

// Import fake-indexeddb
import 'fake-indexeddb/auto';

// Setup before all tests
beforeAll(async () => {
  // Add any global test setup here
  await new Promise((resolve) => setTimeout(resolve, 50));
});

// Add cleanup after tests if needed
afterAll(() => {
  // Clean up any resources if necessary
});
