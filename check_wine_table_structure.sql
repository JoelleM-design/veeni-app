-- Vérifier la structure de la table wine
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'wine' 
AND column_name IN ('country', 'price_range', 'region', 'year')
ORDER BY column_name;
