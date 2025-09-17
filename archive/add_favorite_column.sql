-- Ajouter la colonne favorite à la table user_wine si elle n'existe pas
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_wine' 
        AND column_name = 'favorite'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE user_wine ADD COLUMN favorite BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Colonne favorite ajoutée à user_wine';
    ELSE
        RAISE NOTICE 'Colonne favorite existe déjà dans user_wine';
    END IF;
END $$;

-- Vérifier la structure après modification
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_wine' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Étape 3: Vérifier les données actuelles
SELECT 
    user_id,
    wine_id,
    favorite,
    created_at
FROM user_wine
ORDER BY created_at DESC; 