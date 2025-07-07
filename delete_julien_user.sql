-- Supprimer l'utilisateur Julien de auth.users
-- Remplace 'email_de_julien@example.com' par l'email réel utilisé

-- D'abord, supprimer de la table User si elle existe
DELETE FROM public."User" 
WHERE email = 'email_de_julien@example.com';

-- Ensuite, supprimer de auth.users
DELETE FROM auth.users 
WHERE email = 'email_de_julien@example.com';

-- Vérifier que l'utilisateur a été supprimé
SELECT * FROM auth.users WHERE email = 'email_de_julien@example.com'; 