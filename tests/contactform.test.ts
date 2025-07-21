import { describe, it, expect, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import ContactForm from '../src/components/ContactForm.vue';
import CustomFieldManager from '../src/components/CustomFieldManager.vue';
import {
  customFieldSchemas,
  loadCustomFieldSchemas,
  saveCustomFieldSchemas,
} from '../src/database/customFieldSchema';
import { db } from '../src/database/dexie';

const baseForm = { name: '', phone: '', groupIds: [] };
const groups = [
  { id: 1, name: 'دوستان' },
  { id: 2, name: 'خانواده' },
];

describe('ContactForm.vue', () => {
  let wrapper: any;
  beforeEach(() => {
    customFieldSchemas.length = 0;
    wrapper = mount(ContactForm, {
      props: {
        form: { ...baseForm },
        groups,
        editingId: null,
      },
    });
  });

  it('باید فرم را رندر کند', () => {
    const inputs = wrapper.findAll('input[type="text"]');
    expect(inputs.length).toBeGreaterThanOrEqual(2); // name و phone
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
  });

  it('ثبت فرم با داده معتبر باید رویداد submit ارسال کند', async () => {
    customFieldSchemas.length = 0;
    customFieldSchemas.push(
      { id: 1, key: 'age', label: 'سن', type: 'number' },
      { id: 2, key: 'job', label: 'شغل', type: 'text' }
    );
    const wrapper = mount(ContactForm, {
      props: {
        form: {
          name: 'علی',
          phone: '09120000000',
          groupIds: [1],
          customFields: { age: 25, job: 'برنامه‌نویس' },
        },
        groups,
        editingId: null,
      },
    });
    await flushPromises();
    await nextTick();
    const inputs = wrapper.findAll('input[type="text"]');
    await inputs[0].setValue('علی');
    await nextTick();
    await inputs[1].setValue('09120000000');
    await nextTick();
    const numberInput = wrapper.find('input[type="number"]');
    await numberInput.setValue('25');
    await nextTick();
    const jobInput = wrapper
      .findAll('input[type="text"]')
      .find((i) => i.attributes('id') === 'custom-job');
    if (jobInput) await jobInput.setValue('برنامه‌نویس');
    await nextTick();
    await flushPromises();
    await wrapper.find('form').trigger('submit.prevent');
    await nextTick();
    await flushPromises();
    const emitted = wrapper.emitted('submit');
    expect(emitted).toBeTruthy();
    const payload = emitted && emitted[0] && (emitted[0][0] as any);
    expect(payload && payload.name).toBe('علی');
    expect(payload && payload.phone).toBe('09120000000');
    expect(payload && payload.customFields.age).toBe(25);
    expect(payload && payload.customFields.job).toBe('برنامه‌نویس');
  });

  it('ثبت فرم با نام خالی نباید رویداد submit ارسال کند', async () => {
    const inputs = wrapper.findAll('input[type="text"]');
    await inputs[0].setValue('');
    await inputs[1].setValue('09120000000');
    await wrapper.find('form').trigger('submit.prevent');
    expect(wrapper.emitted('submit')).toBeFalsy();
  });

  it('ثبت فرم با شماره خالی نباید رویداد submit ارسال کند', async () => {
    const inputs = wrapper.findAll('input[type="text"]');
    await inputs[0].setValue('علی');
    await inputs[1].setValue('');
    await wrapper.find('form').trigger('submit.prevent');
    expect(wrapper.emitted('submit')).toBeFalsy();
  });

  it('انتخاب گروه باید مقدار groupIds را تغییر دهد', async () => {
    customFieldSchemas.length = 0;
    customFieldSchemas.push({ id: 1, key: 'age', label: 'سن', type: 'number' });
    const wrapper = mount(ContactForm, {
      props: {
        form: {
          name: 'علی',
          phone: '09120000000',
          groupIds: [1],
          customFields: { age: 20 },
        },
        groups,
        editingId: null,
      },
    });
    const inputs = wrapper.findAll('input[type="text"]');
    await inputs[0].setValue('علی');
    await inputs[1].setValue('09120000000');
    const numberInput = wrapper.find('input[type="number"]');
    await numberInput.setValue('20');
    const select = wrapper.find('select');
    await select.setValue('1');
    await wrapper.find('form').trigger('submit.prevent');
    const emitted = wrapper.emitted('submit');
    expect(emitted).toBeTruthy();
    const payload = emitted && emitted[0] && (emitted[0][0] as any);
    expect(payload && payload.groupIds).toContain(1);
    expect(payload && payload.customFields.age).toBe(20);
  });

  it('دکمه لغو باید رویداد cancel ارسال کند', async () => {
    // باید با editingId مقدار mount شود
    const w = mount(ContactForm, {
      props: {
        form: { ...baseForm },
        groups,
        editingId: 1,
      },
    });
    const cancelBtn = w.find('button.btn-secondary');
    await cancelBtn.trigger('click');
    expect(w.emitted('cancel')).toBeTruthy();
  });

  // edge: ثبت فرم با داده مخرب (XSS)
  it('edge: ثبت فرم با داده مخرب (XSS)', async () => {
    customFieldSchemas.length = 0;
    customFieldSchemas.push({ id: 1, key: 'age', label: 'سن', type: 'number' });
    const wrapper = mount(ContactForm, {
      props: {
        form: {
          name: 'XSS',
          phone: '09120000000',
          groupIds: [1],
          customFields: { age: 30 },
        },
        groups,
        editingId: null,
      },
    });
    const inputs = wrapper.findAll('input[type="text"]');
    await inputs[0].setValue('<script>alert(1)</script>');
    await inputs[1].setValue('09120000000');
    const numberInput = wrapper.find('input[type="number"]');
    await numberInput.setValue('30');
    await wrapper.find('form').trigger('submit.prevent');
    const emitted = wrapper.emitted('submit');
    expect(emitted).toBeTruthy();
    const payload = emitted && emitted[0] && (emitted[0][0] as any);
    expect(payload && payload.name).toContain('<script>');
    expect(payload && payload.customFields.age).toBe(30);
  });

  it('accessibility: فرم باید placeholder مناسب داشته باشد', () => {
    const inputs = wrapper.findAll('input[type="text"]');
    const placeholders = inputs.map((i) => i.attributes('placeholder'));
    expect(placeholders).toContain('نام');
    expect(placeholders).toContain('شماره تلفن');
  });

  // security: جلوگیری از XSS در نام مخاطب
  it('security: جلوگیری از XSS در نام مخاطب', async () => {
    customFieldSchemas.length = 0;
    customFieldSchemas.push({ id: 1, key: 'age', label: 'سن', type: 'number' });
    const wrapper = mount(ContactForm, {
      props: {
        form: {
          name: 'XSS',
          phone: '09120000000',
          groupIds: [1],
          customFields: { age: 30 },
        },
        groups,
        editingId: null,
      },
    });
    const inputs = wrapper.findAll('input[type="text"]');
    await inputs[0].setValue('<img src=x onerror=alert(1)>');
    await inputs[1].setValue('09120000000');
    const numberInput = wrapper.find('input[type="number"]');
    await numberInput.setValue('30');
    await wrapper.find('form').trigger('submit.prevent');
    const emitted = wrapper.emitted('submit');
    expect(emitted).toBeTruthy();
    const payload = emitted && emitted[0] && (emitted[0][0] as any);
    expect(payload && payload.name).toContain('<img');
    expect(payload && payload.customFields.age).toBe(30);
  });

  it('validation: رد نام خالی', async () => {
    const wrapper = mount(ContactForm, {
      props: {
        form: { ...baseForm },
        groups,
        editingId: null,
      },
    });
    const inputs = wrapper.findAll('input[type="text"]');
    await inputs[0].setValue('');
    await inputs[1].setValue('09120000000');
    await wrapper.find('form').trigger('submit.prevent');
    expect(wrapper.emitted('submit')).toBeFalsy();
  });

  it('validation: رد شماره نامعتبر', async () => {
    const wrapper = mount(ContactForm, {
      props: {
        form: { ...baseForm },
        groups,
        editingId: null,
      },
    });
    const inputs = wrapper.findAll('input[type="text"]');
    await inputs[0].setValue('علی');
    await inputs[1].setValue('abc');
    await wrapper.find('form').trigger('submit.prevent');
    expect(wrapper.emitted('submit')).toBeFalsy();
  });

  // validation: قبول ورودی معتبر
  it('validation: قبول ورودی معتبر', async () => {
    customFieldSchemas.length = 0;
    customFieldSchemas.push({ id: 1, key: 'age', label: 'سن', type: 'number' });
    const wrapper = mount(ContactForm, {
      props: {
        form: {
          name: 'Sara',
          phone: '09123334444',
          groupIds: [2],
          customFields: { age: 25 },
        },
        groups,
        editingId: null,
      },
    });
    const inputs = wrapper.findAll('input[type="text"]');
    await inputs[0].setValue('Sara');
    await inputs[1].setValue('09123334444');
    const numberInput = wrapper.find('input[type="number"]');
    await numberInput.setValue('25');
    await wrapper.find('form').trigger('submit.prevent');
    const emitted = wrapper.emitted('submit');
    expect(emitted).toBeTruthy();
    const payload = emitted && emitted[0] && (emitted[0][0] as any);
    expect(payload && payload.name).toBe('Sara');
    expect(payload && payload.phone).toBe('09123334444');
    expect(payload && payload.customFields.age).toBe(25);
  });
});

describe('CustomFieldManager.vue', () => {
  beforeEach(async () => {
    await db.customFieldSchemas.clear();
    customFieldSchemas.length = 0;
  });

  it('افزودن فیلد جدید و sync با schema مرکزی و ذخیره‌سازی', async () => {
    const wrapper = mount(CustomFieldManager);
    await flushPromises();
    await wrapper.find('input[placeholder="برچسب جدید"]').setValue('شغل');
    await wrapper.find('select').setValue('text');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();
    await flushPromises(); // دو بار برای اطمینان از sync
    expect(customFieldSchemas.some((f) => f.label === 'شغل')).toBe(true);
    customFieldSchemas.length = 0;
    await loadCustomFieldSchemas();
    await flushPromises();
    expect(customFieldSchemas.some((f) => f.label === 'شغل')).toBe(true);
  });

  it('حذف فیلد و sync با schema مرکزی و ذخیره‌سازی', async () => {
    customFieldSchemas.push({ id: 1, key: 'test', label: 'تست', type: 'text' });
    await db.customFieldSchemas.bulkAdd(customFieldSchemas);
    const wrapper = mount(CustomFieldManager);
    await flushPromises();
    const removeBtn = wrapper.findAll('button.btn-error').at(0);
    await removeBtn?.trigger('click');
    await flushPromises();
    await flushPromises();
    expect(customFieldSchemas.some((f) => f.label === 'تست')).toBe(false);
    customFieldSchemas.length = 0;
    await loadCustomFieldSchemas();
    await flushPromises();
    expect(customFieldSchemas.some((f) => f.label === 'تست')).toBe(false);
  });

  it('ویرایش label و sync با schema مرکزی و ذخیره‌سازی', async () => {
    customFieldSchemas.length = 0;
    customFieldSchemas.push({ id: 1, key: 'test', label: 'تست', type: 'text' });
    await db.customFieldSchemas.bulkAdd(customFieldSchemas);
    await flushPromises();
    const wrapper = mount(CustomFieldManager);
    await flushPromises();
    await nextTick();
    const input = wrapper.find('ul input');
    await input.setValue('تست جدید');
    await nextTick();
    await flushPromises(); // برای watch
    await saveCustomFieldSchemas();
    await flushPromises(); // برای saveCustomFieldSchemas
    await flushPromises(); // برای اطمینان از sync کامل
    expect(customFieldSchemas[0] && customFieldSchemas[0].label).toBe('تست جدید');
    customFieldSchemas.length = 0;
    await loadCustomFieldSchemas();
    await flushPromises();
    await nextTick();
    expect(customFieldSchemas[0] && customFieldSchemas[0].label).toBe('تست جدید');
  });

  it('type فیلد سفارشی در حالت ویرایش غیرقابل تغییر است', async () => {
    customFieldSchemas.length = 0;
    customFieldSchemas.push({ id: 1, key: 'test', label: 'تست', type: 'text' });
    await db.customFieldSchemas.bulkAdd(customFieldSchemas);
    await flushPromises();
    const wrapper = mount(CustomFieldManager);
    await flushPromises();
    await nextTick();
    // پیدا کردن select با disabled attribute در لیست فیلدها
    const disabledSelects = wrapper.findAll('select').filter((sel) => {
      return sel.attributes('disabled') !== undefined;
    });
    expect(disabledSelects.length).toBeGreaterThan(0);
    disabledSelects.forEach((sel) => {
      expect(sel.attributes('disabled')).toBeDefined();
    });
  });
});

describe('ContactForm.vue - custom fields integration', () => {
  beforeEach(() => {
    customFieldSchemas.length = 0;
  });

  it('نمایش و مقداردهی فیلدهای سفارشی فقط بر اساس schema مرکزی', async () => {
    customFieldSchemas.push(
      { id: 1, key: 'age', label: 'سن', type: 'number' },
      { id: 2, key: 'job', label: 'شغل', type: 'text' }
    );
    const wrapper = mount(ContactForm, {
      props: {
        form: {
          name: '',
          phone: '',
          groupIds: [],
          customFields: { age: 30, job: 'dev' },
        },
        editingId: null,
        groups: [],
      },
    });
    await flushPromises();
    expect(wrapper.html()).toContain('سن');
    expect(wrapper.html()).toContain('شغل');
    const numberInput = wrapper.find('input[type="number"]');
    expect((numberInput.element as HTMLInputElement).value).toBe('30');
    const jobInput = wrapper
      .findAll('input[type="text"]')
      .find((i) => i.attributes('id') === 'custom-job');
    expect(jobInput).toBeTruthy();
    expect((jobInput!.element as HTMLInputElement).value).toBe('dev');
  });

  it('sync مقداردهی فیلد سفارشی با schema مرکزی', async () => {
    customFieldSchemas.push(
      { id: 1, key: 'age', label: 'سن', type: 'number' },
      { id: 2, key: 'job', label: 'شغل', type: 'text' }
    );
    const wrapper = mount(ContactForm, {
      props: {
        form: { name: '', phone: '', groupIds: [], customFields: { age: 30 } },
        editingId: null,
        groups: [],
      },
    });
    await flushPromises();
    // افزودن فیلد جدید به schema مرکزی
    customFieldSchemas.push({ id: 3, key: 'city', label: 'شهر', type: 'text' });
    await wrapper.vm.$forceUpdate();
    await flushPromises();
    expect(wrapper.html()).toContain('شهر');
  });
});
