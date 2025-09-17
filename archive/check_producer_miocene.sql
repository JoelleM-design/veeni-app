-- Script pour vérifier le producteur du vin Miocène
-- Exécuter dans Supabase SQL Editor

-- 1. Vérifier le producteur du vin Miocène
SELECT 
    'PRODUCTEUR MIOCÈNE' as section,
    p.id,
    p.name as producer_name,
    p.created_at
FROM producer p
WHERE p.id = '1c00126b-1544-4009-81a3-56f5449a8934';

-- 2. Voir tous les producteurs récents
SELECT 
    'PRODUCTEURS RÉCENTS' as section,
    id,
    name,
    created_at
FROM producer 
ORDER BY created_at DESC 
LIMIT 10;
