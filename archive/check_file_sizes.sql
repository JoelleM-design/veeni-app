-- Script simple pour vérifier la taille des fichiers dans Storage
-- Exécuter dans Supabase SQL Editor

-- 1. Vérifier la taille des fichiers dans le bucket wines
SELECT 
    name,
    bucket_id,
    created_at,
    CASE 
        WHEN metadata->>'size' IS NOT NULL THEN (metadata->>'size')::bigint
        ELSE 0
    END as file_size_bytes
FROM storage.objects 
WHERE bucket_id = 'wines'
ORDER BY created_at DESC;

-- 2. Compter les fichiers par taille
SELECT 
    CASE 
        WHEN (metadata->>'size')::bigint = 0 THEN '0 bytes'
        WHEN (metadata->>'size')::bigint < 1000 THEN '< 1KB'
        WHEN (metadata->>'size')::bigint < 10000 THEN '< 10KB'
        ELSE 'Normal'
    END as size_category,
    COUNT(*) as count
FROM storage.objects 
WHERE bucket_id = 'wines'
GROUP BY 
    CASE 
        WHEN (metadata->>'size')::bigint = 0 THEN '0 bytes'
        WHEN (metadata->>'size')::bigint < 1000 THEN '< 1KB'
        WHEN (metadata->>'size')::bigint < 10000 THEN '< 10KB'
        ELSE 'Normal'
    END
ORDER BY count DESC;