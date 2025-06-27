-- Script pour ajouter la colonne origin à la table user_wine
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Ajouter la colonne origin à la table user_wine
ALTER TABLE user_wine 
ADD COLUMN IF NOT EXISTS origin VARCHAR(20) DEFAULT 'cellar' 
CHECK (origin IN ('cellar', 'wishlist'));

-- 2. Mettre à jour les données existantes
-- Les vins avec amount > 0 sont en cave, les autres en wishlist
UPDATE user_wine 
SET origin = CASE 
  WHEN amount > 0 THEN 'cellar' 
  ELSE 'wishlist' 
END 
WHERE origin IS NULL OR origin = 'cellar';

-- 3. Vérifier la structure mise à jour
SELECT 
  'Structure user_wine mise à jour' as check_type,
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_wine' 
ORDER BY ordinal_position;

-- 4. Vérifier les données
SELECT 
  'Données user_wine' as check_type,
  user_id,
  wine_id,
  amount,
  origin,
  created_at
FROM user_wine 
ORDER BY created_at DESC; 