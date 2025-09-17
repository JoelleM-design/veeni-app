-- Script de nettoyage des doublons dans la wishlist
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. D'abord, afficher les doublons pour vérification
WITH duplicates AS (
  SELECT 
    uw1.user_id,
    uw1.wine_id,
    uw1.created_at,
    w.name,
    w.wine_type,
    w.region,
    p.name as producer_name,
    ROW_NUMBER() OVER (
      PARTITION BY uw1.user_id, w.name, w.wine_type, w.region, COALESCE(p.name, '')
      ORDER BY uw1.created_at DESC
    ) as rn
  FROM user_wine uw1
  JOIN wine w ON uw1.wine_id = w.id
  LEFT JOIN producer p ON w.producer_id = p.id
  WHERE uw1.origin = 'wishlist'
)
SELECT 
  'DOUBLONS À SUPPRIMER:' as action,
  user_id,
  wine_id,
  name,
  wine_type,
  region,
  producer_name
FROM duplicates 
WHERE rn > 1
ORDER BY user_id, name;

-- 2. Supprimer les doublons (exécuter cette requête séparément)
DELETE FROM user_wine 
WHERE (user_id, wine_id) IN (
  WITH duplicates AS (
    SELECT 
      uw1.user_id,
      uw1.wine_id,
      uw1.created_at,
      w.name,
      w.wine_type,
      w.region,
      p.name as producer_name,
      ROW_NUMBER() OVER (
        PARTITION BY uw1.user_id, w.name, w.wine_type, w.region, COALESCE(p.name, '')
        ORDER BY uw1.created_at DESC
      ) as rn
    FROM user_wine uw1
    JOIN wine w ON uw1.wine_id = w.id
    LEFT JOIN producer p ON w.producer_id = p.id
    WHERE uw1.origin = 'wishlist'
  )
  SELECT user_id, wine_id
  FROM duplicates 
  WHERE rn > 1
);

-- 3. Vérifier qu'il n'y a plus de doublons (exécuter cette requête séparément)
SELECT 
  'APRÈS NETTOYAGE:' as action,
  uw.user_id,
  w.name,
  w.wine_type,
  w.region,
  p.name as producer_name,
  COUNT(*) as count
FROM user_wine uw
JOIN wine w ON uw.wine_id = w.id
LEFT JOIN producer p ON w.producer_id = p.id
WHERE uw.origin = 'wishlist'
GROUP BY uw.user_id, w.name, w.wine_type, w.region, p.name
HAVING COUNT(*) > 1
ORDER BY uw.user_id, w.name;
