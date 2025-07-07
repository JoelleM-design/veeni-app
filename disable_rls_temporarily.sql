-- Script pour désactiver temporairement RLS sur les tables critiques
-- À exécuter dans l'éditeur SQL de Supabase

-- Désactiver RLS sur les tables critiques pour l'onboarding
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE households DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_household DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_wine DISABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_logs DISABLE ROW LEVEL SECURITY;

-- Vérifier que RLS est désactivé
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('User', 'households', 'user_household', 'user_wine', 'ocr_logs')
  AND schemaname = 'public'; 