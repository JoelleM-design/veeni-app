-- Script complet pour nettoyer toutes les données liées à l'utilisateur Julien
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Récupérer l'ID de l'utilisateur Julien
DO $$
DECLARE
    julien_user_id uuid;
BEGIN
    -- Récupérer l'ID de l'utilisateur Julien
    SELECT id INTO julien_user_id FROM auth.users WHERE email = 'nyc.jul@gmail.com';
    
    IF julien_user_id IS NOT NULL THEN
        -- 2. Supprimer les vins de l'utilisateur
        DELETE FROM user_wine WHERE user_id = julien_user_id;
        
        -- 3. Supprimer les membreships household
        DELETE FROM user_household WHERE user_id = julien_user_id;
        
        -- 4. Supprimer les households orphelins (sans membres)
        DELETE FROM households WHERE id NOT IN (
            SELECT DISTINCT household_id FROM user_household
        );
        
        -- 5. Supprimer les logs OCR
        DELETE FROM ocr_logs WHERE user_id = julien_user_id;
        
        -- 6. Supprimer les amis (friend)
        DELETE FROM friend WHERE user_id = julien_user_id OR friend_id = julien_user_id;
        
        -- 7. Supprimer l'utilisateur de la table User
        DELETE FROM "User" WHERE id = julien_user_id;
        
        -- 8. Supprimer l'utilisateur de auth.users
        DELETE FROM auth.users WHERE id = julien_user_id;
        
        RAISE NOTICE 'Utilisateur Julien et toutes ses données supprimées avec succès';
    ELSE
        RAISE NOTICE 'Utilisateur Julien non trouvé';
    END IF;
END $$;

-- Vérification : s'assurer que tout a été supprimé
SELECT 'auth.users' as table_name, COUNT(*) as count FROM auth.users WHERE email = 'nyc.jul@gmail.com'
UNION ALL
SELECT 'User' as table_name, COUNT(*) as count FROM "User" WHERE email = 'nyc.jul@gmail.com'
UNION ALL
SELECT 'user_wine' as table_name, COUNT(*) as count FROM user_wine uw 
JOIN auth.users u ON uw.user_id = u.id WHERE u.email = 'nyc.jul@gmail.com'
UNION ALL
SELECT 'user_household' as table_name, COUNT(*) as count FROM user_household uh 
JOIN auth.users u ON uh.user_id = u.id WHERE u.email = 'nyc.jul@gmail.com'; 