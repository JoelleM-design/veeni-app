-- Script pour vérifier la structure exacte de la table wine
-- Exécuter dans Supabase SQL Editor

-- 1. Vérifier toutes les colonnes de la table wine
SELECT 
    'COLONNES TABLE WINE' as section,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'wine'
ORDER BY ordinal_position;

-- 2. Voir un exemple de vin pour comprendre la structure
SELECT 
    'EXEMPLE VIN' as section,
    *
FROM wine 
LIMIT 1;

-- 3. Chercher le vin Miocène avec toutes les colonnes disponibles
SELECT 
    'RECHERCHE MIOCÈNE' as section,
    *
FROM wine 
WHERE name ILIKE '%miocène%' OR name ILIKE '%miocene%' OR name ILIKE '%miocene%'
ORDER BY created_at DESC;
