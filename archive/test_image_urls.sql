-- Script pour tester les URLs d'images
-- Exécuter dans Supabase SQL Editor

-- 1. Récupérer les URLs d'images des vins
SELECT 
    'URLS À TESTER' as section,
    id,
    name,
    image_uri
FROM wine 
WHERE image_uri LIKE 'https://%'
ORDER BY created_at DESC;

-- 2. Vérifier que les fichiers existent dans Storage
SELECT 
    'FICHIERS CORRESPONDANTS' as section,
    o.name as file_name,
    o.bucket_id,
    o.created_at
FROM storage.objects o
WHERE o.bucket_id = 'wines'
ORDER BY o.created_at DESC;
