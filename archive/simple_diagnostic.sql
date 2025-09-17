-- Diagnostic simple de la configuration Supabase
-- Exécuter dans Supabase SQL Editor

-- 1. Vérifier si les tables existent
SELECT 'wine' as table_name, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wine' AND table_schema = 'public') 
            THEN 'EXISTE' ELSE 'MANQUANTE' END as status
UNION ALL
SELECT 'user_wine' as table_name, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_wine' AND table_schema = 'public') 
            THEN 'EXISTE' ELSE 'MANQUANTE' END as status
UNION ALL
SELECT 'users' as table_name, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') 
            THEN 'EXISTE' ELSE 'MANQUANTE' END as status;

-- 2. Vérifier le bucket wines
SELECT 'wines' as bucket_name,
       CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'wines') 
            THEN 'EXISTE' ELSE 'MANQUANT' END as status;

-- 3. Vérifier les colonnes de wine
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'wine' AND table_schema = 'public'
ORDER BY ordinal_position;
