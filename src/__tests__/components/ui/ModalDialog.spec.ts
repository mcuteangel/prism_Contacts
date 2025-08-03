import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { nextTick } from 'vue';
import ModalDialog from '@/components/ui/ModalDialog.vue';

// Mock window/document event listeners
vi.spyOn(window, 'addEventListener');
vi.spyOn(window, 'removeEventListener');

// Helper factory
const factory = (props: Record<string, any> = {}, slots: Record<string, any> = {}) => {
  return mount(ModalDialog, {
    props: {
      modelValue: true, // Default to visible
      title: 'عنوان پیش‌فرض',
      ...props,
    },
    slots: {
      body: '<p>محتوا</p>',
      actions: '<button>تایید</button>',
      ...slots,
    },
  });
};

describe('ModalDialog.vue', () => {
  // پاک کردن mock ها بعد از هر تست
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('نمایش مودال زمانی که modelValue درست است', async () => {
    const wrapper = factory({ modelValue: true });
    await nextTick(); // منتظر رندر اولیه

    const modal = wrapper.find('.fixed.inset-0');
    expect(modal.exists(), 'Modal should be visible when modelValue is true').toBe(true);

    // بررسی عنوان و اسلات‌ها
    expect(wrapper.find('h3').text()).toContain('عنوان پیش‌فرض');
    expect(wrapper.find('.mb-6').html()).toContain('محتوا');
    expect(wrapper.find('.justify-end').html()).toContain('تایید');
  });

  it('عدم نمایش مودال زمانی که modelValue نادرست است', () => {
    const wrapper = factory({ modelValue: false });

    const modal = wrapper.find('.fixed.inset-0');
    expect(modal.exists(), 'Modal should not be visible when modelValue is false').toBe(false);
  });

  it('بستن مودال با کلید ESC', async () => {
    const wrapper = factory({ modelValue: true });
    await nextTick();

    expect(wrapper.find('.fixed.inset-0').exists(), 'Modal should be visible').toBe(true);

    // شبیه‌سازی فشردن کلید Escape روی window
    await window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    // بررسی ارسال event
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('حذف event listener هنگام بسته شدن کامپوننت', async () => {
    const wrapper = factory({ modelValue: true });
    await nextTick();

    // Listener باید اضافه شده باشد
    expect(window.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));

    // کامپوننت را unmount می‌کنیم
    wrapper.unmount();

    // Listener باید حذف شده باشد
    expect(window.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('نمایش عنوان اختیاری', async () => {
    const customTitle = 'عنوان سفارشی';
    const wrapper = factory({ title: customTitle });
    await nextTick();

    expect(wrapper.find('h3').text()).toContain(customTitle);
  });

  it('نمایش اسلات‌های اختیاری', async () => {
    const customBody = '<div class="custom-body">محتوای سفارشی</div>';
    const customActions = '<button class="custom-action">دکمه سفارشی</button>';

    const wrapper = factory(
      {},
      {
        body: customBody,
        actions: customActions,
      }
    );
    await nextTick();

    expect(wrapper.find('.custom-body').exists()).toBe(true);
    expect(wrapper.find('.custom-action').exists()).toBe(true);
  });
});
