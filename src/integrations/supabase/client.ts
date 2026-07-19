import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Lê variáveis do .env (local) ou das Environment Variables da Vercel.
// Aceita tanto VITE_SUPABASE_PUBLISHABLE_KEY quanto VITE_SUPABASE_ANON_KEY
// e remove espaços / barra final automaticamente.
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '');
const supabaseKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  ''
).trim();

if (!supabaseUrl || !supabaseKey) {
  // eslint-disable-next-line no-console
  console.error('Erro: Variáveis do Supabase não encontradas no arquivo .env');
}

// Import: import { supabase } from "@/integrations/supabase/client";
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});