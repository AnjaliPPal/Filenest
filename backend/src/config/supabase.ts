// backend/src/config/supabase.ts
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  // Supabase configuration loaded
  throw new Error('Missing Supabase environment variables');
  
}

export const supabase = createClient(supabaseUrl, supabaseKey);