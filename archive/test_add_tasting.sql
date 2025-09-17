-- Script pour tester l'ajout d'une dégustation manuellement
-- Remplacez 'YOUR_USER_ID' et 'YOUR_WINE_ID' par les vrais IDs

-- 1. Vérifier les vins disponibles
SELECT id, name, year, wine_type 
FROM wine 
LIMIT 5;

-- 2. Vérifier les user_wine de l'utilisateur
SELECT uw.user_id, uw.wine_id, uw.amount, w.name, w.year
FROM user_wine uw
JOIN wine w ON uw.wine_id = w.id
WHERE uw.amount > 0
LIMIT 5;

-- 3. Ajouter une dégustation manuelle (remplacez les IDs)
-- INSERT INTO wine_history (
--   user_id,
--   wine_id,
--   event_type,
--   event_date,
--   notes,
--   rating
-- ) VALUES (
--   'YOUR_USER_ID',  -- Remplacez par votre user_id
--   'YOUR_WINE_ID',  -- Remplacez par un wine_id existant
--   'tasted',
--   NOW(),
--   'Test de dégustation manuelle',
--   4
-- );

-- 4. Vérifier que l'entrée a été ajoutée
-- SELECT * FROM wine_history WHERE event_type = 'tasted' ORDER BY created_at DESC LIMIT 5;

