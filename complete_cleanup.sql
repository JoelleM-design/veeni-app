-- Script pour nettoyer complètement la base de données
-- Exécuter dans Supabase SQL Editor

-- 1. Voir l'état actuel complet
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

-- 2. Lister tous les vins
SELECT 
    id,
    name,
    image_uri,
    'Vin dans la base' as status
FROM wine 
ORDER BY created_at DESC;

-- 3. Supprimer TOUS les vins qui n'ont pas d'image valide
-- D'abord supprimer les entrées dans user_wine
DELETE FROM user_wine 
WHERE wine_id IN (
    SELECT id FROM wine 
    WHERE image_uri IS NULL 
       OR image_uri LIKE 'file://%' 
       OR image_uri NOT LIKE 'https://%'
);

-- Ensuite supprimer les vins eux-mêmes
DELETE FROM wine 
WHERE image_uri IS NULL 
   OR image_uri LIKE 'file://%' 
   OR image_uri NOT LIKE 'https://%';

-- 4. Vérifier le résultat final
SELECT 
    'APRÈS NETTOYAGE' as phase,
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

-- 5. Afficher les vins restants
SELECT 
    id,
    name,
    image_uri,
    'Vin conservé' as status
FROM wine 
ORDER BY created_at DESC;

-- 6. Compter les entrées user_wine restantes
SELECT 
    'ENTRÉES USER_WINE RESTANTES' as type,
    COUNT(*) as count
FROM user_wine;
