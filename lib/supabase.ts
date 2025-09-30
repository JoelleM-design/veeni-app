// Définition des constantes Supabase
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://yzdyepdejftgqpnwitcq.supabase.co";
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY manquante dans les variables d\'environnement');
}

import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
}); 