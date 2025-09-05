-- Script pour vérifier les images dans Supabase Storage
-- Exécuter dans Supabase SQL Editor

-- 1. Vérifier les fichiers dans le bucket wines
SELECT 
    'FICHIERS DANS BUCKET WINES' as section,
    name,
    bucket_id,
    created_at
FROM storage.objects 
WHERE bucket_id = 'wines'
ORDER BY created_at DESC;

-- 2. Compter les fichiers par type
SELECT 
    'COMPTEUR FICHIERS' as section,
    COUNT(*) as total_fichiers
FROM storage.objects 
WHERE bucket_id = 'wines';

-- 3. Vérifier les vins avec images dans la base
SELECT 
    'VINS AVEC IMAGES' as section,
    id,
    name,
    image_uri,
    CASE 
        WHEN image_uri IS NULL THEN 'Pas d''image'
        WHEN image_uri LIKE 'file://%' THEN 'Image locale'
        WHEN image_uri LIKE 'https://%' THEN 'Image Supabase'
        ELSE 'Format inconnu'
    END as type_image
FROM wine 
WHERE image_uri IS NOT NULL
ORDER BY created_at DESC;

-- 4. Compter les vins par type d'image
SELECT 
    'COMPTEUR VINS' as section,
    CASE 
        WHEN image_uri IS NULL THEN 'Pas d''image'
        WHEN image_uri LIKE 'file://%' THEN 'Image locale'
        WHEN image_uri LIKE 'https://%' THEN 'Image Supabase'
        ELSE 'Format inconnu'
    END as type_image,
    COUNT(*) as nombre
FROM wine 
GROUP BY 
    CASE 
        WHEN image_uri IS NULL THEN 'Pas d''image'
        WHEN image_uri LIKE 'file://%' THEN 'Image locale'
        WHEN image_uri LIKE 'https://%' THEN 'Image Supabase'
        ELSE 'Format inconnu'
    END
ORDER BY nombre DESC;
