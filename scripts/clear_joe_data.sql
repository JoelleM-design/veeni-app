-- Script SQL pour supprimer toutes les données de Joe
-- À exécuter directement dans l'éditeur SQL de Supabase

-- 1. D'abord, identifier l'ID de Joe
-- (Remplacez 'joe@example.com' par l'email réel de Joe)
DO $$
DECLARE
    joe_id UUID;
    user_wine_count INTEGER;
    wine_history_count INTEGER;
    memories_count INTEGER;
    likes_count INTEGER;
BEGIN
    -- Trouver l'ID de Joe par email
    SELECT id INTO joe_id 
    FROM "User" 
    WHERE email ILIKE '%joe%'
    LIMIT 1;
    
    IF joe_id IS NULL THEN
        RAISE NOTICE 'Aucun utilisateur Joe trouvé';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Joe trouvé avec ID: %', joe_id;
    
    -- Compter les données existantes
    SELECT COUNT(*) INTO user_wine_count FROM user_wine WHERE user_id = joe_id;
    SELECT COUNT(*) INTO wine_history_count FROM wine_history WHERE user_id = joe_id;
    SELECT COUNT(*) INTO memories_count FROM wine_memories WHERE user_id = joe_id;
    SELECT COUNT(*) INTO likes_count FROM wine_memory_likes WHERE user_id = joe_id;
    
    RAISE NOTICE 'Données trouvées:';
    RAISE NOTICE '  - Vins dans la cave: %', user_wine_count;
    RAISE NOTICE '  - Historique de dégustation: %', wine_history_count;
    RAISE NOTICE '  - Souvenirs: %', memories_count;
    RAISE NOTICE '  - Likes de souvenirs: %', likes_count;
    
    -- Supprimer dans l'ordre pour éviter les problèmes de clés étrangères
    
    -- 1. Supprimer les likes de souvenirs
    IF likes_count > 0 THEN
        DELETE FROM wine_memory_likes WHERE user_id = joe_id;
        RAISE NOTICE 'Likes de souvenirs supprimés';
    END IF;
    
    -- 2. Supprimer les souvenirs
    IF memories_count > 0 THEN
        DELETE FROM wine_memories WHERE user_id = joe_id;
        RAISE NOTICE 'Souvenirs supprimés';
    END IF;
    
    -- 3. Supprimer l'historique de dégustation
    IF wine_history_count > 0 THEN
        DELETE FROM wine_history WHERE user_id = joe_id;
        RAISE NOTICE 'Historique de dégustation supprimé';
    END IF;
    
    -- 4. Supprimer les vins de la cave
    IF user_wine_count > 0 THEN
        DELETE FROM user_wine WHERE user_id = joe_id;
        RAISE NOTICE 'Vins de la cave supprimés';
    END IF;
    
    -- Vérification finale
    SELECT COUNT(*) INTO user_wine_count FROM user_wine WHERE user_id = joe_id;
    SELECT COUNT(*) INTO wine_history_count FROM wine_history WHERE user_id = joe_id;
    SELECT COUNT(*) INTO memories_count FROM wine_memories WHERE user_id = joe_id;
    SELECT COUNT(*) INTO likes_count FROM wine_memory_likes WHERE user_id = joe_id;
    
    RAISE NOTICE 'Vérification finale:';
    RAISE NOTICE '  - Vins dans la cave: %', user_wine_count;
    RAISE NOTICE '  - Historique de dégustation: %', wine_history_count;
    RAISE NOTICE '  - Souvenirs: %', memories_count;
    RAISE NOTICE '  - Likes de souvenirs: %', likes_count;
    
    IF user_wine_count = 0 AND wine_history_count = 0 AND memories_count = 0 AND likes_count = 0 THEN
        RAISE NOTICE 'Nettoyage terminé avec succès ! Joe n''a plus aucune donnée.';
    ELSE
        RAISE NOTICE 'Il reste encore des données pour Joe';
    END IF;
    
END $$;
