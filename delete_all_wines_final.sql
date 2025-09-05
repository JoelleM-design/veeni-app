-- Script pour supprimer TOUS les vins de la base de données
-- À exécuter dans Supabase SQL Editor

-- 1. Supprimer toutes les entrées de user_wine
DELETE FROM user_wine;

-- 2. Supprimer tous les vins de la table wine
DELETE FROM wine;

-- 3. Supprimer tous les fichiers du bucket wines
DELETE FROM storage.objects WHERE bucket_id = 'wines';

-- 4. Vérifier que tout est supprimé
SELECT 
    'RÉSULTAT FINAL' as section,
    'Tous les vins et fichiers supprimés' as message;

-- 5. Compter les entrées restantes (devrait être 0)
SELECT 
    'COMPTEUR USER_WINE' as section,
    COUNT(*) as count
FROM user_wine;

SELECT 
    'COMPTEUR WINE' as section,
    COUNT(*) as count
FROM wine;

SELECT 
    'COMPTEUR STORAGE WINES' as section,
    COUNT(*) as count
FROM storage.objects 
WHERE bucket_id = 'wines';
