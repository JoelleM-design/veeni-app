-- =====================================================
-- SCRIPT D'EXTRACTION DES DONNÉES ACTUELLES
-- À exécuter dans Supabase SQL Editor pour récupérer les vraies données
-- Structure réelle de la base
-- =====================================================

-- 1. Extraire les utilisateurs
SELECT 
    'INSERT INTO public."User" (id, first_name, email, onboarding_complete, has_notifications_active, avatar_initial, created_at) VALUES' as header,
    '(' ||
    '''' || id || ''', ' ||
    '''' || first_name || ''', ' ||
    '''' || email || ''', ' ||
    onboarding_complete || ', ' ||
    has_notifications_active || ', ' ||
    COALESCE('''' || avatar_initial || '''', 'NULL') || ', ' ||
    '''' || created_at || '''' ||
    ');' as insert_statement
FROM public."User";

-- 2. Extraire les vins
SELECT 
    'INSERT INTO public.wine (id, name, year, wine_type, region, country_id, producer_id, designation_id, description, image_uri, acidity, tannins, strength, sugar, optimal_conso_date, price_range, grapes, created_at) VALUES' as header,
    '(' ||
    '''' || id || ''', ' ||
    '''' || name || ''', ' ||
    COALESCE('''' || year || '''', 'NULL') || ', ' ||
    COALESCE('''' || wine_type || '''', 'NULL') || ', ' ||
    COALESCE('''' || region || '''', 'NULL') || ', ' ||
    COALESCE('''' || country_id || '''', 'NULL') || ', ' ||
    COALESCE('''' || producer_id || '''', 'NULL') || ', ' ||
    COALESCE('''' || designation_id || '''', 'NULL') || ', ' ||
    COALESCE('''' || description || '''', 'NULL') || ', ' ||
    COALESCE('''' || image_uri || '''', 'NULL') || ', ' ||
    COALESCE(acidity::text, 'NULL') || ', ' ||
    COALESCE(tannins::text, 'NULL') || ', ' ||
    COALESCE(strength::text, 'NULL') || ', ' ||
    COALESCE(sugar::text, 'NULL') || ', ' ||
    COALESCE('''' || optimal_conso_date || '''', 'NULL') || ', ' ||
    COALESCE('''' || price_range || '''', 'NULL') || ', ' ||
    'ARRAY' || COALESCE(grapes::text, '[]') || ', ' ||
    '''' || created_at || '''' ||
    ');' as insert_statement
FROM public.wine;

-- 3. Extraire les user_wine
SELECT 
    'INSERT INTO public.user_wine (user_id, wine_id, amount, liked, rating, personal_comment, origin, history, created_at, updated_at) VALUES' as header,
    '(' ||
    '''' || user_id || ''', ' ||
    '''' || wine_id || ''', ' ||
    amount || ', ' ||
    liked || ', ' ||
    COALESCE(rating::text, 'NULL') || ', ' ||
    COALESCE('''' || personal_comment || '''', 'NULL') || ', ' ||
    '''' || origin || ''', ' ||
    '''' || COALESCE(history::text, '[]') || ''', ' ||
    '''' || created_at || ''', ' ||
    '''' || updated_at || '''' ||
    ');' as insert_statement
FROM public.user_wine;

-- 4. Extraire les producteurs
SELECT 
    'INSERT INTO public.producer (id, name) VALUES' as header,
    '(' ||
    '''' || id || ''', ' ||
    '''' || name || '''' ||
    ');' as insert_statement
FROM public.producer;

-- 5. Extraire les pays
SELECT 
    'INSERT INTO public.country (id, name, flag_emoji) VALUES' as header,
    '(' ||
    '''' || id || ''', ' ||
    '''' || name || ''', ' ||
    COALESCE('''' || flag_emoji || '''', 'NULL') ||
    ');' as insert_statement
FROM public.country;

-- 6. Extraire les designations
SELECT 
    'INSERT INTO public.designation (id, name) VALUES' as header,
    '(' ||
    '''' || id || ''', ' ||
    '''' || name || '''' ||
    ');' as insert_statement
FROM public.designation;

-- 7. Extraire les variétés de raisin
SELECT 
    'INSERT INTO public.grape_variety (id, name) VALUES' as header,
    '(' ||
    '''' || id || ''', ' ||
    '''' || name || '''' ||
    ');' as insert_statement
FROM public.grape_variety;

-- 8. Extraire les relations grapes_wine
SELECT 
    'INSERT INTO public.grapes_wine (wine_id, grape_variety_id) VALUES' as header,
    '(' ||
    '''' || wine_id || ''', ' ||
    '''' || grape_variety_id || '''' ||
    ');' as insert_statement
FROM public.grapes_wine;

-- 9. Extraire les amis
SELECT 
    'INSERT INTO public.friend (user_id, friend_id, status, created_at) VALUES' as header,
    '(' ||
    '''' || user_id || ''', ' ||
    '''' || friend_id || ''', ' ||
    '''' || status || ''', ' ||
    '''' || created_at || '''' ||
    ');' as insert_statement
FROM public.friend;

-- 10. Extraire l'historique des vins
SELECT 
    'INSERT INTO public.wine_history (id, user_id, wine_id, event_type, previous_amount, new_amount, rating, notes, event_date, created_at) VALUES' as header,
    '(' ||
    '''' || id || ''', ' ||
    '''' || user_id || ''', ' ||
    '''' || wine_id || ''', ' ||
    '''' || event_type || ''', ' ||
    COALESCE(previous_amount::text, 'NULL') || ', ' ||
    COALESCE(new_amount::text, 'NULL') || ', ' ||
    COALESCE(rating::text, 'NULL') || ', ' ||
    COALESCE('''' || notes || '''', 'NULL') || ', ' ||
    '''' || event_date || ''', ' ||
    '''' || created_at || '''' ||
    ');' as insert_statement
FROM public.wine_history;

-- 11. Extraire les logs OCR
SELECT 
    'INSERT INTO public.ocr_logs (id, user_id, image_count, created_at) VALUES' as header,
    '(' ||
    '''' || id || ''', ' ||
    COALESCE('''' || user_id || '''', 'NULL') || ', ' ||
    COALESCE(image_count::text, 'NULL') || ', ' ||
    '''' || created_at || '''' ||
    ');' as insert_statement
FROM public.ocr_logs;

-- 12. Statistiques des données
SELECT '=== STATISTIQUES DES DONNÉES ===' as info;
SELECT 'User:' as table_name, COUNT(*) as count FROM public."User"
UNION ALL
SELECT 'Wine:', COUNT(*) FROM public.wine
UNION ALL
SELECT 'User wine:', COUNT(*) FROM public.user_wine
UNION ALL
SELECT 'Producer:', COUNT(*) FROM public.producer
UNION ALL
SELECT 'Country:', COUNT(*) FROM public.country
UNION ALL
SELECT 'Designation:', COUNT(*) FROM public.designation
UNION ALL
SELECT 'Grape variety:', COUNT(*) FROM public.grape_variety
UNION ALL
SELECT 'Grapes wine:', COUNT(*) FROM public.grapes_wine
UNION ALL
SELECT 'Friend:', COUNT(*) FROM public.friend
UNION ALL
SELECT 'Wine history:', COUNT(*) FROM public.wine_history
UNION ALL
SELECT 'OCR logs:', COUNT(*) FROM public.ocr_logs; 