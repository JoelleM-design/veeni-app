-- Script pour lister tous les utilisateurs
-- À exécuter dans l'éditeur SQL de Supabase

SELECT 
    id,
    first_name,
    email,
    created_at
FROM "User"
ORDER BY created_at DESC; 