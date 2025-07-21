import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { mount } from '@vue/test-utils';
import GroupManager from '../src/components/GroupManager.vue';

// موک ساده برای db.groups
let groupsData: any[] = [];
vi.mock('../src/database/dexie', () => ({
  db: {
    groups: {
      toArray: async () => groupsData,
      add: async (group: any) => {
        const id = groupsData.length + 1;
        groupsData.push({ ...group, id });
        return id;
      },
      put: async (group: any) => {
        const idx = groupsData.findIndex((g) => g.id === group.id);
        if (idx !== -1) groupsData[idx] = { ...group };
      },
      get: async (id: number) => groupsData.find((g) => g.id === id),
      delete: async (id: number) => {
        groupsData = groupsData.filter((g) => g.id !== id);
      },
    },
  },
}));

beforeEach(() => {
  setActivePinia(createPinia());
  groupsData = [];
  localStorage.clear();
});

describe('GroupManager.vue', () => {
  function mountWithPinia() {
    return mount(GroupManager, {
      global: { plugins: [createPinia()] },
    });
  }

  it('باید فرم افزودن گروه را رندر کند', () => {
    const wrapper = mountWithPinia();
    expect(wrapper.find('input[placeholder="نام گروه"]').exists()).toBe(true);
    expect(wrapper.find('button.btn-primary').exists()).toBe(true);
  });

  it('افزودن گروه جدید', async () => {
    const wrapper = mountWithPinia();
    const input = wrapper.find('input[placeholder="نام گروه"]');
    await input.setValue('دوستان');
    await wrapper.find('form').trigger('submit.prevent');
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('دوستان');
  });

  it('ویرایش گروه', async () => {
    const wrapper = mountWithPinia();
    const input = wrapper.find('input[placeholder="نام گروه"]');
    await input.setValue('خانواده');
    await wrapper.find('form').trigger('submit.prevent');
    await wrapper.vm.$nextTick();
    const editBtn = wrapper.find('button.btn-warning');
    await editBtn.trigger('click');
    expect((wrapper.find('input[placeholder="نام گروه"]').element as HTMLInputElement).value).toBe(
      'خانواده'
    );
    await input.setValue('فامیل');
    await wrapper.find('button.btn-success').trigger('submit');
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('فامیل');
  });

  it('حذف گروه', async () => {
    const wrapper = mountWithPinia();
    const input = wrapper.find('input[placeholder="نام گروه"]');
    await input.setValue('کار');
    await wrapper.find('form').trigger('submit.prevent');
    await wrapper.vm.$nextTick();
    const removeBtn = wrapper.find('button.btn-error');
    await removeBtn.trigger('click');
    await wrapper.vm.$nextTick();
    // بررسی حذف واقعی در داده mock
    expect(groupsData.find((g) => g.name === 'کار')).toBeUndefined();
  });

  it('دکمه انصراف فقط هنگام ویرایش نمایش داده می‌شود', async () => {
    const wrapper = mountWithPinia();
    const input = wrapper.find('input[placeholder="نام گروه"]');
    await input.setValue('VIP');
    await wrapper.find('form').trigger('submit.prevent');
    await wrapper.vm.$nextTick();
    const editBtn = wrapper.find('button.btn-warning');
    await editBtn.trigger('click');
    expect(wrapper.find('button.btn-secondary').exists()).toBe(true);
    await wrapper.find('button.btn-secondary').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('button.btn-secondary').exists()).toBe(false);
  });

  it('edge: افزودن گروه تکراری', async () => {
    const wrapper = mountWithPinia();
    const input = wrapper.find('input[placeholder="نام گروه"]');
    await input.setValue('دوستان');
    await wrapper.find('form').trigger('submit.prevent');
    await wrapper.vm.$nextTick();
    await input.setValue('دوستان');
    await wrapper.find('form').trigger('submit.prevent');
    await wrapper.vm.$nextTick();
    expect(wrapper.text().match(/دوستان/g)?.length).toBe(2);
  });

  it('accessibility: هر گروه باید دکمه ویرایش و حذف داشته باشد', async () => {
    const wrapper = mountWithPinia();
    const input = wrapper.find('input[placeholder="نام گروه"]');
    await input.setValue('دوستان');
    await wrapper.find('form').trigger('submit.prevent');
    await wrapper.vm.$nextTick();
    await input.setValue('خانواده');
    await wrapper.find('form').trigger('submit.prevent');
    await wrapper.vm.$nextTick();
    const editBtns = wrapper.findAll('button.btn-warning');
    const removeBtns = wrapper.findAll('button.btn-error');
    expect(editBtns.length).toBe(2);
    expect(removeBtns.length).toBe(2);
  });
});
