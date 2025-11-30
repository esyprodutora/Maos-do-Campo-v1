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

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error('Usuário não autenticado');
  }

  return data.user;
}

