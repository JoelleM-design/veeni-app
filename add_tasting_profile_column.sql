-- Ajouter la colonne tasting_profile à la table user_wine
ALTER TABLE user_wine 
ADD COLUMN tasting_profile JSONB DEFAULT '{"acidity": 0, "power": 0, "sweetness": 0, "tannin": 0}'::jsonb;

-- Mettre à jour les enregistrements existants avec un profil par défaut
UPDATE user_wine 
SET tasting_profile = '{"acidity": 0, "power": 0, "sweetness": 0, "tannin": 0}'::jsonb 
WHERE tasting_profile IS NULL;

-- Vérifier que la colonne a été ajoutée
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_wine' 
ORDER BY ordinal_position;