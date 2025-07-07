-- Script à exécuter dans l'éditeur SQL de Supabase pour supprimer l'utilisateur Julien

-- Supprimer l'utilisateur de auth.users (remplace l'email si besoin)
DELETE FROM auth.users WHERE email = 'nyc.jul@gmail.com';

-- Vérifier que l'utilisateur a été supprimé
SELECT id, email, created_at FROM auth.users WHERE email = 'nyc.jul@gmail.com';

-- Vérifier aussi dans la table User
SELECT id, email, first_name, created_at FROM "User" WHERE email = 'nyc.jul@gmail.com'; 