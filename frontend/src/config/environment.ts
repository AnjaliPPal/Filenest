/**
 * Environment configuration
 * 
 * This file centralizes all environment-specific settings to make them
 * easier to manage and update across different environments.
 */

// API configuration
export const API_CONFIG = {
  // Base URL for API requests
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  
  // Default timeout for API requests (in milliseconds)
  TIMEOUT: 30000,
  
  // Whether to include credentials in cross-origin requests
  WITH_CREDENTIALS: true,
};

// App configuration
export const APP_CONFIG = {
  // Application name
  APP_NAME: 'FileNest',
  
  // Frontend URL
  FRONTEND_URL: process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000',
  
  // Default file request expiry days
  DEFAULT_EXPIRY_DAYS: 7,
  
  // Maximum file size in bytes (50MB)
  MAX_FILE_SIZE: 52428800,
  
  // Allowed file types (empty array means all types allowed)
  ALLOWED_FILE_TYPES: [],
};

// Feature flags
export const FEATURES = {
  // Whether email notifications are enabled
  EMAIL_NOTIFICATIONS: true,
  
  // Whether custom branding is enabled (phase 2 feature)
  CUSTOM_BRANDING: false,
  
  // Whether reminders are enabled (phase 2 feature)
  REMINDERS: false,
  
  // Whether analytics are enabled (tracking of file uploads, etc.)
  ANALYTICS: false,
};

// Local storage keys
export const STORAGE_KEYS = {
  USER_EMAIL: 'userEmail',
  AUTH_TOKEN: 'authToken',
  PREFERENCES: 'userPreferences',
};

const environmentConfig = {
  API_CONFIG,
  APP_CONFIG,
  FEATURES,
  STORAGE_KEYS,
};

export default environmentConfig; 