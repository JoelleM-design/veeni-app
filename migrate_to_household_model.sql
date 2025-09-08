-- Script de migration vers le modèle household correct
-- À exécuter APRÈS avoir exécuté fix_user_wine_for_household.sql

-- 1. Créer des households pour tous les utilisateurs existants
INSERT INTO public.households (id, name, join_code, created_at, updated_at)
SELECT 
  gen_random_uuid() as id,
  COALESCE(u.first_name || '''s Cave', 'Cave de ' || u.email) as name,
  upper(substring(md5(random()::text) from 1 for 6)) as join_code,
  now() as created_at,
  now() as updated_at
FROM public."User" u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_household uh 
  WHERE uh.user_id = u.id
);

-- 2. Associer chaque utilisateur à sa household
INSERT INTO public.user_household (user_id, household_id, created_at)
SELECT 
  u.id as user_id,
  h.id as household_id,
  now() as created_at
FROM public."User" u
JOIN public.households h ON h.name LIKE '%' || u.first_name || '%' OR h.name LIKE '%' || u.email || '%'
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_household uh 
  WHERE uh.user_id = u.id
);

-- 3. Migrer les vins existants vers le modèle household
-- Pour chaque vin existant, le déplacer vers la household de l'utilisateur

-- D'abord, créer une table temporaire avec les mappings user -> household
CREATE TEMP TABLE user_household_mapping AS
SELECT 
  u.id as user_id,
  uh.household_id
FROM public."User" u
JOIN public.user_household uh ON u.id = uh.user_id;

-- Mettre à jour user_wine pour utiliser household_id au lieu de user_id
UPDATE public.user_wine 
SET 
  household_id = uhm.household_id,
  user_id = NULL
FROM user_household_mapping uhm
WHERE user_wine.user_id = uhm.user_id;

-- 4. Migrer l'historique des vins
UPDATE public.wine_history 
SET 
  household_id = uhm.household_id,
  user_id = NULL
FROM user_household_mapping uhm
WHERE wine_history.user_id = uhm.user_id;

-- 5. Vérifier la migration
SELECT 
  'Vérification migration user_wine' as check_type,
  COUNT(*) as total_wines,
  COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as personal_wines,
  COUNT(CASE WHEN household_id IS NOT NULL THEN 1 END) as household_wines
FROM public.user_wine;

SELECT 
  'Vérification migration wine_history' as check_type,
  COUNT(*) as total_events,
  COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as personal_events,
  COUNT(CASE WHEN household_id IS NOT NULL THEN 1 END) as household_events
FROM public.wine_history;

-- 6. Vérifier qu'il n'y a pas de vins orphelins
SELECT 
  'Vérification vins orphelins' as check_type,
  COUNT(*) as orphaned_wines
FROM public.user_wine 
WHERE user_id IS NULL AND household_id IS NULL;

-- 7. Afficher un résumé des households créées
SELECT 
  'Résumé des households' as check_type,
  h.id,
  h.name,
  h.join_code,
  COUNT(uh.user_id) as member_count
FROM public.households h
LEFT JOIN public.user_household uh ON h.id = uh.household_id
GROUP BY h.id, h.name, h.join_code
ORDER BY h.created_at;

-- 8. Nettoyer la table temporaire
DROP TABLE user_household_mapping;
