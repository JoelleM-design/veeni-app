-- Script de diagnostic pour vérifier la structure exacte des tables
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier la structure de la table wine
SELECT 
  'Structure table wine' as check_type,
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'wine' 
ORDER BY ordinal_position;

-- 2. Vérifier la structure de la table user_wine
SELECT 
  'Structure table user_wine' as check_type,
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_wine' 
ORDER BY ordinal_position;

-- 3. Voir quelques exemples de données dans wine (sans essayer de deviner les colonnes)
SELECT 
  'Exemples de données wine' as check_type,
  *
FROM wine
LIMIT 3;

-- 4. Voir quelques exemples de données dans user_wine
SELECT 
  'Exemples de données user_wine' as check_type,
  *
FROM user_wine
LIMIT 3; 