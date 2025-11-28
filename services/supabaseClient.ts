import { createClient } from '@supabase/supabase-js';

// Helper function to safely get environment variables without crashing
const getEnvVar = (key: string, viteKey: string): string => {
  let value = '';
  
  // 1. Try import.meta.env (Vite standard)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      value = import.meta.env[viteKey] || '';
    }
  } catch (e) {
    // Ignore error if import.meta is not defined
  }

  // 2. Try process.env (Node/Next.js/Webpack standard)
  if (!value) {
    try {
      if (typeof process !== 'undefined' && process.env) {
        value = process.env[key] || process.env[viteKey] || '';
      }
    } catch (e) {
      // Ignore error if process is not defined
    }
  }

  return value;
};

// Get credentials safely
const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL', 'VITE_SUPABASE_URL');
const supabaseKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');

let supabase: any = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (e) {
    console.error("Failed to initialize Supabase client:", e);
  }
} else {
  console.warn("Supabase credentials not found. Check your .env file or Vercel settings.");
}

export { supabase };