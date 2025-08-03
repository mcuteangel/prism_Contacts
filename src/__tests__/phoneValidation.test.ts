import { describe, it, expect } from 'vitest';
import { validatePhoneNumber } from '@/utils/validators';

describe('Phone Number Validation', () => {
  it('should accept valid mobile numbers', () => {
    const validMobileNumbers = [
      '09123456789',
      '0912 345 6789',
      '۰۹۱۲۳۴۵۶۷۸۹', // Persian numbers
      '912 345 6789',
      '9123456789',
    ];

    validMobileNumbers.forEach((number) => {
      const result = validatePhoneNumber(number);
      expect(result.isValid).toBe(true);
      expect(result.normalized).toBe('09123456789');
    });
  });

  it('should accept valid landline numbers', () => {
    const validLandlineNumbers = [
      '0211234567',
      '021 123 4567',
      '۰۲۱۱۲۳۴۵۶۷', // Persian numbers
      '021-123-4567',
      '021-1234567',
    ];

    validLandlineNumbers.forEach((number) => {
      const result = validatePhoneNumber(number);
      expect(result.isValid).toBe(true);
      expect(result.normalized).toBe('0211234567');
    });
  });

  it('should reject invalid phone numbers', () => {
    const invalidNumbers = [
      '12345',
      '0912345678', // Too short for mobile
      '021123456', // Too short for landline
      'abc123',
      '0912 345 678', // Invalid length
      '02911234567', // Invalid area code
    ];

    invalidNumbers.forEach((number) => {
      const result = validatePhoneNumber(number);
      expect(result.isValid).toBe(false);
    });
  });

  it('should normalize phone numbers correctly', () => {
    const testCases = [
      { input: '۰۹۱۲۳۴۵۶۷۸۹', output: '09123456789' },
      { input: '912 345 6789', output: '09123456789' },
      { input: '912-345-6789', output: '09123456789' },
      { input: '۰۲۱۱۲۳۴۵۶۷', output: '0211234567' },
      { input: '021 123 4567', output: '0211234567' },
      { input: '021-123-4567', output: '0211234567' },
    ];

    testCases.forEach(({ input, output }) => {
      const result = validatePhoneNumber(input);
      expect(result.normalized).toBe(output);
    });
  });
});
