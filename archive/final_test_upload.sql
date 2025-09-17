-- Test final pour confirmer que l'upload d'images fonctionne
-- Exécuter dans Supabase SQL Editor

-- 1. Vérifier que le bucket wines existe et est public
SELECT 
    'BUCKET WINES' as test,
    id,
    name,
    public,
    created_at
FROM storage.buckets 
WHERE id = 'wines';

-- 2. Vérifier les politiques RLS pour le storage
SELECT 
    'POLITIQUES RLS' as test,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname;

-- 3. Vérifier la structure de la table wine
SELECT 
    'COLONNE IMAGE_URI' as test,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'wine' 
  AND table_schema = 'public'
  AND column_name = 'image_uri';

-- 4. Tester l'insertion d'un vin de test avec image
INSERT INTO wine (
    id,
    name,
    year,
    wine_type,
    region,
    image_uri,
    created_at
) VALUES (
    gen_random_uuid(),
    'Vin de test',
    '2023',
    'red',
    'Bordeaux',
    'https://example.com/test-image.jpg',
    NOW()
) RETURNING id, name, image_uri;

-- 5. Vérifier que le vin de test a été créé
SELECT 
    'VIN DE TEST CRÉÉ' as test,
    id,
    name,
    image_uri
FROM wine 
WHERE name = 'Vin de test'
ORDER BY created_at DESC
LIMIT 1;
