-- Script pour vérifier la structure de la table wine et les données
-- Exécuter dans Supabase SQL Editor

-- 1. Vérifier la structure de la table wine
SELECT 
    'STRUCTURE TABLE WINE' as section,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'wine'
ORDER BY ordinal_position;

-- 2. Chercher le vin Miocène avec les bonnes colonnes
SELECT 
    'VIN MIOCÈNE TROUVÉ' as section,
    id,
    name,
    producer,
    year,
    region,
    wine_type,
    grapes,
    image_uri,
    created_at,
    updated_at
FROM wine 
WHERE name ILIKE '%miocène%' OR name ILIKE '%miocene%' OR name ILIKE '%miocene%'
ORDER BY updated_at DESC;

-- 3. Compter tous les vins récents
SELECT 
    'VINS RÉCENTS' as section,
    COUNT(*) as count
FROM wine 
WHERE updated_at > NOW() - INTERVAL '1 hour';
