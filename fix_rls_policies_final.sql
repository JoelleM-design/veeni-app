-- Script final pour corriger les politiques RLS
-- Supprime d'abord toutes les politiques existantes puis les recrée

-- 1. Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Allow read access to wine_countries" ON wine_countries;
DROP POLICY IF EXISTS "Allow insert access to wine_countries" ON wine_countries;
DROP POLICY IF EXISTS "Allow update access to wine_countries" ON wine_countries;

DROP POLICY IF EXISTS "Allow read access to wine_regions" ON wine_regions;
DROP POLICY IF EXISTS "Allow insert access to wine_regions" ON wine_regions;
DROP POLICY IF EXISTS "Allow update access to wine_regions" ON wine_regions;

DROP POLICY IF EXISTS "Allow read access to wine_appellations" ON wine_appellations;
DROP POLICY IF EXISTS "Allow insert access to wine_appellations" ON wine_appellations;
DROP POLICY IF EXISTS "Allow update access to wine_appellations" ON wine_appellations;

DROP POLICY IF EXISTS "Allow read access to wine_grape_varieties" ON wine_grape_varieties;
DROP POLICY IF EXISTS "Allow insert access to wine_grape_varieties" ON wine_grape_varieties;
DROP POLICY IF EXISTS "Allow update access to wine_grape_varieties" ON wine_grape_varieties;

DROP POLICY IF EXISTS "Allow read access to wine_appellation_grapes" ON wine_appellation_grapes;
DROP POLICY IF EXISTS "Allow insert access to wine_appellation_grapes" ON wine_appellation_grapes;
DROP POLICY IF EXISTS "Allow update access to wine_appellation_grapes" ON wine_appellation_grapes;

-- 2. Créer les nouvelles politiques permissives
CREATE POLICY "Allow read access to wine_countries" ON wine_countries
    FOR SELECT USING (true);

CREATE POLICY "Allow insert access to wine_countries" ON wine_countries
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access to wine_countries" ON wine_countries
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow read access to wine_regions" ON wine_regions
    FOR SELECT USING (true);

CREATE POLICY "Allow insert access to wine_regions" ON wine_regions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access to wine_regions" ON wine_regions
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow read access to wine_appellations" ON wine_appellations
    FOR SELECT USING (true);

CREATE POLICY "Allow insert access to wine_appellations" ON wine_appellations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access to wine_appellations" ON wine_appellations
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow read access to wine_grape_varieties" ON wine_grape_varieties
    FOR SELECT USING (true);

CREATE POLICY "Allow insert access to wine_grape_varieties" ON wine_grape_varieties
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access to wine_grape_varieties" ON wine_grape_varieties
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow read access to wine_appellation_grapes" ON wine_appellation_grapes
    FOR SELECT USING (true);

CREATE POLICY "Allow insert access to wine_appellation_grapes" ON wine_appellation_grapes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access to wine_appellation_grapes" ON wine_appellation_grapes
    FOR UPDATE USING (true) WITH CHECK (true);

-- 3. Vérifier que RLS est activé
ALTER TABLE wine_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE wine_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wine_appellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE wine_grape_varieties ENABLE ROW LEVEL SECURITY;
ALTER TABLE wine_appellation_grapes ENABLE ROW LEVEL SECURITY;

-- 4. Afficher un message de confirmation
SELECT 'Politiques RLS corrigées avec succès - Ajout manuel maintenant possible' as status;
