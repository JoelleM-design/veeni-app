// Définition des constantes Supabase
export const SUPABASE_URL = "https://yzdyepdejftgqpnwitcq.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6ZHllcGRlamZ0Z3FwbndpdGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwODAwOTksImV4cCI6MjA2NTY1NjA5OX0.wGFjpAAoYtcLlk6o1_lgZb0EhX3NB9SoYQ_D1rOc2E0";

import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
}); 