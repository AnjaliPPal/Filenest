import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from './environment';

// Debug: log Supabase configuration values
console.log('Supabase URL:', SUPABASE_CONFIG.URL);
console.log('Supabase ANON KEY length:', SUPABASE_CONFIG.ANON_KEY ? SUPABASE_CONFIG.ANON_KEY.length : 0);

if (!SUPABASE_CONFIG.URL || !SUPABASE_CONFIG.ANON_KEY) {
  console.warn('Missing Supabase configuration. Authentication features will not work.');
}

// Create Supabase client
export const supabase = createClient(
  SUPABASE_CONFIG.URL,
  SUPABASE_CONFIG.ANON_KEY
); 