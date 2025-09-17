-- Script pour configurer tous les buckets de stockage
-- À exécuter dans l'interface SQL de Supabase

-- 1. Créer le bucket wines s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, created_at, updated_at)
VALUES ('wines', 'wines', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Vérifier tous les buckets disponibles
SELECT 
  'BUCKETS DISPONIBLES' as section,
  id,
  name,
  public,
  created_at
FROM storage.buckets
ORDER BY name;

-- 3. Supprimer toutes les anciennes politiques RLS
DROP POLICY IF EXISTS "Allow public read access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own avatars" ON storage.objects;

-- 4. Créer des politiques RLS PERMISSIVES pour tous les buckets
-- Politique pour LIRE tous les fichiers (public)
CREATE POLICY "Allow public read access to all files" ON storage.objects
FOR SELECT USING (true);

-- Politique pour INSÉRER des fichiers (utilisateurs authentifiés)
CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Politique pour METTRE À JOUR des fichiers (utilisateurs authentifiés)
CREATE POLICY "Allow authenticated users to update files" ON storage.objects
FOR UPDATE USING (auth.role() = 'authenticated');

-- Politique pour SUPPRIMER des fichiers (utilisateurs authentifiés)
CREATE POLICY "Allow authenticated users to delete files" ON storage.objects
FOR DELETE USING (auth.role() = 'authenticated');

-- 5. Nettoyer tous les fichiers existants (nettoyage complet)
DELETE FROM storage.objects 
WHERE bucket_id IN ('avatars', 'wines');

-- 6. Vérifier l'état final
SELECT 
  'ÉTAT FINAL' as section,
  'Buckets configurés et fichiers nettoyés' as message; 