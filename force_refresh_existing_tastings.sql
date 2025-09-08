-- Script pour forcer le rafraîchissement des dégustations existantes
-- Ce script va créer une entrée de test pour déclencher le rafraîchissement

-- 1. Vérifier les dégustations existantes
SELECT 
  wh.id,
  wh.user_id,
  wh.wine_id,
  wh.event_type,
  wh.event_date,
  wh.notes,
  w.name as wine_name,
  w.year
FROM wine_history wh
JOIN wine w ON wh.wine_id = w.id
WHERE wh.event_type = 'tasted'
ORDER BY wh.created_at DESC;

-- 2. Vérifier que l'utilisateur a bien des vins en stock
SELECT 
  uw.user_id,
  uw.wine_id,
  uw.amount,
  w.name,
  w.year
FROM user_wine uw
JOIN wine w ON uw.wine_id = w.id
WHERE uw.user_id = '27fd73b1-7088-4211-af88-3d075851f0db'
  AND uw.amount > 0
ORDER BY uw.updated_at DESC;

-- 3. Compter les dégustations par vin
SELECT 
  wh.wine_id,
  w.name as wine_name,
  COUNT(*) as tasting_count
FROM wine_history wh
JOIN wine w ON wh.wine_id = w.id
WHERE wh.event_type = 'tasted'
  AND wh.user_id = '27fd73b1-7088-4211-af88-3d075851f0db'
GROUP BY wh.wine_id, w.name
ORDER BY tasting_count DESC;
je
