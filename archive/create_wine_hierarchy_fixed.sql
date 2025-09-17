-- Script pour creer la hierarchie complete : Pays -> Regions -> Appellations -> Cepages
-- Systeme dynamique et lie pour la selection des vins

-- 1. Creation des tables
-- =====================

-- Table des pays
CREATE TABLE IF NOT EXISTS wine_countries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    flag_emoji VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des regions viticoles
CREATE TABLE IF NOT EXISTS wine_regions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country_id UUID REFERENCES wine_countries(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, country_id)
);

-- Table des appellations
CREATE TABLE IF NOT EXISTS wine_appellations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    region_id UUID REFERENCES wine_regions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, region_id)
);

-- Table des cepages
CREATE TABLE IF NOT EXISTS wine_grape_varieties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(20) CHECK (color IN ('red', 'white', 'rose', 'sparkling')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de liaison appellations-cepages (relation many-to-many)
CREATE TABLE IF NOT EXISTS wine_appellation_grapes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    appellation_id UUID REFERENCES wine_appellations(id) ON DELETE CASCADE,
    grape_id UUID REFERENCES wine_grape_varieties(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false, -- Cepage principal de l'appellation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(appellation_id, grape_id)
);

-- 2. Insertion des pays
-- ====================

INSERT INTO wine_countries (name, flag_emoji) VALUES
('France', '🇫🇷'),
('Italie', '🇮🇹'),
('Espagne', '🇪🇸'),
('Etats-Unis', '🇺🇸'),
('Australie', '🇦🇺'),
('Afrique du Sud', '🇿🇦'),
('Allemagne', '🇩🇪'),
('Argentine', '🇦🇷'),
('Chili', '🇨🇱'),
('Portugal', '🇵🇹'),
('Nouvelle-Zelande', '🇳🇿'),
('Autriche', '🇦🇹'),
('Suisse', '🇨🇭'),
('Canada', '🇨🇦'),
('Bresil', '🇧🇷'),
('Grece', '🇬🇷'),
('Hongrie', '🇭🇺'),
('Chine', '🇨🇳'),
('Japon', '🇯🇵'),
('Liban', '🇱🇧'),
('Israel', '🇮🇱'),
('Georgie', '🇬🇪'),
('Armenie', '🇦🇲'),
('Turquie', '🇹🇷'),
('Inde', '🇮🇳'),
('Mexique', '🇲🇽'),
('Perou', '🇵🇪'),
('Bolivie', '🇧🇴'),
('Maroc', '🇲🇦'),
('Tunisie', '🇹🇳'),
('Algerie', '🇩🇿'),
('Egypte', '🇪🇬');

-- 3. Insertion des regions par pays
-- =================================

-- France
INSERT INTO wine_regions (name, country_id) VALUES
('Alsace', (SELECT id FROM wine_countries WHERE name = 'France')),
('Beaujolais', (SELECT id FROM wine_countries WHERE name = 'France')),
('Bordeaux', (SELECT id FROM wine_countries WHERE name = 'France')),
('Bourgogne', (SELECT id FROM wine_countries WHERE name = 'France')),
('Champagne', (SELECT id FROM wine_countries WHERE name = 'France')),
('Corse', (SELECT id FROM wine_countries WHERE name = 'France')),
('Jura', (SELECT id FROM wine_countries WHERE name = 'France')),
('Languedoc-Roussillon', (SELECT id FROM wine_countries WHERE name = 'France')),
('Provence', (SELECT id FROM wine_countries WHERE name = 'France')),
('Savoie', (SELECT id FROM wine_countries WHERE name = 'France')),
('Sud-Ouest', (SELECT id FROM wine_countries WHERE name = 'France')),
('Vallee de la Loire', (SELECT id FROM wine_countries WHERE name = 'France')),
('Vallee du Rhone', (SELECT id FROM wine_countries WHERE name = 'France'));

-- Italie
INSERT INTO wine_regions (name, country_id) VALUES
('Piemont', (SELECT id FROM wine_countries WHERE name = 'Italie')),
('Toscane', (SELECT id FROM wine_countries WHERE name = 'Italie')),
('Venetie', (SELECT id FROM wine_countries WHERE name = 'Italie')),
('Lombardie', (SELECT id FROM wine_countries WHERE name = 'Italie')),
('Sicile', (SELECT id FROM wine_countries WHERE name = 'Italie')),
('Sardaigne', (SELECT id FROM wine_countries WHERE name = 'Italie')),
('Pouilles', (SELECT id FROM wine_countries WHERE name = 'Italie')),
('Calabre', (SELECT id FROM wine_countries WHERE name = 'Italie')),
('Campanie', (SELECT id FROM wine_countries WHERE name = 'Italie')),
('Emilie-Romagne', (SELECT id FROM wine_countries WHERE name = 'Italie'));

-- Espagne
INSERT INTO wine_regions (name, country_id) VALUES
('Andalousie', (SELECT id FROM wine_countries WHERE name = 'Espagne')),
('Aragon', (SELECT id FROM wine_countries WHERE name = 'Espagne')),
('Castille-et-Leon', (SELECT id FROM wine_countries WHERE name = 'Espagne')),
('Catalogne', (SELECT id FROM wine_countries WHERE name = 'Espagne')),
('Galice', (SELECT id FROM wine_countries WHERE name = 'Espagne')),
('La Rioja', (SELECT id FROM wine_countries WHERE name = 'Espagne')),
('Navarre', (SELECT id FROM wine_countries WHERE name = 'Espagne')),
('Pays Basque', (SELECT id FROM wine_countries WHERE name = 'Espagne')),
('Valence', (SELECT id FROM wine_countries WHERE name = 'Espagne'));

-- Etats-Unis
INSERT INTO wine_regions (name, country_id) VALUES
('Californie', (SELECT id FROM wine_countries WHERE name = 'Etats-Unis')),
('Oregon', (SELECT id FROM wine_countries WHERE name = 'Etats-Unis')),
('Washington', (SELECT id FROM wine_countries WHERE name = 'Etats-Unis')),
('New York', (SELECT id FROM wine_countries WHERE name = 'Etats-Unis'));

-- Australie
INSERT INTO wine_regions (name, country_id) VALUES
('Australie-Meridionale', (SELECT id FROM wine_countries WHERE name = 'Australie')),
('Victoria', (SELECT id FROM wine_countries WHERE name = 'Australie')),
('Nouvelle-Galles du Sud', (SELECT id FROM wine_countries WHERE name = 'Australie')),
('Australie-Occidentale', (SELECT id FROM wine_countries WHERE name = 'Australie'));

-- Afrique du Sud
INSERT INTO wine_regions (name, country_id) VALUES
('Western Cape', (SELECT id FROM wine_countries WHERE name = 'Afrique du Sud')),
('Northern Cape', (SELECT id FROM wine_countries WHERE name = 'Afrique du Sud')),
('Eastern Cape', (SELECT id FROM wine_countries WHERE name = 'Afrique du Sud'));

-- Allemagne
INSERT INTO wine_regions (name, country_id) VALUES
('Bade', (SELECT id FROM wine_countries WHERE name = 'Allemagne')),
('Franconie', (SELECT id FROM wine_countries WHERE name = 'Allemagne')),
('Hesse rhenane', (SELECT id FROM wine_countries WHERE name = 'Allemagne')),
('Moselle', (SELECT id FROM wine_countries WHERE name = 'Allemagne')),
('Palatinat', (SELECT id FROM wine_countries WHERE name = 'Allemagne')),
('Saxe', (SELECT id FROM wine_countries WHERE name = 'Allemagne'));

-- 4. Insertion des appellations principales
-- ========================================

-- Appellations Bordeaux
INSERT INTO wine_appellations (name, region_id) VALUES
('Medoc', (SELECT id FROM wine_regions WHERE name = 'Bordeaux')),
('Saint-Emilion', (SELECT id FROM wine_regions WHERE name = 'Bordeaux')),
('Pomerol', (SELECT id FROM wine_regions WHERE name = 'Bordeaux')),
('Graves', (SELECT id FROM wine_regions WHERE name = 'Bordeaux')),
('Sauternes', (SELECT id FROM wine_regions WHERE name = 'Bordeaux')),
('Pessac-Leognan', (SELECT id FROM wine_regions WHERE name = 'Bordeaux')),
('Margaux', (SELECT id FROM wine_regions WHERE name = 'Bordeaux')),
('Pauillac', (SELECT id FROM wine_regions WHERE name = 'Bordeaux')),
('Saint-Julien', (SELECT id FROM wine_regions WHERE name = 'Bordeaux')),
('Listrac-Medoc', (SELECT id FROM wine_regions WHERE name = 'Bordeaux'));

-- Appellations Bourgogne
INSERT INTO wine_appellations (name, region_id) VALUES
('Chablis', (SELECT id FROM wine_regions WHERE name = 'Bourgogne')),
('Cote de Nuits', (SELECT id FROM wine_regions WHERE name = 'Bourgogne')),
('Cote de Beaune', (SELECT id FROM wine_regions WHERE name = 'Bourgogne')),
('Pommard', (SELECT id FROM wine_regions WHERE name = 'Bourgogne')),
('Volnay', (SELECT id FROM wine_regions WHERE name = 'Bourgogne')),
('Meursault', (SELECT id FROM wine_regions WHERE name = 'Bourgogne')),
('Puligny-Montrachet', (SELECT id FROM wine_regions WHERE name = 'Bourgogne')),
('Gevrey-Chambertin', (SELECT id FROM wine_regions WHERE name = 'Bourgogne')),
('Nuits-Saint-Georges', (SELECT id FROM wine_regions WHERE name = 'Bourgogne')),
('Beaune', (SELECT id FROM wine_regions WHERE name = 'Bourgogne'));

-- Appellations Champagne
INSERT INTO wine_appellations (name, region_id) VALUES
('Montagne de Reims', (SELECT id FROM wine_regions WHERE name = 'Champagne')),
('Vallee de la Marne', (SELECT id FROM wine_regions WHERE name = 'Champagne')),
('Cote des Blancs', (SELECT id FROM wine_regions WHERE name = 'Champagne')),
('Cote de Sezanne', (SELECT id FROM wine_regions WHERE name = 'Champagne')),
('Aube', (SELECT id FROM wine_regions WHERE name = 'Champagne'));

-- Appellations Vallee du Rhone
INSERT INTO wine_appellations (name, region_id) VALUES
('Cote-Rotie', (SELECT id FROM wine_regions WHERE name = 'Vallee du Rhone')),
('Hermitage', (SELECT id FROM wine_regions WHERE name = 'Vallee du Rhone')),
('Chateauneuf-du-Pape', (SELECT id FROM wine_regions WHERE name = 'Vallee du Rhone')),
('Gigondas', (SELECT id FROM wine_regions WHERE name = 'Vallee du Rhone')),
('Vacqueyras', (SELECT id FROM wine_regions WHERE name = 'Vallee du Rhone')),
('Lirac', (SELECT id FROM wine_regions WHERE name = 'Vallee du Rhone')),
('Tavel', (SELECT id FROM wine_regions WHERE name = 'Vallee du Rhone')),
('Condrieu', (SELECT id FROM wine_regions WHERE name = 'Vallee du Rhone'));

-- Appellations Vallee de la Loire
INSERT INTO wine_appellations (name, region_id) VALUES
('Sancerre', (SELECT id FROM wine_regions WHERE name = 'Vallee de la Loire')),
('Pouilly-Fume', (SELECT id FROM wine_regions WHERE name = 'Vallee de la Loire')),
('Vouvray', (SELECT id FROM wine_regions WHERE name = 'Vallee de la Loire')),
('Chinon', (SELECT id FROM wine_regions WHERE name = 'Vallee de la Loire')),
('Bourgueil', (SELECT id FROM wine_regions WHERE name = 'Vallee de la Loire')),
('Anjou', (SELECT id FROM wine_regions WHERE name = 'Vallee de la Loire')),
('Saumur', (SELECT id FROM wine_regions WHERE name = 'Vallee de la Loire')),
('Muscadet Sevre et Maine', (SELECT id FROM wine_regions WHERE name = 'Vallee de la Loire'));

-- Appellations Alsace
INSERT INTO wine_appellations (name, region_id) VALUES
('Alsace AOC', (SELECT id FROM wine_regions WHERE name = 'Alsace')),
('Alsace Grand Cru', (SELECT id FROM wine_regions WHERE name = 'Alsace')),
('Cremant d''Alsace', (SELECT id FROM wine_regions WHERE name = 'Alsace'));

-- Appellations Toscane
INSERT INTO wine_appellations (name, region_id) VALUES
('Chianti', (SELECT id FROM wine_regions WHERE name = 'Toscane')),
('Chianti Classico', (SELECT id FROM wine_regions WHERE name = 'Toscane')),
('Brunello di Montalcino', (SELECT id FROM wine_regions WHERE name = 'Toscane')),
('Vino Nobile di Montepulciano', (SELECT id FROM wine_regions WHERE name = 'Toscane')),
('Bolgheri', (SELECT id FROM wine_regions WHERE name = 'Toscane')),
('Maremma', (SELECT id FROM wine_regions WHERE name = 'Toscane'));

-- Appellations Piemont
INSERT INTO wine_appellations (name, region_id) VALUES
('Barolo', (SELECT id FROM wine_regions WHERE name = 'Piemont')),
('Barbaresco', (SELECT id FROM wine_regions WHERE name = 'Piemont')),
('Asti', (SELECT id FROM wine_regions WHERE name = 'Piemont')),
('Moscato d''Asti', (SELECT id FROM wine_regions WHERE name = 'Piemont')),
('Nebbiolo d''Alba', (SELECT id FROM wine_regions WHERE name = 'Piemont')),
('Dolcetto d''Alba', (SELECT id FROM wine_regions WHERE name = 'Piemont'));

-- Appellations La Rioja
INSERT INTO wine_appellations (name, region_id) VALUES
('Rioja', (SELECT id FROM wine_regions WHERE name = 'La Rioja')),
('Rioja Alta', (SELECT id FROM wine_regions WHERE name = 'La Rioja')),
('Rioja Alavesa', (SELECT id FROM wine_regions WHERE name = 'La Rioja')),
('Rioja Baja', (SELECT id FROM wine_regions WHERE name = 'La Rioja'));

-- Appellations Californie
INSERT INTO wine_appellations (name, region_id) VALUES
('Napa Valley', (SELECT id FROM wine_regions WHERE name = 'Californie')),
('Sonoma County', (SELECT id FROM wine_regions WHERE name = 'Californie')),
('Central Coast', (SELECT id FROM wine_regions WHERE name = 'Californie')),
('Paso Robles', (SELECT id FROM wine_regions WHERE name = 'Californie')),
('Santa Barbara', (SELECT id FROM wine_regions WHERE name = 'Californie'));

-- 5. Insertion des cepages principaux
-- ===================================

INSERT INTO wine_grape_varieties (name, color) VALUES
-- Cepages rouges
('Cabernet Sauvignon', 'red'),
('Merlot', 'red'),
('Pinot Noir', 'red'),
('Syrah', 'red'),
('Grenache', 'red'),
('Sangiovese', 'red'),
('Tempranillo', 'red'),
('Malbec', 'red'),
('Cabernet Franc', 'red'),
('Petit Verdot', 'red'),
('Carmenere', 'red'),
('Mourvedre', 'red'),
('Cinsault', 'red'),
('Gamay', 'red'),
('Nebbiolo', 'red'),
('Barbera', 'red'),
('Dolcetto', 'red'),
('Corvina', 'red'),
('Rondinella', 'red'),
('Molinara', 'red'),
('Zinfandel', 'red'),
('Petite Sirah', 'red'),
('Pinotage', 'red'),
('Touriga Nacional', 'red'),
('Tinta Roriz', 'red'),
('Aglianico', 'red'),
('Nero d''Avola', 'red'),
('Montepulciano', 'red'),
('Primitivo', 'red'),
('Negroamaro', 'red'),

-- Cepages blancs
('Chardonnay', 'white'),
('Sauvignon Blanc', 'white'),
('Riesling', 'white'),
('Pinot Gris', 'white'),
('Pinot Grigio', 'white'),
('Gewurztraminer', 'white'),
('Viognier', 'white'),
('Chenin Blanc', 'white'),
('Semillon', 'white'),
('Muscat', 'white'),
('Albarino', 'white'),
('Verdejo', 'white'),
('Torrontes', 'white'),
('Furmint', 'white'),
('Gruner Veltliner', 'white'),
('Pinot Blanc', 'white'),
('Auxerrois', 'white'),
('Sylvaner', 'white'),
('Muller-Thurgau', 'white'),
('Trebbiano', 'white'),
('Garganega', 'white'),
('Falanghina', 'white'),
('Greco', 'white'),
('Fiano', 'white'),
('Verdicchio', 'white'),
('Pecorino', 'white'),
('Malvasia', 'white'),
('Moscato', 'white'),
('Prosecco', 'white'),
('Cortese', 'white');

-- 6. Association des cepages aux appellations
-- ===========================================

-- Bordeaux - Medoc
INSERT INTO wine_appellation_grapes (appellation_id, grape_id, is_primary) VALUES
((SELECT id FROM wine_appellations WHERE name = 'Medoc'), (SELECT id FROM wine_grape_varieties WHERE name = 'Cabernet Sauvignon'), true),
((SELECT id FROM wine_appellations WHERE name = 'Medoc'), (SELECT id FROM wine_grape_varieties WHERE name = 'Merlot'), true),
((SELECT id FROM wine_appellations WHERE name = 'Medoc'), (SELECT id FROM wine_grape_varieties WHERE name = 'Cabernet Franc'), false),
((SELECT id FROM wine_appellations WHERE name = 'Medoc'), (SELECT id FROM wine_grape_varieties WHERE name = 'Petit Verdot'), false);

-- Bordeaux - Saint-Emilion
INSERT INTO wine_appellation_grapes (appellation_id, grape_id, is_primary) VALUES
((SELECT id FROM wine_appellations WHERE name = 'Saint-Emilion'), (SELECT id FROM wine_grape_varieties WHERE name = 'Merlot'), true),
((SELECT id FROM wine_appellations WHERE name = 'Saint-Emilion'), (SELECT id FROM wine_grape_varieties WHERE name = 'Cabernet Franc'), true),
((SELECT id FROM wine_appellations WHERE name = 'Saint-Emilion'), (SELECT id FROM wine_grape_varieties WHERE name = 'Cabernet Sauvignon'), false);

-- Bordeaux - Pomerol
INSERT INTO wine_appellation_grapes (appellation_id, grape_id, is_primary) VALUES
((SELECT id FROM wine_appellations WHERE name = 'Pomerol'), (SELECT id FROM wine_grape_varieties WHERE name = 'Merlot'), true),
((SELECT id FROM wine_appellations WHERE name = 'Pomerol'), (SELECT id FROM wine_grape_varieties WHERE name = 'Cabernet Franc'), true);

-- Bourgogne - Chablis
INSERT INTO wine_appellation_grapes (appellation_id, grape_id, is_primary) VALUES
((SELECT id FROM wine_appellations WHERE name = 'Chablis'), (SELECT id FROM wine_grape_varieties WHERE name = 'Chardonnay'), true);

-- Bourgogne - Cote de Nuits
INSERT INTO wine_appellation_grapes (appellation_id, grape_id, is_primary) VALUES
((SELECT id FROM wine_appellations WHERE name = 'Cote de Nuits'), (SELECT id FROM wine_grape_varieties WHERE name = 'Pinot Noir'), true);

-- Bourgogne - Cote de Beaune
INSERT INTO wine_appellation_grapes (appellation_id, grape_id, is_primary) VALUES
((SELECT id FROM wine_appellations WHERE name = 'Cote de Beaune'), (SELECT id FROM wine_grape_varieties WHERE name = 'Pinot Noir'), true),
((SELECT id FROM wine_appellations WHERE name = 'Cote de Beaune'), (SELECT id FROM wine_grape_varieties WHERE name = 'Chardonnay'), true);

-- Champagne
INSERT INTO wine_appellation_grapes (appellation_id, grape_id, is_primary) VALUES
((SELECT id FROM wine_appellations WHERE name = 'Montagne de Reims'), (SELECT id FROM wine_grape_varieties WHERE name = 'Pinot Noir'), true),
((SELECT id FROM wine_appellations WHERE name = 'Montagne de Reims'), (SELECT id FROM wine_grape_varieties WHERE name = 'Chardonnay'), true),
((SELECT id FROM wine_appellations WHERE name = 'Vallee de la Marne'), (SELECT id FROM wine_grape_varieties WHERE name = 'Pinot Noir'), true),
((SELECT id FROM wine_appellations WHERE name = 'Cote des Blancs'), (SELECT id FROM wine_grape_varieties WHERE name = 'Chardonnay'), true);

-- Vallee du Rhone - Cote-Rotie
INSERT INTO wine_appellation_grapes (appellation_id, grape_id, is_primary) VALUES
((SELECT id FROM wine_appellations WHERE name = 'Cote-Rotie'), (SELECT id FROM wine_grape_varieties WHERE name = 'Syrah'), true),
((SELECT id FROM wine_appellations WHERE name = 'Cote-Rotie'), (SELECT id FROM wine_grape_varieties WHERE name = 'Viognier'), false);

-- Vallee du Rhone - Hermitage
INSERT INTO wine_appellation_grapes (appellation_id, grape_id, is_primary) VALUES
((SELECT id FROM wine_appellations WHERE name = 'Hermitage'), (SELECT id FROM wine_grape_varieties WHERE name = 'Syrah'), true);

-- Vallee du Rhone - Chateauneuf-du-Pape
INSERT INTO wine_appellation_grapes (appellation_id, grape_id, is_primary) VALUES
((SELECT id FROM wine_appellations WHERE name = 'Chateauneuf-du-Pape'), (SELECT id FROM wine_grape_varieties WHERE name = 'Grenache'), true),
((SELECT id FROM wine_appellations WHERE name = 'Chateauneuf-du-Pape'), (SELECT id FROM wine_grape_varieties WHERE name = 'Syrah'), true),
((SELECT id FROM wine_appellations WHERE name = 'Chateauneuf-du-Pape'), (SELECT id FROM wine_grape_varieties WHERE name = 'Mourvedre'), true);

-- Vallee de la Loire - Sancerre
INSERT INTO wine_appellation_grapes (appellation_id, grape_id, is_primary) VALUES
((SELECT id FROM wine_appellations WHERE name = 'Sancerre'), (SELECT id FROM wine_grape_varieties WHERE name = 'Sauvignon Blanc'), true);

-- Vallee de la Loire - Pouilly-Fume
INSERT INTO wine_appellation_grapes (appellation_id, grape_id, is_primary) VALUES
((SELECT id FROM wine_appellations WHERE name = 'Pouilly-Fume'), (SELECT id FROM wine_grape_varieties WHERE name = 'Sauvignon Blanc'), true);

-- Vallee de la Loire - Vouvray
INSERT INTO wine_appellation_grapes (appellation_id, grape_id, is_primary) VALUES
((SELECT id FROM wine_appellations WHERE name = 'Vouvray'), (SELECT id FROM wine_grape_varieties WHERE name = 'Chenin Blanc'), true);

-- Vallee de la Loire - Chinon
INSERT INTO wine_appellation_grapes (appellation_id, grape_id, is_primary) VALUES
((SELECT id FROM wine_appellations WHERE name = 'Chinon'), (SELECT id FROM wine_grape_varieties WHERE name = 'Cabernet Franc'), true);

-- Vallee de la Loire - Anjou
INSERT INTO wine_appellation_grapes (appellation_id, grape_id, is_primary) VALUES
((SELECT id FROM wine_appellations WHERE name = 'Anjou'), (SELECT id FROM wine_grape_varieties WHERE name = 'Chenin Blanc'), true),
((SELECT id FROM wine_appellations WHERE name = 'Anjou'), (SELECT id FROM wine_grape_varieties WHERE name = 'Cabernet Franc'), true);

-- Alsace
INSERT INTO wine_appellation_grapes (appellation_id, grape_id, is_primary) VALUES
((SELECT id FROM wine_appellations WHERE name = 'Alsace AOC'), (SELECT id FROM wine_grape_varieties WHERE name = 'Riesling'), true),
((SELECT id FROM wine_appellations WHERE name = 'Alsace AOC'), (SELECT id FROM wine_grape_varieties WHERE name = 'Gewurztraminer'), true),
((SELECT id FROM wine_appellations WHERE name = 'Alsace AOC'), (SELECT id FROM wine_grape_varieties WHERE name = 'Pinot Gris'), true),
((SELECT id FROM wine_appellations WHERE name = 'Alsace AOC'), (SELECT id FROM wine_grape_varieties WHERE name = 'Pinot Blanc'), true);

-- Toscane - Chianti
INSERT INTO wine_appellation_grapes (appellation_id, grape_id, is_primary) VALUES
((SELECT id FROM wine_appellations WHERE name = 'Chianti'), (SELECT id FROM wine_grape_varieties WHERE name = 'Sangiovese'), true),
((SELECT id FROM wine_appellations WHERE name = 'Chianti Classico'), (SELECT id FROM wine_grape_varieties WHERE name = 'Sangiovese'), true),
((SELECT id FROM wine_appellations WHERE name = 'Brunello di Montalcino'), (SELECT id FROM wine_grape_varieties WHERE name = 'Sangiovese'), true);

-- Piemont - Barolo
INSERT INTO wine_appellation_grapes (appellation_id, grape_id, is_primary) VALUES
((SELECT id FROM wine_appellations WHERE name = 'Barolo'), (SELECT id FROM wine_grape_varieties WHERE name = 'Nebbiolo'), true),
((SELECT id FROM wine_appellations WHERE name = 'Barbaresco'), (SELECT id FROM wine_grape_varieties WHERE name = 'Nebbiolo'), true);

-- La Rioja
INSERT INTO wine_appellation_grapes (appellation_id, grape_id, is_primary) VALUES
((SELECT id FROM wine_appellations WHERE name = 'Rioja'), (SELECT id FROM wine_grape_varieties WHERE name = 'Tempranillo'), true);

-- Californie - Napa Valley
INSERT INTO wine_appellation_grapes (appellation_id, grape_id, is_primary) VALUES
((SELECT id FROM wine_appellations WHERE name = 'Napa Valley'), (SELECT id FROM wine_grape_varieties WHERE name = 'Cabernet Sauvignon'), true),
((SELECT id FROM wine_appellations WHERE name = 'Napa Valley'), (SELECT id FROM wine_grape_varieties WHERE name = 'Chardonnay'), true),
((SELECT id FROM wine_appellations WHERE name = 'Sonoma County'), (SELECT id FROM wine_grape_varieties WHERE name = 'Pinot Noir'), true),
((SELECT id FROM wine_appellations WHERE name = 'Sonoma County'), (SELECT id FROM wine_grape_varieties WHERE name = 'Chardonnay'), true);

-- 7. Creation des index pour optimiser les performances
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_wine_regions_country_id ON wine_regions(country_id);
CREATE INDEX IF NOT EXISTS idx_wine_appellations_region_id ON wine_appellations(region_id);
CREATE INDEX IF NOT EXISTS idx_wine_appellation_grapes_appellation_id ON wine_appellation_grapes(appellation_id);
CREATE INDEX IF NOT EXISTS idx_wine_appellation_grapes_grape_id ON wine_appellation_grapes(grape_id);

-- 8. Activation de RLS (Row Level Security)
-- =========================================

ALTER TABLE wine_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE wine_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wine_appellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE wine_grape_varieties ENABLE ROW LEVEL SECURITY;
ALTER TABLE wine_appellation_grapes ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour permettre la lecture a tous les utilisateurs authentifies
CREATE POLICY "Allow read access to wine_countries" ON wine_countries FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read access to wine_regions" ON wine_regions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read access to wine_appellations" ON wine_appellations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read access to wine_grape_varieties" ON wine_grape_varieties FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow read access to wine_appellation_grapes" ON wine_appellation_grapes FOR SELECT USING (auth.role() = 'authenticated');

-- 9. Fonctions utilitaires pour les requetes dynamiques
-- =====================================================

-- Fonction pour recuperer les regions d'un pays
CREATE OR REPLACE FUNCTION get_regions_by_country(country_name TEXT)
RETURNS TABLE(id UUID, name VARCHAR(100)) AS $$
BEGIN
    RETURN QUERY
    SELECT wr.id, wr.name
    FROM wine_regions wr
    JOIN wine_countries wc ON wr.country_id = wc.id
    WHERE wc.name = country_name
    ORDER BY wr.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour recuperer les appellations d'une region
CREATE OR REPLACE FUNCTION get_appellations_by_region(region_name TEXT)
RETURNS TABLE(id UUID, name VARCHAR(150)) AS $$
BEGIN
    RETURN QUERY
    SELECT wa.id, wa.name
    FROM wine_appellations wa
    JOIN wine_regions wr ON wa.region_id = wr.id
    WHERE wr.name = region_name
    ORDER BY wa.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour recuperer les cepages d'une appellation
CREATE OR REPLACE FUNCTION get_grapes_by_appellation(appellation_name TEXT)
RETURNS TABLE(id UUID, name VARCHAR(100), color VARCHAR(20), is_primary BOOLEAN) AS $$
BEGIN
    RETURN QUERY
    SELECT wgv.id, wgv.name, wgv.color, wag.is_primary
    FROM wine_grape_varieties wgv
    JOIN wine_appellation_grapes wag ON wgv.id = wag.grape_id
    JOIN wine_appellations wa ON wag.appellation_id = wa.id
    WHERE wa.name = appellation_name
    ORDER BY wag.is_primary DESC, wgv.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour recuperer la hierarchie complete d'un vin
CREATE OR REPLACE FUNCTION get_wine_hierarchy(wine_country TEXT, wine_region TEXT, wine_appellation TEXT)
RETURNS TABLE(
    country_id UUID,
    country_name VARCHAR(100),
    region_id UUID,
    region_name VARCHAR(100),
    appellation_id UUID,
    appellation_name VARCHAR(150),
    grapes JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wc.id as country_id,
        wc.name as country_name,
        wr.id as region_id,
        wr.name as region_name,
        wa.id as appellation_id,
        wa.name as appellation_name,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', wgv.id,
                    'name', wgv.name,
                    'color', wgv.color,
                    'is_primary', wag.is_primary
                ) ORDER BY wag.is_primary DESC, wgv.name
            ) FILTER (WHERE wgv.id IS NOT NULL),
            '[]'::jsonb
        ) as grapes
    FROM wine_countries wc
    JOIN wine_regions wr ON wc.id = wr.country_id
    JOIN wine_appellations wa ON wr.id = wa.region_id
    LEFT JOIN wine_appellation_grapes wag ON wa.id = wag.appellation_id
    LEFT JOIN wine_grape_varieties wgv ON wag.grape_id = wgv.id
    WHERE wc.name = wine_country
    AND wr.name = wine_region
    AND wa.name = wine_appellation
    GROUP BY wc.id, wc.name, wr.id, wr.name, wa.id, wa.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Verification des donnees inserees
-- =====================================

-- Compter les enregistrements par table
SELECT 
    'wine_countries' as table_name, COUNT(*) as count FROM wine_countries
UNION ALL
SELECT 
    'wine_regions' as table_name, COUNT(*) as count FROM wine_regions
UNION ALL
SELECT 
    'wine_appellations' as table_name, COUNT(*) as count FROM wine_appellations
UNION ALL
SELECT 
    'wine_grape_varieties' as table_name, COUNT(*) as count FROM wine_grape_varieties
UNION ALL
SELECT 
    'wine_appellation_grapes' as table_name, COUNT(*) as count FROM wine_appellation_grapes;

-- Test des fonctions
SELECT * FROM get_regions_by_country('France');
SELECT * FROM get_appellations_by_region('Bordeaux');
SELECT * FROM get_grapes_by_appellation('Medoc');
SELECT * FROM get_wine_hierarchy('France', 'Bordeaux', 'Medoc');




