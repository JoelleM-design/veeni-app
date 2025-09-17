-- Ajouter les colonnes manquantes à la table wine
ALTER TABLE wine 
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS price_range text;

-- Vérifier que les colonnes ont été ajoutées
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'wine' 
AND column_name IN ('country', 'price_range', 'region', 'year')
ORDER BY column_name;
