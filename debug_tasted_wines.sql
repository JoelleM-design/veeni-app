-- Debug: Vérifier les vins avec origin = 'tasted'
SELECT 
  uw.id,
  uw.wine_id,
  uw.origin,
  uw.amount,
  w.name as wine_name,
  w.wine_type
FROM user_wine uw
JOIN wine w ON uw.wine_id = w.id
WHERE uw.user_id = auth.uid()
ORDER BY uw.origin;

-- Debug: Vérifier les dégustations dans wine_history
SELECT 
  wh.id,
  wh.wine_id,
  wh.user_id,
  wh.tasted_at,
  w.name as wine_name
FROM wine_history wh
JOIN wine w ON wh.wine_id = w.id
WHERE wh.user_id = auth.uid()
ORDER BY wh.tasted_at DESC
LIMIT 10;

-- Debug: Compter les dégustations par vin
SELECT 
  wh.wine_id,
  w.name as wine_name,
  COUNT(*) as tasting_count
FROM wine_history wh
JOIN wine w ON wh.wine_id = w.id
WHERE wh.user_id = auth.uid()
GROUP BY wh.wine_id, w.name
ORDER BY tasting_count DESC; 