-- =====================================================
-- MIGRATION DES UTILISATEURS EXISTANTS VERS DES HOUSEHOLDS
-- Étape 2 : Créer une household pour chaque utilisateur
-- =====================================================

-- =====================================================
-- 1. VÉRIFICATION PRÉ-MIGRATION
-- =====================================================

-- Compter les utilisateurs existants
SELECT 
  'Utilisateurs existants' as info,
  COUNT(*) as count
FROM public."User";

-- Vérifier qu'il n'y a pas déjà des households
SELECT 
  'Households existantes' as info,
  COUNT(*) as count
FROM public.households;

-- =====================================================
-- 2. MIGRATION DES UTILISATEURS
-- =====================================================

-- Créer une household pour chaque utilisateur existant
INSERT INTO public.households (name, join_code)
SELECT 
  'Cave de ' || COALESCE(first_name, 'Utilisateur') as name,
  generate_join_code() as join_code
FROM public."User"
WHERE id NOT IN (
  SELECT user_id FROM public.user_household
);

-- Associer chaque utilisateur à sa household
INSERT INTO public.user_household (user_id, household_id)
SELECT 
  u.id as user_id,
  h.id as household_id
FROM public."User" u
JOIN public.households h ON h.name = 'Cave de ' || COALESCE(u.first_name, 'Utilisateur')
WHERE u.id NOT IN (
  SELECT user_id FROM public.user_household
);

-- =====================================================
-- 3. VÉRIFICATION POST-MIGRATION
-- =====================================================

-- Vérifier que tous les utilisateurs ont une household
SELECT 
  'Utilisateurs avec household' as info,
  COUNT(*) as count
FROM public.user_household;

-- Vérifier qu'il n'y a pas d'utilisateurs orphelins
SELECT 
  'Utilisateurs sans household' as info,
  COUNT(*) as count
FROM public."User" u
LEFT JOIN public.user_household uh ON u.id = uh.user_id
WHERE uh.user_id IS NULL;

-- Afficher un aperçu des households créées
SELECT 
  h.id,
  h.name,
  h.join_code,
  u.first_name,
  u.email
FROM public.households h
JOIN public.user_household uh ON h.id = uh.household_id
JOIN public."User" u ON uh.user_id = u.id
ORDER BY h.created_at;

-- =====================================================
-- 4. STATISTIQUES FINALES
-- =====================================================

SELECT 
  'Résumé de la migration' as section,
  (SELECT COUNT(*) FROM public.households) as total_households,
  (SELECT COUNT(*) FROM public.user_household) as total_memberships,
  (SELECT COUNT(*) FROM public."User") as total_users;

-- Vérifier l'intégrité des données
SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM public."User") = (SELECT COUNT(*) FROM public.user_household)
    THEN '✅ Migration réussie : tous les utilisateurs ont une household'
    ELSE '❌ Erreur : certains utilisateurs n''ont pas de household'
  END as migration_status; 