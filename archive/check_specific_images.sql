-- Script pour vérifier les images spécifiques
-- Exécuter dans Supabase SQL Editor

-- 1. Voir les 3 vins avec images Supabase
SELECT 
    'VINS AVEC IMAGES SUPABASE' as section,
    id,
    name,
    image_uri,
    created_at
FROM wine 
WHERE image_uri LIKE 'https://%'
ORDER BY created_at DESC;

-- 2. Vérifier les fichiers dans le bucket wines
SELECT 
    'FICHIERS DANS BUCKET' as section,
    name,
    bucket_id,
    created_at
FROM storage.objects 
WHERE bucket_id = 'wines'
ORDER BY created_at DESC;

-- 3. Vérifier si les URLs des vins correspondent aux fichiers
SELECT 
    'CORRESPONDANCE' as section,
    w.id as wine_id,
    w.name as wine_name,
    w.image_uri,
    CASE 
        WHEN w.image_uri LIKE '%' || o.name THEN 'CORRESPOND'
        ELSE 'NO MATCH'
    END as match_status
FROM wine w
LEFT JOIN storage.objects o ON w.image_uri LIKE '%' || o.name
WHERE w.image_uri LIKE 'https://%'
ORDER BY w.created_at DESC;
