-- Script pour trouver le producteur Suveroy
-- Exécuter dans Supabase SQL Editor

-- 1. Vérifier le producteur du vin Miocène
SELECT 
    'PRODUCTEUR MIOCÈNE' as section,
    p.id,
    p.name
FROM producer p
WHERE p.id = '1c00126b-1544-4009-81a3-56f5449a8934';

-- 2. Chercher tous les producteurs contenant "suveroy"
SELECT 
    'RECHERCHE SUVEROY' as section,
    id,
    name
FROM producer 
WHERE name ILIKE '%suveroy%';

-- 3. Chercher tous les producteurs contenant "suveroy" (variantes)
SELECT 
    'RECHERCHE SUVEROY VARIANTS' as section,
    id,
    name
FROM producer 
WHERE name ILIKE '%suveroy%' 
   OR name ILIKE '%suveroy%' 
   OR name ILIKE '%suveroy%'
   OR name ILIKE '%suveroy%';

-- 4. Voir tous les producteurs récents pour trouver des noms similaires
SELECT 
    'PRODUCTEURS RÉCENTS' as section,
    id,
    name
FROM producer 
ORDER BY id DESC 
LIMIT 20;
