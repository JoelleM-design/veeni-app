-- Vérifier les entrées de dégustation dans wine_history
SELECT 
  id,
  user_id,
  wine_id,
  event_type,
  event_date,
  notes,
  rating,
  created_at
FROM wine_history 
WHERE event_type = 'tasted'
ORDER BY created_at DESC
LIMIT 10;

-- Compter le nombre total de dégustations
SELECT 
  COUNT(*) as total_tastings,
  COUNT(DISTINCT wine_id) as unique_wines_tasted
FROM wine_history 
WHERE event_type = 'tasted';

-- Vérifier s'il y a des entrées récentes
SELECT 
  COUNT(*) as recent_tastings
FROM wine_history 
WHERE event_type = 'tasted' 
  AND created_at >= NOW() - INTERVAL '1 day';

