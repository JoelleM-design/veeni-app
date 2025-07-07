-- Script complet pour corriger TOUTES les politiques RLS
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Supprimer TOUTES les anciennes politiques RLS
DROP POLICY IF EXISTS "Users can view their own household" ON public.households;
DROP POLICY IF EXISTS "Users can update their own household" ON public.households;
DROP POLICY IF EXISTS "Authenticated users can create households" ON public.households;
DROP POLICY IF EXISTS "Users can view their own household membership" ON public.user_household;
DROP POLICY IF EXISTS "Users can manage their own household membership" ON public.user_household;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.households;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.user_household;

-- Supprimer les politiques RLS pour la table User
DROP POLICY IF EXISTS "Users can view own profile" ON public."User";
DROP POLICY IF EXISTS "Users can update own profile" ON public."User";
DROP POLICY IF EXISTS "Users can insert own profile" ON public."User";

-- Supprimer les politiques RLS pour user_wine
DROP POLICY IF EXISTS "Users can view own wines" ON public.user_wine;
DROP POLICY IF EXISTS "Users can manage own wines" ON public.user_wine;

-- Supprimer les politiques RLS pour ocr_logs
DROP POLICY IF EXISTS "Users can view own logs" ON public.ocr_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON public.ocr_logs;

-- 2. Créer des politiques RLS PERMISSIVES pour l'onboarding
-- Table User
CREATE POLICY "Enable all operations for authenticated users" ON public."User"
  FOR ALL USING (auth.role() = 'authenticated');

-- Table households
CREATE POLICY "Enable all operations for authenticated users" ON public.households
  FOR ALL USING (auth.role() = 'authenticated');

-- Table user_household
CREATE POLICY "Enable all operations for authenticated users" ON public.user_household
  FOR ALL USING (auth.role() = 'authenticated');

-- Table user_wine
CREATE POLICY "Enable all operations for authenticated users" ON public.user_wine
  FOR ALL USING (auth.role() = 'authenticated');

-- Table ocr_logs
CREATE POLICY "Enable all operations for authenticated users" ON public.ocr_logs
  FOR ALL USING (auth.role() = 'authenticated');

-- 3. Vérifier que les politiques sont bien appliquées
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('User', 'households', 'user_household', 'user_wine', 'ocr_logs')
ORDER BY tablename, policyname; 