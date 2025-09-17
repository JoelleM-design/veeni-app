-- Configuration de Supabase Storage pour les avatars
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Créer un bucket pour les avatars (si pas déjà fait)
-- Note: Cette commande doit être exécutée dans l'interface Storage de Supabase
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- 2. Politique RLS pour permettre l'upload d'avatars
CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Politique RLS pour permettre la lecture des avatars
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- 4. Politique RLS pour permettre la mise à jour d'avatars
CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Politique RLS pour permettre la suppression d'avatars
CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

-- 6. Vérifier les politiques existantes
SELECT 
    'POLITIQUES STORAGE' as section,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'; 