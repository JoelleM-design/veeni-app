-- Script pour nettoyer les households automatiques créés lors de la migration
-- Ne garder que les vrais households partagés (avec plusieurs membres)

-- 1. Migrer les vins des households automatiques vers le mode individuel
UPDATE user_wine 
SET 
  user_id = uh.user_id,
  household_id = NULL
FROM user_household uh
WHERE user_wine.household_id = uh.household_id
AND uh.household_id IN (
  SELECT household_id
  FROM user_household
  GROUP BY household_id
  HAVING COUNT(*) = 1
);

-- 2. Migrer l'historique des households automatiques vers le mode individuel
UPDATE wine_history 
SET 
  user_id = uh.user_id,
  household_id = NULL
FROM user_household uh
WHERE wine_history.household_id = uh.household_id
AND uh.household_id IN (
  SELECT household_id
  FROM user_household
  GROUP BY household_id
  HAVING COUNT(*) = 1
);

-- 3. Supprimer les associations user_household des households automatiques
DELETE FROM user_household 
WHERE household_id IN (
  SELECT household_id
  FROM user_household
  GROUP BY household_id
  HAVING COUNT(*) = 1
);

-- 4. Supprimer les households automatiques
DELETE FROM households 
WHERE id IN (
  SELECT household_id
  FROM user_household
  GROUP BY household_id
  HAVING COUNT(*) = 1
);

-- 7. Vérifier le résultat
SELECT 
  'Vérification après nettoyage' as check_type,
  COUNT(*) as total_households,
  COUNT(CASE WHEN member_count = 1 THEN 1 END) as single_member_households,
  COUNT(CASE WHEN member_count > 1 THEN 1 END) as shared_households
FROM (
  SELECT h.id, COUNT(uh.user_id) as member_count
  FROM households h
  LEFT JOIN user_household uh ON h.id = uh.household_id
  GROUP BY h.id
) household_stats;

-- 8. Vérifier les vins après migration
SELECT 
  'Vérification vins après migration' as check_type,
  COUNT(*) as total_wines,
  COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as personal_wines,
  COUNT(CASE WHEN household_id IS NOT NULL THEN 1 END) as household_wines
FROM user_wine;
