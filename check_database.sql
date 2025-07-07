-- Script de diagnostic de la base de données Veeni
-- À exécuter dans l'éditeur SQL de Supabase

-- 0. Vérifier la structure des tables d'abord
SELECT 
  'Structure table User' as check_type,
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'User' 
ORDER BY ordinal_position;

SELECT 
  'Structure table wine' as check_type,
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'wine' 
ORDER BY ordinal_position;

SELECT 
  'Structure table user_wine' as check_type,
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_wine' 
ORDER BY ordinal_position;

-- 1. Vérifier l'utilisateur connecté (avec les bonnes colonnes)
SELECT 
  'Utilisateur connecté' as check_type,
  id,
  email,
  -- name ou first_name selon la structure
  created_at
FROM "User" 
WHERE id = '27fd73b1-7088-4211-af88-3d075851f0db';

-- 2. Vérifier tous les utilisateurs
SELECT 
  'Tous les utilisateurs' as check_type,
  id,
  email,
  created_at
FROM "User"
ORDER BY created_at DESC;

-- 3. Vérifier les vins existants
SELECT 
  'Vins existants' as check_type,
  id,
  -- name ou nom selon la structure
  producer,
  year,
  wine_type,
  region,
  created_at
FROM wine
ORDER BY created_at DESC;

-- 4. Vérifier les relations user_wine
SELECT 
  'Relations user_wine' as check_type,
  user_id,
  wine_id,
  amount,
  liked,
  rating,
  origin,
  created_at
FROM user_wine
ORDER BY created_at DESC;

-- 5. Vérifier les relations pour l'utilisateur spécifique
SELECT 
  'Relations pour utilisateur connecté' as check_type,
  uw.user_id,
  uw.wine_id,
  uw.amount,
  uw.liked,
  uw.rating,
  uw.origin,
  -- w.name ou w.nom selon la structure
  w.producer,
  w.year,
  w.wine_type,
  w.region
FROM user_wine uw
LEFT JOIN wine w ON uw.wine_id = w.id
WHERE uw.user_id = '27fd73b1-7088-4211-af88-3d075851f0db'
ORDER BY uw.created_at DESC;

-- 6. Vérifier les amis (fonctionnalité désactivée)
SELECT 
  'Amis' as check_type,
  'Fonctionnalité désactivée' as status;

-- 7. Compter les entrées par table
SELECT 
  'Compteurs' as check_type,
  (SELECT COUNT(*) FROM "User") as user_count,
  (SELECT COUNT(*) FROM wine) as wine_count,
  (SELECT COUNT(*) FROM user_wine) as user_wine_count;

-- 8. Vérifier la structure des tables (si nécessaire)
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'user_wine' 
-- ORDER BY ordinal_position; 