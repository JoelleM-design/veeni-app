-- Script pour corriger les politiques RLS et permettre l'ajout manuel
-- de nouvelles valeurs dans les tables de hiérarchie viticole

-- 1. Supprimer les politiques existantes trop restrictives
DROP POLICY IF EXISTS "Allow read access to wine_countries" ON wine_countries;
DROP POLICY IF EXISTS "Allow read access to wine_regions" ON wine_regions;
DROP POLICY IF EXISTS "Allow read access to wine_appellations" ON wine_appellations;
DROP POLICY IF EXISTS "Allow read access to wine_grape_varieties" ON wine_grape_varieties;
DROP POLICY IF EXISTS "Allow read access to wine_appellation_grapes" ON wine_appellation_grapes;

-- 2. Créer des politiques plus permissives pour la lecture
CREATE POLICY "Allow read access to wine_countries" ON wine_countries
    FOR SELECT USING (true);

CREATE POLICY "Allow read access to wine_regions" ON wine_regions
    FOR SELECT USING (true);

CREATE POLICY "Allow read access to wine_appellations" ON wine_appellations
    FOR SELECT USING (true);

CREATE POLICY "Allow read access to wine_grape_varieties" ON wine_grape_varieties
    FOR SELECT USING (true);

CREATE POLICY "Allow read access to wine_appellation_grapes" ON wine_appellation_grapes
    FOR SELECT USING (true);

-- 3. Créer des politiques pour l'insertion (ajout manuel)
CREATE POLICY "Allow insert access to wine_countries" ON wine_countries
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert access to wine_regions" ON wine_regions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert access to wine_appellations" ON wine_appellations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert access to wine_grape_varieties" ON wine_grape_varieties
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert access to wine_appellation_grapes" ON wine_appellation_grapes
    FOR INSERT WITH CHECK (true);

-- 4. Créer des politiques pour la mise à jour (modification des données existantes)
CREATE POLICY "Allow update access to wine_countries" ON wine_countries
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow update access to wine_regions" ON wine_regions
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow update access to wine_appellations" ON wine_appellations
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow update access to wine_grape_varieties" ON wine_grape_varieties
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow update access to wine_appellation_grapes" ON wine_appellation_grapes
    FOR UPDATE USING (true) WITH CHECK (true);

-- 5. Vérifier que les tables ont bien RLS activé
ALTER TABLE wine_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE wine_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wine_appellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE wine_grape_varieties ENABLE ROW LEVEL SECURITY;
ALTER TABLE wine_appellation_grapes ENABLE ROW LEVEL SECURITY;

-- 6. Afficher un message de confirmation
SELECT 'Politiques RLS corrigées pour permettre l''ajout manuel de nouvelles valeurs' as status;
