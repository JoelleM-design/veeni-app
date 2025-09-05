-- Script pour vérifier le contenu des fichiers dans Storage
-- Exécuter dans Supabase SQL Editor

-- 1. Vérifier les métadonnées des fichiers
SELECT 
    'MÉTADONNÉES FICHIERS' as section,
    name,
    bucket_id,
    created_at,
    updated_at,
    metadata
FROM storage.objects 
WHERE bucket_id = 'wines'
ORDER BY created_at DESC;

-- 2. Vérifier la taille des fichiers
SELECT 
    'TAILLE FICHIERS' as section,
    name,
    bucket_id,
    octet_length(encode(decode(encode(metadata->>'size', 'base64'), 'base64'), 'hex')) as file_size_bytes
FROM storage.objects 
WHERE bucket_id = 'wines'
ORDER BY created_at DESC;

-- 3. Vérifier les vins avec leurs URLs
SELECT 
    'VINS ET URLS' as section,
    w.id,
    w.name,
    w.image_uri,
    CASE 
        WHEN o.name IS NOT NULL THEN 'FICHIER EXISTE'
        ELSE 'FICHIER MANQUANT'
    END as file_status
FROM wine w
LEFT JOIN storage.objects o ON w.image_uri LIKE '%' || o.name
WHERE w.image_uri LIKE 'https://%'
ORDER BY w.created_at DESC;
