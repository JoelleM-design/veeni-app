-- Vérifier que le type de vin est bien enregistré dans Supabase
-- et que les couleurs correspondent aux icônes

SELECT 
    w.id,
    w.name,
    w.wine_type,
    w.created_at,
    w.updated_at
FROM wine w
WHERE w.wine_type IS NOT NULL
ORDER BY w.updated_at DESC
LIMIT 10;
