import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useNotificationStore } from '@/stores/notificationStore';
import { createContactsStore } from '@/stores/contactsStore';
import { IDatabaseService } from '@/database/IDatabaseService';
import { Contact } from '@/database/dexie';

// Mock database service
const mockDatabaseService: IDatabaseService = {
  // Mock implementations of required methods
  getContacts: vi.fn().mockResolvedValue([]),
  getContact: vi.fn(),
  addContact: vi.fn().mockImplementation((contact) => Promise.resolve(1)),
  updateContact: vi.fn().mockResolvedValue(undefined),
  deleteContact: vi.fn().mockResolvedValue(undefined),
  isPhoneUnique: vi.fn().mockResolvedValue(true),
  getGroups: vi.fn(),
  getGroup: vi.fn(),
  addGroup: vi.fn(),
  updateGroup: vi.fn(),
  deleteGroup: vi.fn(),
  getUsers: vi.fn(),
  getUser: vi.fn(),
  addUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  getUserByUsername: vi.fn(),
  getSavedFilters: vi.fn().mockResolvedValue([]),
  addSavedFilter: vi.fn(),
  updateSavedFilter: vi.fn(),
  deleteSavedFilter: vi.fn(),
  getCustomFieldSchemas: vi.fn(),
  addCustomFieldSchema: vi.fn(),
  updateCustomFieldSchema: vi.fn(),
  deleteCustomFieldSchema: vi.fn(),
};

describe('Notification Integration with Contacts Store', () => {
  let notificationStore: ReturnType<typeof useNotificationStore>;
  let contactsStore: ReturnType<typeof createContactsStore>;

  beforeEach(() => {
    setActivePinia(createPinia());

    // Initialize stores
    notificationStore = useNotificationStore();
    contactsStore = createContactsStore(mockDatabaseService)();

    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it('shows success notification when adding a contact', async () => {
    // Mock contact data
    const newContact = {
      firstName: 'John',
      lastName: 'Doe',
      phoneNumbers: ['1234567890'],
      emails: ['john@example.com'],
    };

    // Add a contact
    await contactsStore.addContact(newContact);

    // Check if notification was shown
    expect(notificationStore.notifications).toHaveLength(1);
    expect(notificationStore.notifications[0].message).toBe('مخاطب با موفقیت اضافه شد');
    expect(notificationStore.notifications[0].type).toBe('success');
  });

  it('shows success notification when updating a contact', async () => {
    // Mock existing contact
    const existingContact: Contact = {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      phoneNumbers: ['1234567890'],
      emails: ['john@example.com'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Mock getContact to return our contact
    mockDatabaseService.getContact = vi.fn().mockResolvedValue(existingContact);

    // Mock update to resolve successfully
    mockDatabaseService.updateContact = vi.fn().mockResolvedValue(undefined);

    // Update the contact
    await contactsStore.updateContact(existingContact);

    // Check if notification was shown
    expect(notificationStore.notifications).toHaveLength(1);
    expect(notificationStore.notifications[0].message).toBe('لیست مخاطبین به‌روزرسانی شد');
    expect(notificationStore.notifications[0].type).toBe('success');
  });

  it('shows success notification when deleting a contact', async () => {
    // Mock delete to resolve successfully
    mockDatabaseService.deleteContact = vi.fn().mockResolvedValue(undefined);

    // Delete a contact
    await contactsStore.deleteContact(1);

    // Check if notification was shown
    expect(notificationStore.notifications).toHaveLength(1);
    expect(notificationStore.notifications[0].message).toBe('مخاطب با موفقیت حذف شد');
    expect(notificationStore.notifications[0].type).toBe('success');
  });

  it('shows error notification when contact operation fails', async () => {
    // Mock a failed operation
    const errorMessage = 'Database error';
    const originalAddContact = mockDatabaseService.addContact;
    mockDatabaseService.addContact = vi.fn().mockRejectedValueOnce(new Error(errorMessage));

    try {
      // Try to add a contact (should fail)
      await contactsStore.addContact({
        firstName: 'John',
        phoneNumbers: ['1234567890'],
      });
    } catch (error) {
      // Expected error
    }

    // Check if error notification was shown
    expect(notificationStore.notifications).toHaveLength(1);
    expect(notificationStore.notifications[0].message).toBe('خطا در افزودن مخاطب');
    expect(notificationStore.notifications[0].type).toBe('error');

    // Restore original mock
    mockDatabaseService.addContact = originalAddContact;
  });
});
