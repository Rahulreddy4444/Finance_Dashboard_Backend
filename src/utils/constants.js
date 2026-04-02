/**
 * Application-wide constants
 * Centralizes enums and config values used across the app
 */

export const ROLES = {
  VIEWER: 'viewer',
  ANALYST: 'analyst',
  ADMIN: 'admin',
};

export const ROLE_VALUES = Object.values(ROLES);

export const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

export const STATUS_VALUES = Object.values(STATUS);

export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
};

export const TRANSACTION_TYPE_VALUES = Object.values(TRANSACTION_TYPES);

export const CATEGORIES = [
  'salary',
  'freelance',
  'investment',
  'business',
  'food',
  'transport',
  'utilities',
  'entertainment',
  'health',
  'education',
  'shopping',
  'rent',
  'insurance',
  'other',
];

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};
