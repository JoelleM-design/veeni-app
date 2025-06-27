-- Script pour corriger les liens entre les données existantes
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier et corriger les vins sans producteur
UPDATE wine 
SET producer_id = (
  SELECT id FROM producer WHERE name = wine.name LIMIT 1
)
WHERE producer_id IS NULL 
AND EXISTS (SELECT 1 FROM producer WHERE name = wine.name);

-- 2. Créer des producteurs manquants pour les vins existants
INSERT INTO producer (name)
SELECT DISTINCT wine.name
FROM wine 
WHERE producer_id IS NULL
AND NOT EXISTS (SELECT 1 FROM producer WHERE name = wine.name);

-- 3. Mettre à jour les vins avec les nouveaux producteurs créés
UPDATE wine 
SET producer_id = (
  SELECT id FROM producer WHERE name = wine.name LIMIT 1
)
WHERE producer_id IS NULL;

-- 4. Vérifier et corriger les vins sans pays
UPDATE wine 
SET country_id = (
  SELECT id FROM country WHERE name = 'France' LIMIT 1
)
WHERE country_id IS NULL;

-- 5. Créer le pays France s'il n'existe pas
INSERT INTO country (name, flag_emoji)
SELECT 'France', '🇫🇷'
WHERE NOT EXISTS (SELECT 1 FROM country WHERE name = 'France');

-- 6. Mettre à jour les vins avec le pays France
UPDATE wine 
SET country_id = (
  SELECT id FROM country WHERE name = 'France' LIMIT 1
)
WHERE country_id IS NULL;

-- 7. Nettoyer les entrées user_wine orphelines (sans vin correspondant)
DELETE FROM user_wine 
WHERE wine_id NOT IN (SELECT id FROM wine);

-- 8. Mettre à jour les colonnes manquantes dans user_wine
UPDATE user_wine 
SET origin = CASE 
  WHEN amount > 0 THEN 'cellar' 
  ELSE 'wishlist' 
END 
WHERE origin IS NULL;

-- 9. Vérifier que tous les vins ont les colonnes requises
UPDATE wine 
SET grapes = '[]'::jsonb
WHERE grapes IS NULL;

-- 10. Vérification finale
SELECT 
  'Correction terminée' as status,
  (SELECT COUNT(*) FROM wine WHERE producer_id IS NOT NULL) as wines_with_producer,
  (SELECT COUNT(*) FROM wine WHERE country_id IS NOT NULL) as wines_with_country,
  (SELECT COUNT(*) FROM user_wine WHERE origin IS NOT NULL) as user_wines_with_origin,
  (SELECT COUNT(*) FROM wine WHERE grapes IS NOT NULL) as wines_with_grapes; 