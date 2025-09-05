-- Script pour vérifier les vins liés aux utilisateurs
-- Exécuter dans Supabase SQL Editor

-- 1. Voir tous les vins avec leurs images
SELECT 
    'VINS AVEC IMAGES' as section,
    w.id,
    w.name,
    w.image_uri,
    w.created_at
FROM wine w
WHERE w.image_uri LIKE 'https://%'
ORDER BY w.created_at DESC;

-- 2. Voir les entrées user_wine
SELECT 
    'ENTRÉES USER_WINE' as section,
    uw.user_id,
    uw.wine_id,
    uw.origin,
    uw.amount,
    uw.created_at
FROM user_wine uw
ORDER BY uw.created_at DESC;

-- 3. Voir les vins liés aux utilisateurs (JOIN)
SELECT 
    'VINS LIÉS AUX UTILISATEURS' as section,
    w.id,
    w.name,
    w.image_uri,
    uw.origin,
    uw.amount,
    uw.user_id
FROM wine w
JOIN user_wine uw ON w.id = uw.wine_id
WHERE w.image_uri LIKE 'https://%'
ORDER BY w.created_at DESC;

-- 4. Compter les vins par utilisateur
SELECT 
    'COMPTEUR PAR UTILISATEUR' as section,
    uw.user_id,
    COUNT(*) as nombre_vins
FROM user_wine uw
JOIN wine w ON uw.wine_id = w.id
WHERE w.image_uri LIKE 'https://%'
GROUP BY uw.user_id;
