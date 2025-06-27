-- Script de diagnostic pour la wishlist
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier la structure de la table user_wine
SELECT 
  'Structure user_wine' as check_type,
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_wine' 
ORDER BY ordinal_position;

-- 2. Vérifier les données récentes dans user_wine
SELECT 
  'Données user_wine récentes' as check_type,
  user_id,
  wine_id,
  amount,
  origin,
  liked,
  rating,
  created_at
FROM user_wine 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Vérifier les vins pour l'utilisateur connecté
SELECT 
  'Vins de l utilisateur' as check_type,
  uw.user_id,
  uw.wine_id,
  uw.amount,
  uw.origin,
  uw.liked,
  w.name as wine_name,
  w.year as vintage,
  w.wine_type,
  w.region
FROM user_wine uw
LEFT JOIN wine w ON uw.wine_id = w.id
WHERE uw.user_id = '27fd73b1-7088-4211-af88-3d075851f0db'
ORDER BY uw.created_at DESC;

-- 4. Compter les vins par origine
SELECT 
  'Comptage par origine' as check_type,
  origin,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM user_wine 
WHERE user_id = '27fd73b1-7088-4211-af88-3d075851f0db'
GROUP BY origin;

-- 5. Vérifier les vins avec amount = 0 (devraient être en wishlist)
SELECT 
  'Vins avec amount = 0' as check_type,
  uw.user_id,
  uw.wine_id,
  uw.amount,
  uw.origin,
  w.name as wine_name,
  w.year as vintage
FROM user_wine uw
LEFT JOIN wine w ON uw.wine_id = w.id
WHERE uw.user_id = '27fd73b1-7088-4211-af88-3d075851f0db'
  AND uw.amount = 0
ORDER BY uw.created_at DESC;

-- 6. Vérifier les erreurs récentes dans les logs (si disponible)
-- Note: Cette requête peut ne pas fonctionner selon les permissions
SELECT 
  'Logs récents' as check_type,
  timestamp,
  level,
  message
FROM pg_stat_activity 
WHERE query LIKE '%user_wine%' 
  AND state = 'active'
ORDER BY query_start DESC 
LIMIT 5; 