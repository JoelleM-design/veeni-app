-- Rechercher les politiques RLS qui font des requêtes avec GROUP BY
SELECT 
    schemaname,
    tablename,
    policyname,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_wine' 
AND (qual LIKE '%GROUP BY%' OR qual LIKE '%wh.%' OR with_check LIKE '%GROUP BY%' OR with_check LIKE '%wh.%');

-- Rechercher les triggers sur user_wine
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'user_wine';

-- Rechercher les fonctions qui contiennent "wh." et "GROUP BY"
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_definition LIKE '%wh.%'
AND routine_definition LIKE '%GROUP BY%';

-- Rechercher les vues qui pourraient causer le problème
SELECT 
    table_name,
    view_definition
FROM information_schema.views 
WHERE table_schema = 'public'
AND view_definition LIKE '%wh.%'
AND view_definition LIKE '%GROUP BY%'; 