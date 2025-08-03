import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import GroupSelector from '@/components/GroupSelector.vue';
import { nextTick } from 'vue';

describe('GroupSelector.vue', () => {
  const mockGroups = [
    { id: 1, name: 'دوستان' },
    { id: 2, name: 'خانواده' },
    { id: 3, name: 'همکاران' },
  ];

  const mockSuggestedGroups = [
    { id: 4, name: 'پیشنهادی ۱' },
    { id: 5, name: 'پیشنهادی ۲' },
  ];

  it('رندر صحیح گروه‌های پیشنهادی', async () => {
    const wrapper = mount(GroupSelector, {
      props: {
        modelValue: [],
        groups: mockGroups,
        suggestedGroups: mockSuggestedGroups,
      },
    });

    // بررسی نمایش گروه‌های پیشنهادی
    const suggestedButtons = wrapper.findAll('.text-blue-600 + div button');
    expect(suggestedButtons).toHaveLength(mockSuggestedGroups.length);

    // بررسی متن دکمه‌های پیشنهادی
    mockSuggestedGroups.forEach((group, index) => {
      expect(suggestedButtons[index].text()).toBe(group.name);
    });
  });

  it('نمایش گروه پیش‌فرض وقتی گروهی انتخاب نشده', () => {
    const wrapper = mount(GroupSelector, {
      props: {
        modelValue: [],
        groups: mockGroups,
      },
    });

    const select = wrapper.find('select');
    expect((select.element as HTMLSelectElement).value).toBe('0');
  });

  it('آپدیت مدل با انتخاب گروه', async () => {
    const wrapper = mount(GroupSelector, {
      props: {
        modelValue: [],
        groups: mockGroups,
      },
    });

    // انتخاب گروه
    await wrapper.find('select').setValue('2');

    // بررسی ارسال رویداد به همراه مقدار صحیح
    const updateEvents = wrapper.emitted('update:modelValue');
    expect(updateEvents).toBeTruthy();
    expect(updateEvents?.[0]).toEqual([[2]]);
  });

  it('اضافه کردن گروه پیشنهادی', async () => {
    const wrapper = mount(GroupSelector, {
      props: {
        modelValue: [],
        groups: mockGroups,
        suggestedGroups: mockSuggestedGroups,
      },
    });

    // کلیک روی دکمه گروه پیشنهادی
    await wrapper.findAll('.text-blue-600 + div button')[0].trigger('click');

    // بررسی ارسال رویداد اضافه کردن گروه
    const addGroupEvents = wrapper.emitted('add-group');
    expect(addGroupEvents).toBeTruthy();
    expect(addGroupEvents?.[0]).toEqual([mockSuggestedGroups[0].id]);
  });

  it('نمایش پیام وقتی گروهی وجود ندارد', () => {
    const wrapper = mount(GroupSelector, {
      props: {
        modelValue: [],
        groups: [],
      },
    });

    // بررسی نمایش پیام عدم وجود گروه
    expect(wrapper.text()).toContain('هیچ گروهی یافت نشد');
  });

  it('مدیریت گروه پیش‌فرض', async () => {
    const wrapper = mount(GroupSelector, {
      props: {
        modelValue: [1],
        groups: mockGroups,
      },
    });

    // انتخاب گروه پیش‌فرض
    await wrapper.find('select').setValue('0');

    // بررسی ارسال آرایه خالی برای گروه پیش‌فرض
    const updateEvents = wrapper.emitted('update:modelValue');
    expect(updateEvents?.[0]).toEqual([[]]);
  });
});
