-- Script pour forcer l'amitié entre Julien et Joëlle
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Récupérer les IDs des utilisateurs
DO $$
DECLARE
    julien_id uuid;
    joelle_id uuid;
BEGIN
    -- Récupérer l'ID de Julien
    SELECT id INTO julien_id FROM "User" WHERE email = 'nyc.jul@gmail.com';
    
    -- Récupérer l'ID de Joëlle
    SELECT id INTO joelle_id FROM "User" WHERE email = 'wspt.joelle@gmail.com';
    
    -- Vérifier que les deux utilisateurs existent
    IF julien_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur Julien non trouvé';
    END IF;
    
    IF joelle_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur Joëlle non trouvé';
    END IF;
    
    -- 2. Insérer les relations d'amitié (bidirectionnelles)
    -- Julien -> Joëlle
    INSERT INTO friend (user_id, friend_id, status, created_at)
    VALUES (julien_id, joelle_id, 'accepted', NOW())
    ON CONFLICT (user_id, friend_id) DO NOTHING;
    
    -- Joëlle -> Julien
    INSERT INTO friend (user_id, friend_id, status, created_at)
    VALUES (joelle_id, julien_id, 'accepted', NOW())
    ON CONFLICT (user_id, friend_id) DO NOTHING;
    
    RAISE NOTICE 'Amitié créée entre Julien (%) et Joëlle (%)', julien_id, joelle_id;
END $$;

-- 3. Vérifier que l'amitié a été créée
SELECT 
    f.user_id,
    u1.first_name as user_name,
    f.friend_id,
    u2.first_name as friend_name,
    f.status,
    f.created_at
FROM friend f
JOIN "User" u1 ON f.user_id = u1.id
JOIN "User" u2 ON f.friend_id = u2.id
WHERE (u1.email = 'nyc.jul@gmail.com' AND u2.email = 'wspt.joelle@gmail.com')
   OR (u1.email = 'wspt.joelle@gmail.com' AND u2.email = 'nyc.jul@gmail.com')
ORDER BY f.created_at DESC; 