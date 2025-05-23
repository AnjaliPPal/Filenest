import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from './environment';

export const supabase = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY); 