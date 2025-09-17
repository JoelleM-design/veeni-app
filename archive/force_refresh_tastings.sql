-- Script pour forcer le rafraîchissement des données de dégustation
-- Ce script va créer une entrée de test pour vérifier que le système fonctionne

-- 1. Vérifier les vins disponibles avec du stock
SELECT 
  uw.user_id,
  uw.wine_id,
  uw.amount,
  w.name,
  w.year,
  w.wine_type
FROM user_wine uw
JOIN wine w ON uw.wine_id = w.id
WHERE uw.amount > 0
ORDER BY uw.updated_at DESC
LIMIT 3;

-- 2. Vérifier les entrées de dégustation existantes
SELECT 
  wh.id,
  wh.user_id,
  wh.wine_id,
  wh.event_type,
  wh.event_date,
  wh.notes,
  w.name as wine_name
FROM wine_history wh
JOIN wine w ON wh.wine_id = w.id
WHERE wh.event_type = 'tasted'
ORDER BY wh.created_at DESC
LIMIT 5;

-- 3. Compter les dégustations par utilisateur
SELECT 
  user_id,
  COUNT(*) as total_tastings,
  COUNT(DISTINCT wine_id) as unique_wines_tasted
FROM wine_history 
WHERE event_type = 'tasted'
GROUP BY user_id;

