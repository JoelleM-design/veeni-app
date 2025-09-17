-- Script pour vérifier le producteur du vin Miocène
-- Exécuter dans Supabase SQL Editor

-- 1. Vérifier le producteur du vin Miocène
SELECT 
    'PRODUCTEUR MIOCÈNE' as section,
    p.id,
    p.name
FROM producer p
WHERE p.id = '1c00126b-1544-4009-81a3-56f5449a8934';

-- 2. Vérifier si le producteur existe
SELECT 
    'PRODUCTEUR EXISTE' as section,
    CASE 
        WHEN EXISTS (SELECT 1 FROM producer WHERE id = '1c00126b-1544-4009-81a3-56f5449a8934') 
        THEN 'OUI' 
        ELSE 'NON' 
    END as exists;

-- 3. Voir tous les producteurs qui contiennent "Suveroy"
SELECT 
    'RECHERCHE SUVEROY' as section,
    id,
    name
FROM producer 
WHERE name ILIKE '%suveroy%' OR name ILIKE '%suveroy%';
