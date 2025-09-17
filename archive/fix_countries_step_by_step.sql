-- Script étape par étape pour corriger la liste des pays

-- ÉTAPE 1: Vérifier l'état actuel
SELECT 'ÉTAT ACTUEL' as step;
SELECT name, flag_emoji, 
  (SELECT COUNT(*) FROM wine WHERE country_id = country.id) as wine_count
FROM country 
WHERE name IN ('Bordeaux', 'BORDEAUX', 'Beaujolais-Villages', 'Champagne')
ORDER BY name;

-- ÉTAPE 2: Mettre à jour les vins Bordeaux vers France
UPDATE wine 
SET country_id = (SELECT id FROM country WHERE name = 'France' LIMIT 1)
WHERE country_id IN (
  SELECT id FROM country WHERE name IN ('Bordeaux', 'BORDEAUX')
);

-- ÉTAPE 3: Vérifier que les vins ont été mis à jour
SELECT 'APRÈS MISE À JOUR BORDEAUX' as step;
SELECT name, flag_emoji, 
  (SELECT COUNT(*) FROM wine WHERE country_id = country.id) as wine_count
FROM country 
WHERE name IN ('Bordeaux', 'BORDEAUX', 'France')
ORDER BY name;

-- ÉTAPE 4: Supprimer les régions devenues inutiles
DELETE FROM country 
WHERE name IN (
  'Bordeaux', 'BORDEAUX', 'Beaujolais-Villages', 'Champagne', 
  'Bourgogne', 'Alsace', 'Loire', 'Rhône', 'Languedoc-Roussillon', 
  'Provence', 'Sud-Ouest', 'Corsica', 'Jura', 'Savoie', 'Anjou', 
  'Touraine', 'Sancerre', 'Côtes du Rhône', 'Côtes de Provence'
);

-- ÉTAPE 5: Résultat final
SELECT 'RÉSULTAT FINAL' as step;
SELECT name, flag_emoji, 
  (SELECT COUNT(*) FROM wine WHERE country_id = country.id) as wine_count
FROM country 
ORDER BY name;
