/**
 * Environment configuration
 * 
 * This file centralizes all environment-specific settings to make them
 * easier to manage and update across different environments.
 */

// Log environment variables during startup
console.log('Loading environment configuration...');
console.log('SUPABASE_URL env var:', process.env.REACT_APP_SUPABASE_URL);
console.log('SUPABASE_ANON_KEY exists:', !!process.env.REACT_APP_SUPABASE_ANON_KEY);

// API configuration
export const API_CONFIG = {
  // Base URL for API requests
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  
  // Default timeout for API requests (in milliseconds)
  TIMEOUT: 30000,
  
  // Whether to include credentials in cross-origin requests
  WITH_CREDENTIALS: true,
};

// Supabase configuration
export const SUPABASE_CONFIG = {
  URL: process.env.REACT_APP_SUPABASE_URL || 'https://uqjlcpdltjvljwisxmpn.supabase.co',
  ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxamxjcGRsdGp2bGp3aXN4bXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNjE1MDIsImV4cCI6MjA2MjczNzUwMn0.0EGRMgS9V7nyXBEpcjH7TU4Dx0PHjblBHs91clqfb_Q',
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
  SUPABASE_CONFIG,
  APP_CONFIG,
  FEATURES,
  STORAGE_KEYS,
};

export default environmentConfig; 