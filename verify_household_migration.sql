-- =====================================================
-- VÉRIFICATION RAPIDE DE LA MIGRATION HOUSEHOLD
-- =====================================================

-- Vérification 1: Tables existent
SELECT 
  'Tables créées' as verification,
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('households', 'user_household');

-- Vérification 2: Données migrées
SELECT 
  'Utilisateurs avec household' as verification,
  COUNT(*) as count
FROM public.user_household;

-- Vérification 3: Aucun utilisateur orphelin
SELECT 
  'Utilisateurs orphelins' as verification,
  COUNT(*) as count
FROM public."User" u
LEFT JOIN public.user_household uh ON u.id = uh.user_id
WHERE uh.user_id IS NULL;

-- Vérification 4: Intégrité des données
SELECT 
  'Test intégrité' as verification,
  CASE 
    WHEN (SELECT COUNT(*) FROM public."User") = (SELECT COUNT(*) FROM public.user_household)
     AND (SELECT COUNT(*) FROM public.households) = (SELECT COUNT(DISTINCT household_id) FROM public.user_household)
    THEN '✅ Migration réussie'
    ELSE '❌ Problème détecté'
  END as result;

-- Aperçu des 5 premières households
SELECT 
  'Aperçu households' as section,
  h.name,
  h.join_code,
  u.first_name,
  u.email
FROM public.households h
JOIN public.user_household uh ON h.id = uh.household_id
JOIN public."User" u ON uh.user_id = u.id
ORDER BY h.created_at
LIMIT 5; 