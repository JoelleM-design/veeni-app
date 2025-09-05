-- Script pour identifier les vins avec des images locales qui doivent être migrées
-- Exécuter dans Supabase SQL Editor

-- 1. Identifier les vins avec des images locales
SELECT 
    id,
    name,
    image_uri,
    CASE 
        WHEN image_uri IS NULL THEN 'Pas d''image'
        WHEN image_uri LIKE 'file://%' THEN 'Image locale (à migrer)'
        WHEN image_uri LIKE 'https://%' THEN 'Image déjà migrée'
        ELSE 'Format inconnu'
    END as image_status
FROM wine 
ORDER BY created_at DESC;

-- 2. Compter les vins par statut d'image
SELECT 
    CASE 
        WHEN image_uri IS NULL THEN 'Pas d''image'
        WHEN image_uri LIKE 'file://%' THEN 'Image locale (à migrer)'
        WHEN image_uri LIKE 'https://%' THEN 'Image déjà migrée'
        ELSE 'Format inconnu'
    END as image_status,
    COUNT(*) as count
FROM wine 
GROUP BY 
    CASE 
        WHEN image_uri IS NULL THEN 'Pas d''image'
        WHEN image_uri LIKE 'file://%' THEN 'Image locale (à migrer)'
        WHEN image_uri LIKE 'https://%' THEN 'Image déjà migrée'
        ELSE 'Format inconnu'
    END
ORDER BY count DESC;
