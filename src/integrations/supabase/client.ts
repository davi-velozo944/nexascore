import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '');
const supabaseKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  ''
).trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: Variáveis do Supabase não encontradas no arquivo .env');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true, // Mantém a sessão salva para liberar o acesso aos relatórios
    autoRefreshToken: true, // Atualiza o token automaticamente em segundo plano
    detectSessionInUrl: true,
    flowType: 'pkce', // Essencial para estabilizar as requisições e evitar o erro 429
  },
});
