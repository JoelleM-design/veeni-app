-- Script simple pour supprimer toutes les données de Julien
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Supprimer l'utilisateur de auth.users
DELETE FROM auth.users WHERE email = 'nyc.jul@gmail.com';

-- 2. Vérifier que tout a été supprimé
SELECT 'auth.users' as table_name, COUNT(*) as count FROM auth.users WHERE email = 'nyc.jul@gmail.com'
UNION ALL
SELECT 'User' as table_name, COUNT(*) as count FROM "User" WHERE email = 'nyc.jul@gmail.com'; 