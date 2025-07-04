-- Script pour supprimer tous les vins de test avec des noms étranges
-- Basé sur la structure exacte des tables identifiée

-- 1. Supprimer les entrées dans user_wine pour les vins avec des noms problématiques
DELETE FROM user_wine 
WHERE wine_id IN (
    SELECT id FROM wine 
    WHERE name ILIKE '%SERVICE%' 
       OR name ILIKE '%CARAFAGE%' 
       OR name ILIKE '%ADEGUSTER%'
       OR name ILIKE '%ACCORD%'
       OR name ILIKE '%PARFAIT%'
       OR name ILIKE '%COTE FOURCHETTE%'
       OR name ILIKE '%DET VIANDES%'
       OR name ILIKE '%10MAINE%'
       OR name ILIKE '%ARICA%'
       OR name ILIKE '%ILE DE RE%'
       OR name ILIKE '%SALINES%'
       OR name ILIKE '%gnes.%'
       OR name ILIKE '%DOMNE%'
       OR name ILIKE '%APPELLATION D%ORIGINE%'
       OR name ILIKE '%CUVEE PRESTIGE%'
       OR name ILIKE '%FAMILLE BELLANGER%'
       OR name ILIKE '%CHÂTEAU ROQUEFORT%'
       OR name ILIKE '%DOMINIO DE PUNCTUM%'
       OR name ILIKE '%COTES DU RHÔNE%'
);

-- 2. Supprimer les vins eux-mêmes avec des noms problématiques
DELETE FROM wine 
WHERE name ILIKE '%SERVICE%' 
   OR name ILIKE '%CARAFAGE%' 
   OR name ILIKE '%ADEGUSTER%'
   OR name ILIKE '%ACCORD%'
   OR name ILIKE '%PARFAIT%'
   OR name ILIKE '%COTE FOURCHETTE%'
   OR name ILIKE '%DET VIANDES%'
   OR name ILIKE '%10MAINE%'
   OR name ILIKE '%ARICA%'
   OR name ILIKE '%ILE DE RE%'
   OR name ILIKE '%SALINES%'
   OR name ILIKE '%gnes.%'
   OR name ILIKE '%DOMNE%'
   OR name ILIKE '%APPELLATION D%ORIGINE%'
   OR name ILIKE '%CUVEE PRESTIGE%'
   OR name ILIKE '%FAMILLE BELLANGER%'
   OR name ILIKE '%CHÂTEAU ROQUEFORT%'
   OR name ILIKE '%DOMINIO DE PUNCTUM%'
   OR name ILIKE '%COTES DU RHÔNE%';

-- 3. Vérifier le résultat (optionnel)
SELECT 
    'Vins restants dans wine' as check_type,
    COUNT(*) as count
FROM wine;

SELECT 
    'Entrées restantes dans user_wine' as check_type,
    COUNT(*) as count
FROM user_wine; 