-- Rechercher toutes les références à l'alias "wh" dans la base de données
-- Cela peut être dans des vues, des politiques RLS, des triggers, etc.

-- 1. Rechercher dans les vues
SELECT 
    table_name,
    view_definition
FROM information_schema.views 
WHERE table_schema = 'public'
AND view_definition LIKE '%wh.%';

-- 2. Rechercher dans les politiques RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    qual,
    with_check
FROM pg_policies 
WHERE qual LIKE '%wh.%' OR with_check LIKE '%wh.%';

-- 3. Rechercher dans les fonctions/triggers
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_definition LIKE '%wh.%';

-- 4. Rechercher dans les triggers
SELECT 
    trigger_name,
    action_statement
FROM information_schema.triggers 
WHERE action_statement LIKE '%wh.%';

-- 5. Rechercher spécifiquement les vues qui utilisent wine_history avec l'alias wh
SELECT 
    table_name,
    view_definition
FROM information_schema.views 
WHERE table_schema = 'public'
AND view_definition LIKE '%wine_history%wh%';

-- 6. Rechercher les politiques RLS qui utilisent wine_history avec l'alias wh
SELECT 
    schemaname,
    tablename,
    policyname,
    qual,
    with_check
FROM pg_policies 
WHERE (qual LIKE '%wine_history%' AND qual LIKE '%wh.%') 
   OR (with_check LIKE '%wine_history%' AND with_check LIKE '%wh.%'); 