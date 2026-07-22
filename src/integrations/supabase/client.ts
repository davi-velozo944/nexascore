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
    persistSession: false, // Desativa a persistência automática para cortar o loop de refresh do token
    autoRefreshToken: false, // Impede o cliente de tentar atualizar o token sozinho em segundo plano
    detectSessionInUrl: true,
  },
});
