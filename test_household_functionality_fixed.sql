-- =====================================================
-- TESTS DE LA FONCTIONNALITÉ HOUSEHOLD (VERSION CORRIGÉE)
-- Étape 3 : Vérifier que tout fonctionne
-- =====================================================

-- =====================================================
-- 1. TESTS DE BASE
-- =====================================================

-- Test 1: Vérifier que les tables existent
SELECT 
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN '✅ Table existe'
    ELSE '❌ Table manquante'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('households', 'user_household');

-- Test 2: Vérifier la structure des tables
SELECT 
  'Structure households' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'households'
ORDER BY ordinal_position;

SELECT 
  'Structure user_household' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_household'
ORDER BY ordinal_position;

-- =====================================================
-- 2. TESTS DES CONTRAINTES
-- =====================================================

-- Test 3: Vérifier que chaque utilisateur n'a qu'une seule household
SELECT 
  'Test unicité user_household' as test,
  CASE 
    WHEN COUNT(*) = COUNT(DISTINCT user_id) THEN '✅ Chaque utilisateur a une seule household'
    ELSE '❌ Certains utilisateurs ont plusieurs households'
  END as result
FROM public.user_household;

-- Test 4: Vérifier qu'il n'y a pas d'utilisateurs orphelins
SELECT 
  'Test utilisateurs orphelins' as test,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Aucun utilisateur orphelin'
    ELSE '❌ ' || COUNT(*) || ' utilisateurs sans household'
  END as result
FROM public."User" u
LEFT JOIN public.user_household uh ON u.id = uh.user_id
WHERE uh.user_id IS NULL;

-- Test 5: Vérifier l'unicité des join_codes
SELECT 
  'Test unicité join_codes' as test,
  CASE 
    WHEN COUNT(*) = COUNT(DISTINCT join_code) THEN '✅ Tous les join_codes sont uniques'
    ELSE '❌ Doublons dans les join_codes'
  END as result
FROM public.households;

-- =====================================================
-- 3. TESTS DES RELATIONS
-- =====================================================

-- Test 6: Vérifier les clés étrangères
SELECT 
  'Test clés étrangères user_household' as test,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Toutes les clés étrangères sont valides'
    ELSE '❌ ' || COUNT(*) || ' clés étrangères invalides'
  END as result
FROM public.user_household uh
LEFT JOIN public."User" u ON uh.user_id = u.id
LEFT JOIN public.households h ON uh.household_id = h.id
WHERE u.id IS NULL OR h.id IS NULL;

-- =====================================================
-- 4. TESTS DES POLICIES RLS
-- =====================================================

-- Test 7: Vérifier que RLS est activé
SELECT 
  'Test RLS households' as test,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS activé sur households'
    ELSE '❌ RLS désactivé sur households'
  END as result
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'households';

SELECT 
  'Test RLS user_household' as test,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS activé sur user_household'
    ELSE '❌ RLS désactivé sur user_household'
  END as result
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'user_household';

-- =====================================================
-- 5. TESTS DES FONCTIONS
-- =====================================================

-- Test 8: Tester la fonction generate_join_code
SELECT 
  'Test generate_join_code' as test,
  CASE 
    WHEN generate_join_code() ~ '^[A-Z0-9]{6}$' THEN '✅ Fonction generate_join_code fonctionne'
    ELSE '❌ Fonction generate_join_code défaillante'
  END as result;

-- =====================================================
-- 6. APERÇU DES DONNÉES
-- =====================================================

-- Afficher un échantillon des households créées
SELECT 
  'Aperçu des households' as section,
  h.id,
  h.name,
  h.join_code,
  h.created_at,
  u.first_name,
  u.email
FROM public.households h
JOIN public.user_household uh ON h.id = uh.household_id
JOIN public."User" u ON uh.user_id = u.id
ORDER BY h.created_at
LIMIT 5;

-- =====================================================
-- 7. STATISTIQUES FINALES
-- =====================================================

SELECT 
  'Résumé final' as section,
  (SELECT COUNT(*) FROM public.households) as total_households,
  (SELECT COUNT(*) FROM public.user_household) as total_memberships,
  (SELECT COUNT(*) FROM public."User") as total_users,
  (SELECT COUNT(DISTINCT household_id) FROM public.user_household) as unique_households;

-- Test final d'intégrité
SELECT 
  'Test d''intégrité global' as test,
  CASE 
    WHEN (SELECT COUNT(*) FROM public."User") = (SELECT COUNT(*) FROM public.user_household)
     AND (SELECT COUNT(*) FROM public.households) = (SELECT COUNT(DISTINCT household_id) FROM public.user_household)
     AND (SELECT COUNT(*) FROM public.user_household) = (SELECT COUNT(DISTINCT user_id) FROM public.user_household)
    THEN '✅ Intégrité parfaite des données'
    ELSE '❌ Problème d''intégrité détecté'
  END as result; 