import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import ContactForm from '../ContactForm.vue';

describe('ContactForm', () => {
  const createWrapper = (props = {}) => {
    return mount(ContactForm, {
      props: {
        form: {
          firstName: '',
          lastName: '',
          phone: '',
          groupIds: [],
          customFields: {},
        },
        editingId: null,
        groups: [
          { id: '1', name: 'خانواده' },
          { id: '2', name: 'دوستان' },
        ],
        suggestedGroups: [],
        customFieldSchemas: [],
        errorMessage: '',
        loading: false,
        ...props,
      },
      global: {
        stubs: {
          'font-awesome-icon': true,
          'router-link': true,
        },
      },
    });
  };

  it('renders the form with all fields', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('form').exists()).toBe(true);
    expect(wrapper.find('input[type="text"]').exists()).toBe(true);
    expect(wrapper.find('input[type="tel"]').exists()).toBe(true);
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
  });

  it('validates required fields on submit', async () => {
    const wrapper = createWrapper();
    const form = wrapper.find('form');
    await form.trigger('submit');
    expect(wrapper.emitted('submit')).toBeTruthy();
  });

  it('emits submit event with form data when valid', async () => {
    const wrapper = createWrapper({
      form: {
        firstName: 'John',
        lastName: 'Doe',
        phone: '09123456789',
        groupIds: [],
        customFields: {},
      },
    });

    const form = wrapper.find('form');
    await form.trigger('submit');

    // Expect submit event to be emitted with form data
    expect(wrapper.emitted('submit')).toBeTruthy();
    if (wrapper.emitted('submit')) {
      const submitData = wrapper.emitted('submit')?.[0][0];
      expect(submitData).toMatchObject({
        firstName: 'John',
        lastName: 'Doe',
        phone: '09123456789',
      });
    }
  });

  it('allows selecting groups from the group selector', async () => {
    const wrapper = createWrapper({
      groups: [
        { id: '1', name: 'خانواده' },
        { id: '2', name: 'دوستان' },
      ],
    });

    const groupSelect = wrapper.find('select');
    expect(groupSelect.exists()).toBe(true);
    expect(wrapper.findAll('option')).toHaveLength(3); // Includes default empty option
  });

  it('adds a new group when form is submitted', async () => {
    const wrapper = createWrapper();

    // Open modal
    await wrapper.find('button:contains("گروه جدید")').trigger('click');

    // Set group name
    const input = wrapper.find('input[type="text"]');
    await input.setValue('گروه جدید تست');

    // Submit form
    const submitButton = wrapper.find('button:contains("ذخیره")');
    await submitButton.trigger('click');

    // Check if the group was added
    expect(wrapper.emitted('add-group')).toBeTruthy();
    if (wrapper.emitted('add-group')) {
      expect(wrapper.emitted('add-group')?.[0][0]).toMatchObject({
        name: 'گروه جدید تست',
      });
    }
  });
});
