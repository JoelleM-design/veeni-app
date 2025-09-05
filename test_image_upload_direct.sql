-- Script pour tester l'upload direct d'une image
-- Exécuter dans Supabase SQL Editor

-- 1. Créer un vin de test avec une image publique
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
    'Test Image Public',
    '2023',
    'red',
    'Test',
    'https://picsum.photos/300/400?random=1',
    NOW()
) RETURNING id, name, image_uri;

-- 2. Vérifier que le vin a été créé
SELECT 
    'VIN DE TEST CRÉÉ' as test,
    id,
    name,
    image_uri
FROM wine 
WHERE name = 'Test Image Public'
ORDER BY created_at DESC
LIMIT 1;
