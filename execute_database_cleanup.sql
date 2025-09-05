-- Script pour nettoyer complètement la base de données des champs favorite et liked
-- À exécuter dans Supabase SQL Editor

-- Étape 1: Vérifier l'état actuel de la table user_wine
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_wine'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Étape 2: Supprimer les colonnes favorite et liked si elles existent
ALTER TABLE user_wine DROP COLUMN IF EXISTS favorite;
ALTER TABLE user_wine DROP COLUMN IF EXISTS liked;

-- Étape 3: Vérifier que les colonnes ont été supprimées
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_wine'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Étape 4: Vérifier les données actuelles
SELECT
    user_id,
    wine_id,
    origin,
    amount,
    rating,
    created_at
FROM user_wine
LIMIT 10;

-- Étape 5: Vérifier les politiques RLS
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_wine'
AND schemaname = 'public'; 