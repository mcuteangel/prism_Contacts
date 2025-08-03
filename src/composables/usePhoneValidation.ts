import { ref } from 'vue';

interface PhoneValidationState {
  state: '' | 'checking' | 'valid' | 'error';
  message: string;
}

export function usePhoneValidation(contactsStore?: any) {
  const phoneValidation = ref<PhoneValidationState>({
    state: '',
    message: '',
  });

  const validatePhoneNumber = async (phone: string, checkDuplicate = true): Promise<boolean> => {
    const cleanPhone = phone.replace(/\D/g, '');

    if (!cleanPhone) {
      phoneValidation.value = {
        state: 'error',
        message: 'لطفا شماره تلفن را وارد کنید.',
      };
      return false;
    }

    if (cleanPhone.length < 10) {
      phoneValidation.value = {
        state: 'error',
        message: 'شماره تلفن باید حداقل ۱۰ رقم باشد.',
      };
      return false;
    }

    if (cleanPhone.length > 11) {
      phoneValidation.value = {
        state: 'error',
        message: 'شماره تلفن حداکثر می‌تواند ۱۱ رقم باشد.',
      };
      return false;
    }

    const mobileRegex = /^9[0-9]{9}$/;
    const landlineRegex = /^[1-9]\d{1,2}\d{7}$/;

    if (!mobileRegex.test(cleanPhone) && !landlineRegex.test(cleanPhone)) {
      phoneValidation.value = {
        state: 'error',
        message: 'فرمت شماره تلفن معتبر نیست. (مثال: ۰۹۱۲۳۴۵۶۷۸۹ یا ۰۲۱۱۲۳۴۵۶۷)',
      };
      return false;
    }

    if (checkDuplicate && contactsStore) {
      phoneValidation.value = {
        state: 'checking',
        message: 'در حال بررسی شماره تلفن...',
      };

      try {
        const isUnique = await contactsStore.isPhoneUnique(cleanPhone);
        if (!isUnique) {
          phoneValidation.value = {
            state: 'error',
            message: 'این شماره تلفن قبلاً ثبت شده است.',
          };
          return false;
        }
      } catch (error) {
        phoneValidation.value = {
          state: 'error',
          message: 'خطا در بررسی شماره تلفن. لطفاً دوباره تلاش کنید.',
        };
        return false;
      }
    }

    phoneValidation.value = {
      state: 'valid',
      message: 'شماره تلفن معتبر است.',
    };
    return true;
  };

  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (/^9\d{9}$/.test(cleaned)) {
      return '0' + cleaned;
    }
    return cleaned;
  };

  return {
    phoneValidation,
    validatePhoneNumber,
    formatPhoneNumber,
  };
}
