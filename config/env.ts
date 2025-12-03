
// Função genérica para ler variáveis de ambiente sem quebrar
export function getEnv(key: string, fallback = ""): string {
  let value = '';

  // 1. Tenta ler do Vite (import.meta.env)
  try {
    // @ts-ignore
    if (typeof import.meta !== "undefined" && import.meta.env) {
      // @ts-ignore
      value = import.meta.env[key];
    }
  } catch (e) {
    // Ignora erro se import.meta não existir
  }

  // 2. Se não achou, tenta ler do Process (Node/Vercel)
  if (!value) {
    try {
      if (typeof process !== "undefined" && process.env) {
        // Tenta a chave exata, ou variantes comuns
        value = process.env[key] || 
                process.env[`NEXT_PUBLIC_${key.replace('VITE_', '')}`] || 
                process.env['API_KEY'];
      }
    } catch (e) {
      // Ignora erro
    }
  }

  // Retorna valor ou fallback
  return value || fallback;
}

// Exporta a chave do Google Maps com fallback para a API_KEY geral se a específica não existir
export const GOOGLE_MAPS_API_KEY = getEnv("VITE_GOOGLE_MAPS_API_KEY") || getEnv("VITE_API_KEY");
