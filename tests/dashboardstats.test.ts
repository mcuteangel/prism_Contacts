import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import DashboardStats from '../src/components/DashboardStats.vue';

// Mock Chart.js
vi.mock('chart.js/auto', () => ({
  default: class {
    destroy() {}
    constructor() {}
  },
}));

describe('DashboardStats.vue', () => {
  const contacts = [
    { id: 1, name: 'علی', groupIds: [1] },
    { id: 2, name: 'Sara', groupIds: [2] },
    { id: 3, name: 'Reza', groupIds: [1, 2] },
  ];
  const groups = [
    { id: 1, name: 'دوستان' },
    { id: 2, name: 'خانواده' },
  ];

  it('باید تعداد کل مخاطبین و گروه‌ها را نمایش دهد', () => {
    const wrapper = mount(DashboardStats, { props: { contacts, groups } });
    expect(wrapper.text()).toContain('3'); // تعداد مخاطبین
    expect(wrapper.text()).toContain('2'); // تعداد گروه‌ها
    expect(wrapper.text()).toContain('تعداد کل مخاطبین');
    expect(wrapper.text()).toContain('تعداد گروه‌ها');
  });

  it('edge: بدون داده باید ۰ نمایش دهد', () => {
    const wrapper = mount(DashboardStats, { props: { contacts: [], groups: [] } });
    expect(wrapper.text()).toContain('0');
  });

  it('integration: تغییر داده باید مقدار را آپدیت کند', async () => {
    const wrapper = mount(DashboardStats, { props: { contacts: [], groups: [] } });
    expect(wrapper.text()).toContain('0');
    await wrapper.setProps({ contacts, groups });
    expect(wrapper.text()).toContain('3');
    expect(wrapper.text()).toContain('2');
  });

  it('accessibility: باید عنوان و توضیحات مناسب داشته باشد', () => {
    const wrapper = mount(DashboardStats, { props: { contacts, groups } });
    expect(wrapper.find('h2').text()).toContain('داشبورد آماری');
    expect(wrapper.find('canvas').exists()).toBe(true);
  });
}); 