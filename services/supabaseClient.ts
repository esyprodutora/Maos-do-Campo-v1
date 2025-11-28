import { createClient } from '@supabase/supabase-js';

// Função auxiliar para buscar variáveis em diferentes ambientes (Vite, Next.js, Webpack)
const getEnvVar = (key: string): string | undefined => {
  // 1. Tenta acessar via import.meta.env (Padrão Vite moderno)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    // Ignora erro se import.meta não existir
  }

  // 2. Tenta acessar via process.env (Padrão Node/Webpack/Next.js)
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {
    // Ignora erro se process não existir
  }

  return undefined;
};

// Tenta todas as combinações comuns de prefixos
const supabaseUrl = 
  getEnvVar('NEXT_PUBLIC_SUPABASE_URL') || 
  getEnvVar('VITE_SUPABASE_URL') || 
  getEnvVar('REACT_APP_SUPABASE_URL') ||
  getEnvVar('SUPABASE_URL'); // Nome genérico (menos comum no frontend por segurança)

const supabaseKey = 
  getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') || 
  getEnvVar('VITE_SUPABASE_ANON_KEY') || 
  getEnvVar('REACT_APP_SUPABASE_ANON_KEY') ||
  getEnvVar('SUPABASE_ANON_KEY');

let supabase: any = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (e) {
    console.error("Erro fatal ao inicializar cliente Supabase:", e);
  }
} else {
  console.warn(`
    [MÃOS DO CAMPO] Credenciais do Supabase não encontradas.
    Verifique se as variáveis de ambiente estão configuradas no Vercel ou .env:
    - NEXT_PUBLIC_SUPABASE_URL ou VITE_SUPABASE_URL
    - NEXT_PUBLIC_SUPABASE_ANON_KEY ou VITE_SUPABASE_ANON_KEY
  `);
}

export { supabase };