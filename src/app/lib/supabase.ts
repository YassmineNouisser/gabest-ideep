import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// === À REMPLIR ===
// 1. Crée un projet sur https://supabase.com
// 2. Settings → API → copie "Project URL" et "anon / public key"
// 3. Soit tu mets les valeurs ici directement, soit tu crées un fichier .env.local :
//    VITE_SUPABASE_URL=https://xxxxx.supabase.co
//    VITE_SUPABASE_ANON_KEY=eyJhbGc...

const SUPABASE_URL =
  (import.meta as any).env?.VITE_SUPABASE_URL ??
  'METS_TON_URL_SUPABASE_ICI';

const SUPABASE_ANON_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ??
  'METS_TA_CLE_ANON_SUPABASE_ICI';

export const isSupabaseConfigured =
  !SUPABASE_URL.includes('METS_TON_URL') &&
  !SUPABASE_ANON_KEY.includes('METS_TA_CLE');

export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? SUPABASE_URL : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? SUPABASE_ANON_KEY : 'placeholder-key'
);
