-- Script pour créer l'utilisateur et les données de test
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier si l'utilisateur existe dans auth.users
SELECT 
  'Vérification auth.users' as check_type,
  id,
  email,
  created_at
FROM auth.users 
WHERE id = '27fd73b1-7088-4211-af88-3d075851f0db';

-- 2. Vérifier si l'utilisateur existe dans la table User
SELECT 
  'Vérification table User' as check_type,
  id,
  first_name,
  email,
  created_at
FROM "User" 
WHERE id = '27fd73b1-7088-4211-af88-3d075851f0db';

-- 3. Créer l'utilisateur dans la table User s'il n'existe pas
-- Note: Remplace 'test@example.com' par l'email réel de l'utilisateur
INSERT INTO "User" (id, first_name, email, created_at) VALUES
  ('27fd73b1-7088-4211-af88-3d075851f0db', 'Test', 'test@example.com', NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. Insérer des producteurs
INSERT INTO producer (id, name) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Château Margaux'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Domaine de la Romanée-Conti'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Château Lafite Rothschild'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Château Mouton Rothschild'),
  ('550e8400-e29b-41d4-a716-446655440005', 'Château Latour')
ON CONFLICT (id) DO NOTHING;

-- 5. Insérer des pays
INSERT INTO country (id, name, flag_emoji) VALUES
  ('550e8400-e29b-41d4-a716-446655440010', 'France', '🇫🇷'),
  ('550e8400-e29b-41d4-a716-446655440011', 'Italie', '🇮🇹'),
  ('550e8400-e29b-41d4-a716-446655440012', 'Espagne', '🇪🇸')
ON CONFLICT (id) DO NOTHING;

-- 6. Insérer des vins
INSERT INTO wine (id, name, year, wine_type, region, producer_id, country_id) VALUES
  ('550e8400-e29b-41d4-a716-446655440100', 'Château Margaux 2015', '2015', 'red', 'Bordeaux', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440010'),
  ('550e8400-e29b-41d4-a716-446655440101', 'Romanée-Conti 2018', '2018', 'red', 'Bourgogne', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440010'),
  ('550e8400-e29b-41d4-a716-446655440102', 'Lafite Rothschild 2016', '2016', 'red', 'Bordeaux', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440010'),
  ('550e8400-e29b-41d4-a716-446655440103', 'Mouton Rothschild 2017', '2017', 'red', 'Bordeaux', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440010'),
  ('550e8400-e29b-41d4-a716-446655440104', 'Château Latour 2019', '2019', 'red', 'Bordeaux', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440010'),
  ('550e8400-e29b-41d4-a716-446655440105', 'Chablis Grand Cru 2020', '2020', 'white', 'Bourgogne', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440010'),
  ('550e8400-e29b-41d4-a716-446655440106', 'Champagne Dom Pérignon 2012', '2012', 'sparkling', 'Champagne', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440010'),
  ('550e8400-e29b-41d4-a716-446655440107', 'Rosé de Provence 2021', '2021', 'rose', 'Provence', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440010')
ON CONFLICT (id) DO NOTHING;

-- 7. Insérer des relations user_wine pour l'utilisateur connecté
INSERT INTO user_wine (user_id, wine_id, amount, rating, liked) VALUES
  ('27fd73b1-7088-4211-af88-3d075851f0db', '550e8400-e29b-41d4-a716-446655440100', 2, 5, true),
  ('27fd73b1-7088-4211-af88-3d075851f0db', '550e8400-e29b-41d4-a716-446655440101', 1, 4, false),
  ('27fd73b1-7088-4211-af88-3d075851f0db', '550e8400-e29b-41d4-a716-446655440102', 3, 5, true),
  ('27fd73b1-7088-4211-af88-3d075851f0db', '550e8400-e29b-41d4-a716-446655440105', 1, 3, false),
  ('27fd73b1-7088-4211-af88-3d075851f0db', '550e8400-e29b-41d4-a716-446655440106', 2, 5, true),
  ('27fd73b1-7088-4211-af88-3d075851f0db', '550e8400-e29b-41d4-a716-446655440107', 1, 4, false)
ON CONFLICT (user_id, wine_id) DO NOTHING;

-- 8. Vérifier les données insérées
SELECT 
  'Vérification finale' as check_type,
  (SELECT COUNT(*) FROM "User" WHERE id = '27fd73b1-7088-4211-af88-3d075851f0db') as user_exists,
  (SELECT COUNT(*) FROM producer) as producer_count,
  (SELECT COUNT(*) FROM wine) as wine_count,
  (SELECT COUNT(*) FROM user_wine WHERE user_id = '27fd73b1-7088-4211-af88-3d075851f0db') as user_wine_count; 