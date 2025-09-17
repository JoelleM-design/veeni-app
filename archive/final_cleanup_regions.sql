-- Nettoyage final des régions restantes dans la table country

-- 1. Mettre à jour les vins qui référencent encore des régions vers "France"
UPDATE wine 
SET country_id = (SELECT id FROM country WHERE name = 'France' LIMIT 1)
WHERE country_id IN (
  SELECT id FROM country 
  WHERE name IN (
    'Bordeaux Supérieur',
    'BOURGOGNE', 
    'Jumilla',
    'Languedoc',
    'Méditerranée',
    'Muscadet Sèvre et Maine'
  )
);

-- 2. Supprimer les régions devenues inutiles
DELETE FROM country 
WHERE name IN (
  'Bordeaux Supérieur',
  'BOURGOGNE', 
  'Jumilla',
  'Languedoc',
  'Méditerranée',
  'Muscadet Sèvre et Maine'
);

-- 3. Vérifier le résultat final
SELECT 'RÉSULTAT FINAL' as status;
SELECT name, flag_emoji, 
  (SELECT COUNT(*) FROM wine WHERE country_id = country.id) as wine_count
FROM country 
ORDER BY name;
