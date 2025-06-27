-- Script de test pour vérifier les liens entre les données
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier la structure des tables principales
SELECT 
  'Structure des tables' as check_type,
  'wine' as table_name,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'wine'
UNION ALL
SELECT 
  'Structure des tables' as check_type,
  'user_wine' as table_name,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'user_wine'
UNION ALL
SELECT 
  'Structure des tables' as check_type,
  'producer' as table_name,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'producer'
UNION ALL
SELECT 
  'Structure des tables' as check_type,
  'country' as table_name,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'country';

-- 2. Vérifier les données dans chaque table
SELECT 
  'Données wine' as check_type,
  COUNT(*) as total_wines,
  COUNT(image_uri) as wines_with_images,
  COUNT(grapes) as wines_with_grapes
FROM wine;

SELECT 
  'Données user_wine' as check_type,
  COUNT(*) as total_relations,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT wine_id) as unique_wines,
  SUM(CASE WHEN origin = 'cellar' THEN 1 ELSE 0 END) as cellar_wines,
  SUM(CASE WHEN origin = 'wishlist' THEN 1 ELSE 0 END) as wishlist_wines
FROM user_wine;

-- 3. Vérifier les liens entre user_wine et wine
SELECT 
  'Liens user_wine -> wine' as check_type,
  uw.user_id,
  uw.wine_id,
  w.name as wine_name,
  w.year as vintage,
  w.wine_type,
  w.region,
  w.image_uri,
  w.grapes,
  uw.amount,
  uw.origin,
  uw.liked,
  uw.rating
FROM user_wine uw
LEFT JOIN wine w ON uw.wine_id = w.id
WHERE uw.user_id = '27fd73b1-7088-4211-af88-3d075851f0db'
ORDER BY uw.created_at DESC;

-- 4. Vérifier les liens wine -> producer
SELECT 
  'Liens wine -> producer' as check_type,
  w.id as wine_id,
  w.name as wine_name,
  w.producer_id,
  p.name as producer_name
FROM wine w
LEFT JOIN producer p ON w.producer_id = p.id
ORDER BY w.name;

-- 5. Vérifier les liens wine -> country
SELECT 
  'Liens wine -> country' as check_type,
  w.id as wine_id,
  w.name as wine_name,
  w.country_id,
  c.name as country_name,
  c.flag_emoji
FROM wine w
LEFT JOIN country c ON w.country_id = c.id
ORDER BY w.name;

-- 6. Vérifier l'historique
SELECT 
  'Historique des vins' as check_type,
  wh.user_id,
  wh.wine_id,
  w.name as wine_name,
  wh.event_type,
  wh.event_date,
  wh.new_amount,
  wh.rating
FROM wine_history wh
LEFT JOIN wine w ON wh.wine_id = w.id
WHERE wh.user_id = '27fd73b1-7088-4211-af88-3d075851f0db'
ORDER BY wh.event_date DESC;

-- 7. Test de requête complète (similaire à useWines)
SELECT 
  'Test requête complète' as check_type,
  uw.user_id,
  uw.wine_id,
  w.name,
  w.year,
  w.wine_type,
  w.region,
  w.image_uri,
  w.grapes,
  p.name as producer_name,
  c.name as country_name,
  uw.amount,
  uw.origin,
  uw.liked,
  uw.rating,
  uw.created_at
FROM user_wine uw
LEFT JOIN wine w ON uw.wine_id = w.id
LEFT JOIN producer p ON w.producer_id = p.id
LEFT JOIN country c ON w.country_id = c.id
WHERE uw.user_id = '27fd73b1-7088-4211-af88-3d075851f0db'
ORDER BY uw.created_at DESC;

-- 8. Vérifier les données manquantes
SELECT 
  'Données manquantes' as check_type,
  'user_wine sans vin correspondant' as issue,
  COUNT(*) as count
FROM user_wine uw
LEFT JOIN wine w ON uw.wine_id = w.id
WHERE w.id IS NULL
UNION ALL
SELECT 
  'Données manquantes' as check_type,
  'vin sans producteur' as issue,
  COUNT(*) as count
FROM wine w
LEFT JOIN producer p ON w.producer_id = p.id
WHERE p.id IS NULL
UNION ALL
SELECT 
  'Données manquantes' as check_type,
  'vin sans pays' as issue,
  COUNT(*) as count
FROM wine w
LEFT JOIN country c ON w.country_id = c.id
WHERE c.id IS NULL; 