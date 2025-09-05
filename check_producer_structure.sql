-- Script pour vérifier la structure de la table producer
-- Exécuter dans Supabase SQL Editor

-- 1. Vérifier la structure de la table producer
SELECT 
    'STRUCTURE TABLE PRODUCER' as section,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'producer'
ORDER BY ordinal_position;

-- 2. Vérifier le producteur du vin Miocène
SELECT 
    'PRODUCTEUR MIOCÈNE' as section,
    p.*
FROM producer p
WHERE p.id = '1c00126b-1544-4009-81a3-56f5449a8934';

-- 3. Voir tous les producteurs récents
SELECT 
    'PRODUCTEURS RÉCENTS' as section,
    *
FROM producer 
ORDER BY id DESC 
LIMIT 10;
re