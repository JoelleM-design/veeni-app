-- Vérifier les données d'un vin spécifique
SELECT 
  id,
  name,
  year,
  region,
  country,
  price_range,
  wine_type,
  grapes
FROM wine 
WHERE name ILIKE '%miocène%' 
   OR name ILIKE '%miocene%'
ORDER BY created_at DESC
LIMIT 5;
