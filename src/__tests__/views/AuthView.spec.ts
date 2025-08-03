import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useUserStore } from '@/stores/user';
import { createRouter, createMemoryHistory } from 'vue-router';
import AuthView from '@/views/AuthView.vue';

// Mock the user store
vi.mock('@/stores/user', () => ({
  useUserStore: vi.fn(),
}));

// Mock the router
const mockRouter = {
  push: vi.fn(),
};

// Mock the database
const mockDb = {
  users: {
    findOne: vi.fn(),
    insert: vi.fn(),
  },
};

const createWrapper = () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>Home</div>' } },
      { path: '/auth', component: AuthView },
    ],
  });

  return mount(AuthView, {
    global: {
      plugins: [router],
      mocks: {
        $router: mockRouter,
        $db: mockDb,
      },
    },
  });
};

describe('AuthView.vue', () => {
  let userStore: any;

  beforeEach(() => {
    setActivePinia(createPinia());

    // Reset mocks
    vi.clearAllMocks();

    // Setup user store mock
    userStore = {
      currentUser: null,
      error: null,
      login: vi.fn().mockResolvedValue({ id: 1, username: 'testuser' }),
      register: vi.fn().mockResolvedValue({ id: 2, username: 'newuser' }),
    };

    (useUserStore as any).mockReturnValue(userStore);
  });

  it('renders login form by default', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('form').exists()).toBe(true);
    expect(wrapper.find('input[placeholder="نام کاربری"]').exists()).toBe(true);
    expect(wrapper.find('input[placeholder="رمز عبور"]').exists()).toBe(true);
    expect(wrapper.find('button[type="submit"]').text()).toBe('ورود');
  });

  it('switches to register form when clicking register link', async () => {
    const wrapper = createWrapper();

    // Click the register link
    await wrapper.find('button.text-blue-600').trigger('click');

    // Should show register form
    expect(wrapper.find('form').exists()).toBe(true);
    expect(wrapper.find('button[type="submit"]').text()).toBe('ثبت‌نام');
    expect(wrapper.text()).toContain('حساب دارید؟');
  });

  it('calls login with correct credentials', async () => {
    const wrapper = createWrapper();

    // Fill in login form
    await wrapper.find('input[placeholder="نام کاربری"]').setValue('testuser');
    await wrapper.find('input[placeholder="رمز عبور"]').setValue('password123');

    // Submit the form
    await wrapper.find('form').trigger('submit');

    // Check if login was called with correct credentials
    expect(userStore.login).toHaveBeenCalledWith('testuser', 'password123', expect.anything());
  });

  it('calls register with correct data', async () => {
    const wrapper = createWrapper();

    // Switch to register form
    await wrapper.find('button.text-blue-600').trigger('click');

    // Fill in register form
    await wrapper.find('input[placeholder="نام کاربری"]').setValue('newuser');
    await wrapper.find('input[placeholder="رمز عبور"]').setValue('securepass');

    // Submit the form
    await wrapper.find('form').trigger('submit');

    // Check if register was called with correct data
    expect(userStore.register).toHaveBeenCalledWith(
      'newuser',
      'securepass',
      'user',
      expect.anything()
    );
  });

  it('shows error message when login fails', async () => {
    userStore.login = vi.fn().mockRejectedValue(new Error('Invalid credentials'));
    userStore.error = 'نام کاربری یا رمز عبور اشتباه است';

    const wrapper = createWrapper();

    // Submit the form
    await wrapper.find('form').trigger('submit');

    // Check if error message is shown
    expect(wrapper.find('.text-red-500').exists()).toBe(true);
    expect(wrapper.find('.text-red-500').text()).toContain('نام کاربری یا رمز عبور اشتباه است');
  });

  it('redirects to home after successful login', async () => {
    const wrapper = createWrapper();

    // Mock successful login
    userStore.currentUser = { id: 1, username: 'testuser' };

    // Wait for the next tick to allow the watcher to run
    await wrapper.vm.$nextTick();

    // Check if router.push was called with the correct path
    expect(mockRouter.push).toHaveBeenCalledWith('/');
  });

  it('switches back to login form after successful registration', async () => {
    const wrapper = createWrapper();

    // Switch to register form
    await wrapper.find('button.text-blue-600').trigger('click');

    // Submit the form
    await wrapper.find('form').trigger('submit');

    // Should switch back to login form
    expect(wrapper.find('button[type="submit"]').text()).toBe('ورود');
  });

  it('validates required fields', async () => {
    const wrapper = createWrapper();

    // Try to submit without filling in required fields
    const form = wrapper.find('form');
    const preventDefault = vi.fn();
    await form.trigger('submit', { preventDefault });

    // Check if the native form validation prevented submission
    expect(preventDefault).toHaveBeenCalled();
    expect(userStore.login).not.toHaveBeenCalled();
  });
});
