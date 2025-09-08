-- Script de correction des politiques RLS pour la hiérarchie viticole
-- Supprime les politiques existantes avant de les recréer

-- 1. Supprimer les politiques existantes (si elles existent)
DO $$
BEGIN
    -- Supprimer les politiques pour wine_countries
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wine_countries') THEN
        DROP POLICY IF EXISTS "Allow read access to wine_countries" ON wine_countries;
        DROP POLICY IF EXISTS "Allow insert access to wine_countries" ON wine_countries;
        DROP POLICY IF EXISTS "Allow update access to wine_countries" ON wine_countries;
        DROP POLICY IF EXISTS "Allow delete access to wine_countries" ON wine_countries;
    END IF;
    
    -- Supprimer les politiques pour wine_regions
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wine_regions') THEN
        DROP POLICY IF EXISTS "Allow read access to wine_regions" ON wine_regions;
        DROP POLICY IF EXISTS "Allow insert access to wine_regions" ON wine_regions;
        DROP POLICY IF EXISTS "Allow update access to wine_regions" ON wine_regions;
        DROP POLICY IF EXISTS "Allow delete access to wine_regions" ON wine_regions;
    END IF;
    
    -- Supprimer les politiques pour wine_appellations
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wine_appellations') THEN
        DROP POLICY IF EXISTS "Allow read access to wine_appellations" ON wine_appellations;
        DROP POLICY IF EXISTS "Allow insert access to wine_appellations" ON wine_appellations;
        DROP POLICY IF EXISTS "Allow update access to wine_appellations" ON wine_appellations;
        DROP POLICY IF EXISTS "Allow delete access to wine_appellations" ON wine_appellations;
    END IF;
    
    -- Supprimer les politiques pour wine_grape_varieties
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wine_grape_varieties') THEN
        DROP POLICY IF EXISTS "Allow read access to wine_grape_varieties" ON wine_grape_varieties;
        DROP POLICY IF EXISTS "Allow insert access to wine_grape_varieties" ON wine_grape_varieties;
        DROP POLICY IF EXISTS "Allow update access to wine_grape_varieties" ON wine_grape_varieties;
        DROP POLICY IF EXISTS "Allow delete access to wine_grape_varieties" ON wine_grape_varieties;
    END IF;
    
    -- Supprimer les politiques pour wine_appellation_grapes
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wine_appellation_grapes') THEN
        DROP POLICY IF EXISTS "Allow read access to wine_appellation_grapes" ON wine_appellation_grapes;
        DROP POLICY IF EXISTS "Allow insert access to wine_appellation_grapes" ON wine_appellation_grapes;
        DROP POLICY IF EXISTS "Allow update access to wine_appellation_grapes" ON wine_appellation_grapes;
        DROP POLICY IF EXISTS "Allow delete access to wine_appellation_grapes" ON wine_appellation_grapes;
    END IF;
END $$;

-- 2. Recréer les politiques RLS
-- Politiques pour wine_countries
CREATE POLICY "Allow read access to wine_countries" ON wine_countries FOR SELECT USING (true);
CREATE POLICY "Allow insert access to wine_countries" ON wine_countries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access to wine_countries" ON wine_countries FOR UPDATE USING (true);
CREATE POLICY "Allow delete access to wine_countries" ON wine_countries FOR DELETE USING (true);

-- Politiques pour wine_regions
CREATE POLICY "Allow read access to wine_regions" ON wine_regions FOR SELECT USING (true);
CREATE POLICY "Allow insert access to wine_regions" ON wine_regions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access to wine_regions" ON wine_regions FOR UPDATE USING (true);
CREATE POLICY "Allow delete access to wine_regions" ON wine_regions FOR DELETE USING (true);

-- Politiques pour wine_appellations
CREATE POLICY "Allow read access to wine_appellations" ON wine_appellations FOR SELECT USING (true);
CREATE POLICY "Allow insert access to wine_appellations" ON wine_appellations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access to wine_appellations" ON wine_appellations FOR UPDATE USING (true);
CREATE POLICY "Allow delete access to wine_appellations" ON wine_appellations FOR DELETE USING (true);

-- Politiques pour wine_grape_varieties
CREATE POLICY "Allow read access to wine_grape_varieties" ON wine_grape_varieties FOR SELECT USING (true);
CREATE POLICY "Allow insert access to wine_grape_varieties" ON wine_grape_varieties FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access to wine_grape_varieties" ON wine_grape_varieties FOR UPDATE USING (true);
CREATE POLICY "Allow delete access to wine_grape_varieties" ON wine_grape_varieties FOR DELETE USING (true);

-- Politiques pour wine_appellation_grapes
CREATE POLICY "Allow read access to wine_appellation_grapes" ON wine_appellation_grapes FOR SELECT USING (true);
CREATE POLICY "Allow insert access to wine_appellation_grapes" ON wine_appellation_grapes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access to wine_appellation_grapes" ON wine_appellation_grapes FOR UPDATE USING (true);
CREATE POLICY "Allow delete access to wine_appellation_grapes" ON wine_appellation_grapes FOR DELETE USING (true);

-- 3. Vérifier que les politiques ont été créées
SELECT 'Politiques RLS créées avec succès' as status;
