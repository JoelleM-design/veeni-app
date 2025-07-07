-- Script COMPLET pour supprimer TOUTES les données de Julien
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
        
        -- 6. Supprimer les relations d'amitié
        DELETE FROM friend WHERE user_id = julien_user_id OR friend_id = julien_user_id;
        
        -- 7. Supprimer l'utilisateur de la table User
        DELETE FROM "User" WHERE id = julien_user_id;
        
        -- 8. Supprimer l'utilisateur de auth.users
        DELETE FROM auth.users WHERE id = julien_user_id;
        
        RAISE NOTICE 'Utilisateur Julien et toutes ses données supprimés avec succès';
    ELSE
        RAISE NOTICE 'Utilisateur Julien non trouvé';
    END IF;
END $$;

-- Vérification finale
SELECT 
    'Vérification finale' as check_type,
    (SELECT COUNT(*) FROM auth.users WHERE email = 'nyc.jul@gmail.com') as auth_users_count,
    (SELECT COUNT(*) FROM "User" WHERE email = 'nyc.jul@gmail.com') as user_table_count,
    (SELECT COUNT(*) FROM user_wine WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'nyc.jul@gmail.com')) as user_wine_count,
    (SELECT COUNT(*) FROM user_household WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'nyc.jul@gmail.com')) as user_household_count; 