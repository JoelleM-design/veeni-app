-- Script à exécuter dans l'éditeur SQL de Supabase pour corriger les politiques RLS

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can view their own household" ON public.households;
DROP POLICY IF EXISTS "Users can update their own household" ON public.households;
DROP POLICY IF EXISTS "Authenticated users can create households" ON public.households;
DROP POLICY IF EXISTS "Users can view their own household membership" ON public.user_household;
DROP POLICY IF EXISTS "Users can manage their own household membership" ON public.user_household;

-- Créer de nouvelles politiques plus permissives pour l'onboarding
CREATE POLICY "Enable all operations for authenticated users" ON public.households
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON public.user_household
  FOR ALL USING (auth.role() = 'authenticated');

-- Vérifier que les politiques ont été créées
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('households', 'user_household'); 