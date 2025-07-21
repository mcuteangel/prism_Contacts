import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ContactList from '../src/components/ContactList.vue';
import { customFieldSchemas } from '../src/database/customFieldSchema';
import { flushPromises } from '@vue/test-utils';

const contacts = [
  { id: 1, name: 'علی', phoneNumbers: ['09120000000'], groupIds: [1] },
  { id: 2, name: 'Sara', phoneNumbers: ['09123334444'], groupIds: [2] },
];
const groups = [
  { id: 1, name: 'دوستان' },
  { id: 2, name: 'خانواده' },
];

describe('ContactList.vue', () => {
  let wrapper: any;
  beforeEach(() => {
    wrapper = mount(ContactList, {
      props: {
        contacts,
        groups,
      },
    });
  });

  it('باید لیست مخاطبین را رندر کند', () => {
    expect(wrapper.text()).toContain('علی');
    expect(wrapper.text()).toContain('Sara');
  });

  it('باید نام گروه هر مخاطب را نمایش دهد', () => {
    const text = wrapper.text();
    expect(text).toContain('دوستان');
    expect(text).toContain('خانواده');
  });

  it('کلیک روی دکمه ویرایش باید رویداد edit ارسال کند', async () => {
    const editBtns = wrapper.findAll('button.btn-warning');
    await editBtns[0].trigger('click');
    expect(wrapper.emitted('edit')).toBeTruthy();
    expect(wrapper.emitted('edit')[0][0].id).toBe(1);
  });

  it('کلیک روی دکمه حذف باید رویداد remove ارسال کند', async () => {
    const removeBtns = wrapper.findAll('button.btn-error');
    await removeBtns[1].trigger('click');
    expect(wrapper.emitted('remove')).toBeTruthy();
    expect(wrapper.emitted('remove')[0][0]).toBe(2);
  });

  it('edge: لیست خالی باید پیام مناسب نمایش دهد', () => {
    const w = mount(ContactList, { props: { contacts: [], groups } });
    expect(w.text()).toContain('مخاطبی وجود ندارد');
  });

  it('accessibility: هر مخاطب باید دکمه ویرایش و حذف داشته باشد', () => {
    const editBtns = wrapper.findAll('button.btn-warning');
    const removeBtns = wrapper.findAll('button.btn-error');
    expect(editBtns.length).toBe(contacts.length);
    expect(removeBtns.length).toBe(contacts.length);
  });
});

describe('ContactList.vue - custom fields integration', () => {
  beforeEach(() => {
    customFieldSchemas.length = 0;
    customFieldSchemas.push(
      { id: 1, key: 'age', label: 'سن', type: 'number' },
      { id: 2, key: 'job', label: 'شغل', type: 'text' }
    );
  });

  it('نمایش صحیح فیلدهای سفارشی (label و مقدار) بر اساس schema مرکزی', async () => {
    const contacts = [
      { id: 1, name: 'علی', phoneNumbers: ['0912'], customFields: { age: 30, job: 'dev' } },
      { id: 2, name: 'رضا', phoneNumbers: ['0913'], customFields: { age: 25, job: 'designer' } },
    ];
    const wrapper = mount(ContactList, {
      props: { contacts, groups: [] },
    });
    await flushPromises();
    expect(wrapper.html()).toContain('سن');
    expect(wrapper.html()).toContain('شغل');
    expect(wrapper.html()).toContain('30');
    expect(wrapper.html()).toContain('dev');
    expect(wrapper.html()).toContain('25');
    expect(wrapper.html()).toContain('designer');
  });

  it('sync با حذف فیلد از schema مرکزی (نباید نمایش داده شود)', async () => {
    const contacts = [
      { id: 1, name: 'علی', phoneNumbers: ['0912'], customFields: { age: 30, job: 'dev' } },
    ];
    const wrapper = mount(ContactList, {
      props: { contacts, groups: [] },
    });
    await flushPromises();
    // حذف فیلد job از schema
    const idx = customFieldSchemas.findIndex((f) => f.key === 'job');
    if (idx !== -1) customFieldSchemas.splice(idx, 1);
    await wrapper.vm.$forceUpdate();
    await flushPromises();
    expect(wrapper.html()).not.toContain('شغل');
    expect(wrapper.html()).not.toContain('dev');
  });

  it('sync با افزودن فیلد جدید به schema مرکزی (باید نمایش داده شود)', async () => {
    const contacts = [
      { id: 1, name: 'علی', phoneNumbers: ['0912'], customFields: { age: 30, city: 'تهران' } },
    ];
    const wrapper = mount(ContactList, {
      props: { contacts, groups: [] },
    });
    await flushPromises();
    customFieldSchemas.push({ id: 3, key: 'city', label: 'شهر', type: 'text' });
    await wrapper.vm.$forceUpdate();
    await flushPromises();
    expect(wrapper.html()).toContain('شهر');
    expect(wrapper.html()).toContain('تهران');
  });
});
