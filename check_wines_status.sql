-- Script pour vérifier l'état actuel des vins
-- Exécuter dans Supabase SQL Editor

-- 1. Compter tous les vins par statut d'image
SELECT 
    'ÉTAT ACTUEL' as phase,
    CASE 
        WHEN image_uri IS NULL THEN 'Pas d''image'
        WHEN image_uri LIKE 'file://%' THEN 'Image locale'
        WHEN image_uri LIKE 'https://%' THEN 'Image migrée'
        ELSE 'Format inconnu'
    END as image_status,
    COUNT(*) as count
FROM wine 
GROUP BY 
    CASE 
        WHEN image_uri IS NULL THEN 'Pas d''image'
        WHEN image_uri LIKE 'file://%' THEN 'Image locale'
        WHEN image_uri LIKE 'https://%' THEN 'Image migrée'
        ELSE 'Format inconnu'
    END
ORDER BY count DESC;

-- 2. Lister TOUS les vins avec leur statut
SELECT 
    id,
    name,
    image_uri,
    CASE 
        WHEN image_uri IS NULL THEN 'Pas d''image'
        WHEN image_uri LIKE 'file://%' THEN 'Image locale'
        WHEN image_uri LIKE 'https://%' THEN 'Image migrée'
        ELSE 'Format inconnu'
    END as status
FROM wine 
ORDER BY created_at DESC;

-- 3. Compter les entrées dans user_wine
SELECT 
    'ENTRÉES USER_WINE' as type,
    COUNT(*) as count
FROM user_wine;
