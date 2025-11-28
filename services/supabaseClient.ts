import { createClient } from '@supabase/supabase-js';

// Tenta pegar as variáveis da Vercel (NEXT_PUBLIC_) ou padrão Vite (VITE_) ou node (process.env)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.warn("Supabase credentials not found. App will likely fail to save data remotely.");
}

export { supabase };