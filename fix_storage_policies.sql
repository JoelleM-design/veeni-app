-- Script pour corriger les politiques de Storage
-- Exécuter dans Supabase SQL Editor

-- 1. Vérifier les politiques actuelles
SELECT 
    'POLITIQUES ACTUELLES' as section,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname;

-- 2. Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Allow public read access to all files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete files" ON storage.objects;

-- 3. Créer des politiques PERMISSIVES pour le bucket wines
-- Politique pour LIRE tous les fichiers du bucket wines (PUBLIC)
CREATE POLICY "Allow public read access to wines bucket" ON storage.objects
FOR SELECT USING (bucket_id = 'wines');

-- Politique pour INSÉRER des fichiers dans le bucket wines
CREATE POLICY "Allow authenticated users to upload to wines bucket" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'wines' AND auth.role() = 'authenticated');

-- Politique pour METTRE À JOUR des fichiers dans le bucket wines
CREATE POLICY "Allow authenticated users to update wines bucket files" ON storage.objects
FOR UPDATE USING (bucket_id = 'wines' AND auth.role() = 'authenticated');

-- Politique pour SUPPRIMER des fichiers du bucket wines
CREATE POLICY "Allow authenticated users to delete wines bucket files" ON storage.objects
FOR DELETE USING (bucket_id = 'wines' AND auth.role() = 'authenticated');

-- 4. Vérifier les nouvelles politiques
SELECT 
    'NOUVELLES POLITIQUES' as section,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname;
