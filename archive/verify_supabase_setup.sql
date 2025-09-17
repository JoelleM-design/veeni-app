-- Script pour vérifier la configuration complète de Supabase
-- Exécuter dans Supabase SQL Editor

-- 1. Vérifier les tables principales
SELECT 
    'TABLES PRINCIPALES' as section,
    table_name,
    'Existe' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('wine', 'user_wine', 'users')
ORDER BY table_name;

-- 2. Vérifier le bucket wines
SELECT 
    'BUCKET WINES' as section,
    CASE 
        WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'wines') 
        THEN 'Bucket wines existe ✅'
        ELSE 'Bucket wines n''existe pas ❌'
    END as status;

-- 3. Vérifier que le bucket est public
SELECT 
    'BUCKET PUBLIC' as section,
    CASE 
        WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'wines' AND public = true) 
        THEN 'Bucket wines est public ✅'
        ELSE 'Bucket wines n''est pas public ❌'
    END as status;

-- 4. Vérifier les politiques RLS pour storage.objects
SELECT 
    'POLITIQUES STORAGE' as section,
    COUNT(*) as nombre_politiques
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage';

-- 5. Vérifier les colonnes de la table wine
SELECT 
    'COLONNES WINE' as section,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'wine' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Vérifier les colonnes de la table user_wine
SELECT 
    'COLONNES USER_WINE' as section,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_wine' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
