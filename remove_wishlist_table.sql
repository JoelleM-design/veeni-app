-- 1. Sauvegarder la table wishlist (export CSV dans Supabase avant d'exécuter ce script)
-- 2. Supprimer la table wishlist
DROP TABLE IF EXISTS wishlist;

-- 3. Vérifier que la table n'existe plus
SELECT table_name FROM information_schema.tables WHERE table_name = 'wishlist'; 