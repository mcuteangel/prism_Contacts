import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import CustomFieldsInputs from '@/components/CustomFieldsInputs.vue';
import { nextTick } from 'vue';

describe('CustomFieldsInputs.vue', () => {
  const mockFieldSchemas = [
    { key: 'field1', label: 'فیلد متنی', type: 'text' },
    { key: 'field2', label: 'سن', type: 'number' },
    { key: 'field3', label: 'تاریخ تولد', type: 'date' },
  ];

  const mockModelValue = {
    field1: 'مقدار تستی',
    field2: '30',
    field3: '1990-01-01',
  };

  it('نمایش صحیح فیلدهای سفارشی', () => {
    const wrapper = mount(CustomFieldsInputs, {
      props: {
        modelValue: mockModelValue,
        fieldSchemas: mockFieldSchemas,
      },
    });

    // بررسی تعداد فیلدها
    const inputs = wrapper.findAll('input');
    expect(inputs).toHaveLength(mockFieldSchemas.length);

    // بررسی نوع فیلدها
    expect(inputs[0].attributes('type')).toBe('text');
    expect(inputs[1].attributes('type')).toBe('number');
    expect(inputs[2].attributes('type')).toBe('date');

    // بررسی مقادیر اولیه
    expect((inputs[0].element as HTMLInputElement).value).toBe(mockModelValue.field1);
    expect((inputs[1].element as HTMLInputElement).value).toBe(mockModelValue.field2);
    expect((inputs[2].element as HTMLInputElement).value).toBe(mockModelValue.field3);
  });

  it('بروزرسانی مقادیر فیلدها', async () => {
    const wrapper = mount(CustomFieldsInputs, {
      props: {
        modelValue: { ...mockModelValue },
        fieldSchemas: mockFieldSchemas,
      },
    });

    const newValue = 'مقدار جدید';
    await wrapper.find('input[type="text"]').setValue(newValue);

    const updateEvents = wrapper.emitted('update:modelValue');
    expect(updateEvents).toBeTruthy();
    expect(updateEvents?.[0][0]).toHaveProperty('field1', newValue);
  });

  it('حذف فیلد در حالت ویرایش', async () => {
    const wrapper = mount(CustomFieldsInputs, {
      props: {
        modelValue: { ...mockModelValue },
        fieldSchemas: mockFieldSchemas,
        editing: false,
      },
    });

    // کلیک روی دکمه حذف
    await wrapper.find('button').trigger('click');

    const updateEvents = wrapper.emitted('update:modelValue');
    expect(updateEvents).toBeTruthy();

    // بررسی حذف فیلد
    const updatedValue = updateEvents?.[0][0];
    expect(updatedValue).not.toHaveProperty('field1');
    expect(updatedValue).toHaveProperty('field2');
    expect(updatedValue).toHaveProperty('field3');
  });

  it('عدم نمایش دکمه حذف در حالت غیر ویرایش', () => {
    const wrapper = mount(CustomFieldsInputs, {
      props: {
        modelValue: { ...mockModelValue },
        fieldSchemas: mockFieldSchemas,
        editing: true,
      },
    });

    // نباید دکمه حذف نمایش داده شود
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('نمایش پیام عدم وجود فیلد سفارشی', () => {
    const wrapper = mount(CustomFieldsInputs, {
      props: {
        modelValue: {},
        fieldSchemas: [],
      },
    });

    expect(wrapper.text()).toContain('هیچ فیلد سفارشی تعریف نشده است');
  });

  it('مدیریت فیلدهای مختلف با انواع مختلف', async () => {
    const wrapper = mount(CustomFieldsInputs, {
      props: {
        modelValue: {},
        fieldSchemas: [
          { key: 'textField', label: 'متن', type: 'text' },
          { key: 'numberField', label: 'عدد', type: 'number' },
          { key: 'dateField', label: 'تاریخ', type: 'date' },
        ],
      },
    });

    // تنظیم مقادیر مختلف برای انواع فیلد
    const textValue = 'متن تستی';
    const numberValue = '42';
    const dateValue = '2023-01-01';

    const inputs = wrapper.findAll('input');
    await inputs[0].setValue(textValue);
    await inputs[1].setValue(numberValue);
    await inputs[2].setValue(dateValue);

    const updateEvents = wrapper.emitted('update:modelValue');
    const lastEvent = updateEvents?.[updateEvents.length - 1][0];

    // بررسی مقادیر به‌روزرسانی شده
    expect(lastEvent).toHaveProperty('textField', textValue);
    expect(lastEvent).toHaveProperty('numberField', numberValue);
    expect(lastEvent).toHaveProperty('dateField', dateValue);
  });
});
