import { supabase } from '@/supabase';
import type { ApiResponse, ContactFilter, SortOption } from '@/types/supabase';

/**
 * Helper function to handle Supabase API responses
 */
export const handleResponse = async <T>(
  promise: Promise<{ data: T | null; error: any }>
): Promise<ApiResponse<T>> => {
  try {
    const { data, error } = await promise;

    if (error) {
      console.error('Supabase error:', error);
      return {
        data: null,
        error: new Error(error.message || 'An error occurred'),
        status: error.status || 500,
        statusText: error.message || 'Internal Server Error',
      };
    }

    return {
      data,
      error: null,
      status: 200,
      statusText: 'OK',
    };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('An unexpected error occurred'),
      status: 500,
      statusText: 'Internal Server Error',
    };
  }
};

/**
 * Builds a query with filters and sorting
 */
export const buildQuery = (
  table: string,
  filters: ContactFilter[] = [],
  sortOptions?: SortOption
) => {
  let query = supabase.from(table).select('*');

  // Apply filters
  filters.forEach((filter) => {
    const { field, operator, value } = filter;

    switch (operator) {
      case 'eq':
        query = query.eq(field, value);
        break;
      case 'neq':
        query = query.neq(field, value);
        break;
      case 'gt':
        query = query.gt(field, value);
        break;
      case 'lt':
        query = query.lt(field, value);
        break;
      case 'like':
        query = query.like(field, `%${value}%`);
        break;
      case 'ilike':
        query = query.ilike(field, `%${value}%`);
        break;
      case 'in':
        query = query.in(field, Array.isArray(value) ? value : [value]);
        break;
      default:
        console.warn(`Unsupported operator: ${operator}`);
    }
  });

  // Apply sorting
  if (sortOptions) {
    const { field, direction } = sortOptions;
    query = query.order(field, { ascending: direction === 'asc' });
  }

  return query;
};

/**
 * Formats error messages for display
 */
export const formatErrorMessage = (error: any, defaultMessage: string): string => {
  if (!error) return defaultMessage;

  if (error.message) {
    // Handle Supabase auth errors
    if (error.message.includes('Invalid login credentials')) {
      return 'ایمیل یا کلمه عبور نامعتبر است';
    }
    if (error.message.includes('Email not confirmed')) {
      return 'لطفا ایمیل خود را تایید کنید';
    }
    if (error.message.includes('User already registered')) {
      return 'این ایمیل قبلا ثبت نام کرده است';
    }

    return error.message;
  }

  return defaultMessage;
};

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Validates phone number format
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  return re.test(phone);
};

/**
 * Formats phone number to a standard format
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const cleaned = ('' + phone).replace(/\D/g, '');

  // Check if the number starts with country code
  const match = cleaned.match(/^(98|0)?(\d{3})(\d{3})(\d{4})$/);

  if (match) {
    // Format as: 0912-345-6789
    return `0${match[2]}-${match[3]}-${match[4]}`;
  }

  // Return original if format doesn't match
  return phone;
};
