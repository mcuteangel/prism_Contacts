import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useContactsStore } from '@/stores/contactsStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { contactRepository } from '@/services/ContactRepository';

// Mock the entire repository module
vi.mock('@/services/ContactRepository', () => ({
  contactRepository: {
    addContact: vi.fn(),
    updateContact: vi.fn(),
    deleteContact: vi.fn(),
    getLiveContacts: vi.fn(() => ({ subscribe: () => ({ unsubscribe: () => {} }) })), // Mock observable
  },
}));

describe('یکپارچه‌سازی انباره مخاطبین و اعلان‌ها', () => {
  let contactsStore: ReturnType<typeof useContactsStore>;
  let notificationStore: ReturnType<typeof useNotificationStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    contactsStore = useContactsStore();
    notificationStore = useNotificationStore();
  });

  afterEach(() => {
    vi.clearAllMocks();
    notificationStore.clearNotifications();
  });

  it('باید هنگام افزودن موفق مخاطب، یک اعلان موفقیت نمایش دهد', async () => {
    // Arrange: شبیه‌سازی موفقیت‌آمیز اضافه کردن مخاطب
    vi.mocked(contactRepository.addContact).mockResolvedValue('some-id');

    // Act: فراخوانی اکشن انباره
    await contactsStore.addContact({ firstName: 'جان', lastName: 'دو', phoneNumbers: ['123'] });

    // Assert: بررسی نمایش اعلان موفقیت
    expect(notificationStore.notifications).toHaveLength(1);
    expect(notificationStore.notifications[0].message).toBe('مخاطب با موفقیت اضافه شد.');
    expect(notificationStore.notifications[0].type).toBe('success');
  });

  it('باید هنگام آپدیت موفق مخاطب، یک اعلان موفقیت نمایش دهد', async () => {
    // Arrange
    vi.mocked(contactRepository.updateContact).mockResolvedValue(undefined);

    // Act
    await contactsStore.updateContact('some-id', { lastName: 'اسمیت' });

    // Assert
    expect(notificationStore.notifications).toHaveLength(1);
    expect(notificationStore.notifications[0].message).toBe('مخاطب با موفقیت به‌روزرسانی شد.');
    expect(notificationStore.notifications[0].type).toBe('success');
  });

  it('باید هنگام حذف موفق مخاطب، یک اعلان موفقیت نمایش دهد', async () => {
    // Arrange
    vi.mocked(contactRepository.deleteContact).mockResolvedValue(undefined);

    // Act
    await contactsStore.deleteContact('some-id');

    // Assert
    expect(notificationStore.notifications).toHaveLength(1);
    expect(notificationStore.notifications[0].message).toBe('مخاطب با موفقیت حذف شد.');
    expect(notificationStore.notifications[0].type).toBe('success');
  });

  it('باید هنگام بروز خطا در افزودن مخاطب، یک اعلان خطا نمایش دهد', async () => {
    // Arrange: شبیه‌سازی خطا در اضافه کردن مخاطب
    const errorMessage = 'خطا در افزودن مخاطب';
    vi.mocked(contactRepository.addContact).mockRejectedValue(new Error('خطای دیتابیس'));

    // Act & Assert
    await expect(
      contactsStore.addContact({ firstName: 'خطا', lastName: 'آزمایشی', phoneNumbers: ['123'] })
    ).rejects.toThrow();

    expect(notificationStore.notifications).toHaveLength(1);
    expect(notificationStore.notifications[0].message).toBe(errorMessage);
    expect(notificationStore.notifications[0].type).toBe('error');
  });

  it('باید هنگام بروز خطا در به‌روزرسانی مخاطب، یک اعلان خطا نمایش دهد', async () => {
    // Arrange
    const errorMessage = 'خطا در به‌روزرسانی مخاطب';
    vi.mocked(contactRepository.updateContact).mockRejectedValue(new Error('خطای دیتابیس'));

    // Act & Assert
    await expect(contactsStore.updateContact('some-id', { lastName: 'اسمیت' })).rejects.toThrow();

    expect(notificationStore.notifications).toHaveLength(1);
    expect(notificationStore.notifications[0].message).toBe(errorMessage);
    expect(notificationStore.notifications[0].type).toBe('error');
  });

  it('باید هنگام بروز خطا در حذف مخاطب، یک اعلان خطا نمایش دهد', async () => {
    // Arrange
    const errorMessage = 'خطا در حذف مخاطب';
    vi.mocked(contactRepository.deleteContact).mockRejectedValue(new Error('خطای دیتابیس'));

    // Act & Assert
    await expect(contactsStore.deleteContact('some-id')).rejects.toThrow();

    expect(notificationStore.notifications).toHaveLength(1);
    expect(notificationStore.notifications[0].message).toBe(errorMessage);
    expect(notificationStore.notifications[0].type).toBe('error');
  });
});
