import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/env';

let supabase: any = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.error("Failed to initialize Supabase client:", e);
  }
} else {
  console.warn("Supabase credentials not found. Check your .env file or Vercel settings.");
}

export { supabase };
