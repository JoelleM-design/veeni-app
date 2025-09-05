-- Script pour supprimer TOUS les vins SANS photo
-- Exécuter dans Supabase SQL Editor

-- 1. Voir quels vins n'ont pas de photo (avant suppression)
SELECT 
    'AVANT SUPPRESSION' as phase,
    CASE 
        WHEN image_uri IS NULL THEN 'Pas d''image (à supprimer)'
        WHEN image_uri LIKE 'file://%' THEN 'Image locale (à supprimer)'
        WHEN image_uri LIKE 'https://%' THEN 'Image migrée (à conserver)'
        ELSE 'Format inconnu (à supprimer)'
    END as image_status,
    COUNT(*) as count
FROM wine 
GROUP BY 
    CASE 
        WHEN image_uri IS NULL THEN 'Pas d''image (à supprimer)'
        WHEN image_uri LIKE 'file://%' THEN 'Image locale (à supprimer)'
        WHEN image_uri LIKE 'https://%' THEN 'Image migrée (à conserver)'
        ELSE 'Format inconnu (à supprimer)'
    END
ORDER BY count DESC;

-- 2. Lister les vins qui vont être supprimés (ceux SANS photo)
SELECT 
    id,
    name,
    image_uri,
    'Vin à supprimer (pas de photo)' as status
FROM wine 
WHERE image_uri IS NULL OR image_uri LIKE 'file://%' OR image_uri NOT LIKE 'https://%'
ORDER BY created_at DESC;

-- 3. Supprimer TOUS les vins SANS photo (suppression complète)
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

-- 4. Vérifier le résultat (après suppression)
SELECT 
    'APRÈS SUPPRESSION' as phase,
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

-- 5. Afficher les vins restants (seulement ceux AVEC photo)
SELECT 
    id,
    name,
    image_uri,
    'Vin conservé (avec photo)' as status
FROM wine 
ORDER BY created_at DESC;
