-- Script pour créer le bucket wines et configurer les politiques RLS
-- À exécuter dans l'interface SQL de Supabase

-- 1. Créer le bucket wines s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, created_at, updated_at)
VALUES ('wines', 'wines', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Vérifier que le bucket a été créé
SELECT 
  'BUCKET WINES' as section,
  id,
  name,
  public,
  created_at
FROM storage.buckets
WHERE id = 'wines';

-- 3. Supprimer les anciennes politiques pour wines (si elles existent)
DROP POLICY IF EXISTS "Allow public read access to wine images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload wine images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update wine images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete wine images" ON storage.objects;

-- 4. Créer les nouvelles politiques RLS pour le bucket wines
-- Politique pour LIRE tous les fichiers (public)
CREATE POLICY "Allow public read access to wine images" ON storage.objects
FOR SELECT USING (bucket_id = 'wines');

-- Politique pour INSÉRER des fichiers (utilisateurs authentifiés)
CREATE POLICY "Allow authenticated users to upload wine images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'wines' AND auth.role() = 'authenticated');

-- Politique pour METTRE À JOUR des fichiers (utilisateurs authentifiés)
CREATE POLICY "Allow authenticated users to update wine images" ON storage.objects
FOR UPDATE USING (bucket_id = 'wines' AND auth.role() = 'authenticated');

-- Politique pour SUPPRIMER des fichiers (utilisateurs authentifiés)
CREATE POLICY "Allow authenticated users to delete wine images" ON storage.objects
FOR DELETE USING (bucket_id = 'wines' AND auth.role() = 'authenticated');

-- 5. Vérifier l'état final
SELECT 
  'ÉTAT FINAL' as section,
  'Bucket wines créé et politiques configurées' as message;
