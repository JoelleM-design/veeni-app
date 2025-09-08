-- Script de nettoyage forcé pour la hiérarchie viticole
-- Supprime tout et recrée proprement

-- 1. Supprimer toutes les politiques RLS existantes
DROP POLICY IF EXISTS "Allow read access to wine_countries" ON wine_countries;
DROP POLICY IF EXISTS "Allow read access to wine_regions" ON wine_regions;
DROP POLICY IF EXISTS "Allow read access to wine_appellations" ON wine_appellations;
DROP POLICY IF EXISTS "Allow read access to wine_grape_varieties" ON wine_grape_varieties;
DROP POLICY IF EXISTS "Allow read access to wine_appellation_grapes" ON wine_appellation_grapes;

-- 2. Supprimer les tables si elles existent (dans l'ordre inverse des dépendances)
DROP TABLE IF EXISTS wine_appellation_grapes CASCADE;
DROP TABLE IF EXISTS wine_grape_varieties CASCADE;
DROP TABLE IF EXISTS wine_appellations CASCADE;
DROP TABLE IF EXISTS wine_regions CASCADE;
DROP TABLE IF EXISTS wine_countries CASCADE;

-- 3. Supprimer les fonctions si elles existent
DROP FUNCTION IF EXISTS get_regions_by_country(text);
DROP FUNCTION IF EXISTS get_appellations_by_region(text);
DROP FUNCTION IF EXISTS get_grapes_by_appellation(text);
DROP FUNCTION IF EXISTS get_wine_hierarchy(text, text, text);

-- 4. Vérifier le nettoyage
SELECT 'Nettoyage forcé terminé' as status;
