-- Script pour tester la configuration des images dans Supabase
-- Exécuter dans Supabase SQL Editor

-- 1. Vérifier que le bucket wines existe
SELECT 
    'BUCKET WINES' as test,
    id,
    name,
    public,
    created_at
FROM storage.buckets 
WHERE id = 'wines';

-- 2. Vérifier les politiques RLS pour storage.objects
SELECT 
    'POLITIQUES RLS' as test,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname;

-- 3. Vérifier les fichiers existants dans le bucket wines
SELECT 
    'FICHIERS WINES' as test,
    name,
    bucket_id,
    created_at
FROM storage.objects 
WHERE bucket_id = 'wines'
ORDER BY created_at DESC;

-- 4. Tester l'accès public au bucket
SELECT 
    'TEST ACCÈS PUBLIC' as test,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM storage.buckets 
            WHERE id = 'wines' AND public = true
        ) THEN 'Bucket wines est public ✅'
        ELSE 'Bucket wines n''est pas public ❌'
    END as status;
