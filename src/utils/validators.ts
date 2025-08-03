/**
 * Validates and normalizes Iranian phone numbers
 * Supports both mobile and landline numbers
 */
export function validatePhoneNumber(phone: string): {
  isValid: boolean;
  normalized: string;
  type?: 'mobile' | 'landline' | 'invalid';
} {
  if (!phone) {
    return { isValid: false, normalized: '', type: 'invalid' };
  }

  // Convert Persian numbers to English
  const persianToEnglish = (str: string) =>
    str.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());

  // Remove all non-digit characters
  const cleaned = persianToEnglish(phone).replace(/\D/g, '');

  // Mobile numbers (e.g., 09123456789)
  const mobileRegex = /^(\+98|0)?9\d{9}$/;
  if (mobileRegex.test(cleaned)) {
    const normalized = cleaned.startsWith('0')
      ? cleaned
      : cleaned.startsWith('98')
        ? '0' + cleaned.substring(2)
        : '0' + cleaned;
    return { isValid: true, normalized, type: 'mobile' };
  }

  // Landline numbers (e.g., 0211234567)
  const landlineRegex = /^(\+98|0)?[1-9]\d{1,2}\d{7}$/;
  if (landlineRegex.test(cleaned)) {
    const normalized = cleaned.startsWith('0')
      ? cleaned
      : cleaned.startsWith('98')
        ? '0' + cleaned.substring(2)
        : '0' + cleaned;
    return { isValid: true, normalized, type: 'landline' };
  }

  return { isValid: false, normalized: '', type: 'invalid' };
}

/**
 * Validates email addresses
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Validates password strength
 * At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
 */
export function validatePassword(password: string): boolean {
  if (!password) return false;
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])(?=.{8,})/;
  return re.test(password);
}

/**
 * Validates national code (کد ملی ایران)
 */
export function validateNationalCode(code: string): boolean {
  if (!/^\d{10}$/.test(code)) return false;

  const check = +code[9];
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    sum += +code[i] * (10 - i);
  }

  sum %= 11;

  return (sum < 2 && check === sum) || (sum >= 2 && check + sum === 11);
}
