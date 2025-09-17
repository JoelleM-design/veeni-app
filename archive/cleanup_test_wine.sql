-- Script pour supprimer le vin de test
-- Exécuter dans Supabase SQL Editor

-- 1. Supprimer le vin de test
DELETE FROM wine 
WHERE name = 'Vin de test';

-- 2. Vérifier que le vin de test a été supprimé
SELECT 
    'VIN DE TEST SUPPRIMÉ' as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM wine WHERE name = 'Vin de test') 
        THEN 'ERREUR: Vin de test encore présent'
        ELSE 'SUCCÈS: Vin de test supprimé'
    END as result;

-- 3. Vérifier que la base est vide
SELECT 
    'BASE VIDE' as status,
    COUNT(*) as nombre_vins
FROM wine;
