-- Script pour vérifier les données du vin Miocène dans Supabase
-- Exécuter dans Supabase SQL Editor

-- 1. Vérifier les données du vin Miocène
SELECT 
    'DONNÉES VIN MIOCÈNE' as section,
    id,
    name,
    producer as domaine,
    year as vintage,
    region,
    wine_type as color,
    grapes,
    image_uri,
    created_at,
    updated_at
FROM wine 
WHERE name ILIKE '%miocène%' OR name ILIKE '%miocene%'
ORDER BY updated_at DESC;

-- 2. Vérifier les entrées user_wine pour ce vin
SELECT 
    'ENTRÉES USER_WINE' as section,
    uw.user_id,
    uw.wine_id,
    uw.amount,
    uw.origin,
    uw.personal_comment,
    uw.rating,
    uw.created_at,
    uw.updated_at,
    w.name as wine_name
FROM user_wine uw
JOIN wine w ON uw.wine_id = w.id
WHERE w.name ILIKE '%miocène%' OR w.name ILIKE '%miocene%';

-- 3. Compter les vins avec des données récentes
SELECT 
    'COMPTEUR VINS RÉCENTS' as section,
    COUNT(*) as count
FROM wine 
WHERE updated_at > NOW() - INTERVAL '1 hour';
