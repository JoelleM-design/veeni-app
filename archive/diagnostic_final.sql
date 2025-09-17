-- Diagnostic complet de la situation actuelle
-- Exécuter dans Supabase SQL Editor

-- 1. Voir tous les vins restants
SELECT 
    id,
    name,
    image_uri,
    created_at,
    'Vin dans wine' as table_source
FROM wine 
ORDER BY created_at DESC;

-- 2. Voir toutes les entrées user_wine
SELECT 
    user_id,
    wine_id,
    origin,
    amount,
    'Entrée user_wine' as table_source
FROM user_wine 
ORDER BY created_at DESC;

-- 3. Voir les vins liés aux utilisateurs (JOIN)
SELECT 
    w.id,
    w.name,
    w.image_uri,
    uw.origin,
    uw.amount,
    'Vin lié à utilisateur' as status
FROM wine w
JOIN user_wine uw ON w.id = uw.wine_id
ORDER BY w.created_at DESC;

-- 4. Compter le total
SELECT 
    'TOTAL VINS' as type,
    COUNT(*) as count
FROM wine;

SELECT 
    'TOTAL USER_WINE' as type,
    COUNT(*) as count
FROM user_wine;
