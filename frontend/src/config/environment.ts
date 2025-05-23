/**
 * Environment configuration
 * 
 * This file centralizes all environment-specific settings to make them
 * easier to manage and update across different environments.
 */

// Determine environment
const isProd = process.env.NODE_ENV === 'production';
const isDev = process.env.NODE_ENV === 'development';

// Security configuration
export const SECURITY_CONFIG = {
  // CSRF protection - enabled in production
  CSRF_ENABLED: isProd,
  // Cookie settings for enhanced security
  COOKIE_SECURE: isProd,
  COOKIE_SAME_SITE: isProd ? 'strict' : 'lax',
  // Content Security Policy headers
  CSP_ENABLED: isProd,
};

// Environment configuration
const config = {
  SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY || '',
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  FRONTEND_URL: process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000'
};

// API configuration
export const API_CONFIG = {
  BASE_URL: config.API_URL,
  TIMEOUT: 30000,
  WITH_CREDENTIALS: true,
  RETRY_COUNT: 3,
  RETRY_DELAY: 1000, // 1 second
  FRONTEND_URL: config.FRONTEND_URL
};

// Supabase configuration
export const SUPABASE_CONFIG = {
  URL: config.SUPABASE_URL,
  ANON_KEY: config.SUPABASE_ANON_KEY,
};

// NEVER include hardcoded API keys in client-side code in production
if (isProd && (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY)) {
  console.error('Missing required Supabase environment variables in production');
}

// App configuration
export const APP_CONFIG = {
  // Application name
  APP_NAME: 'FileNest',
  
  // Default file request expiry days
  DEFAULT_EXPIRY_DAYS: 7,
  
  // Maximum file size in bytes (50MB)
  MAX_FILE_SIZE: 52428800,
  
  // Allowed file types (empty array means all types allowed)
  ALLOWED_FILE_TYPES: [],
  
  // File size limit in bytes (50MB)
  FILE_SIZE_LIMIT: 50 * 1024 * 1024,
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
  ANALYTICS: isProd && process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
};

// Local storage keys
export const STORAGE_KEYS = {
  USER_EMAIL: 'userEmail',
  AUTH_TOKEN: 'authToken',
  PREFERENCES: 'userPreferences',
};

const environmentConfig = {
  API_CONFIG,
  SUPABASE_CONFIG,
  APP_CONFIG,
  FEATURES,
  STORAGE_KEYS,
  SECURITY_CONFIG,
};

export default environmentConfig; 