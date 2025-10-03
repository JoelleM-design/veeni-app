-- Script de debug pour Supabase
-- Copier-coller ce script dans l'éditeur SQL de Supabase

-- 1. Vérifier les événements wine_history
SELECT '=== ÉVÉNEMENTS WINE_HISTORY ===' as section;

SELECT 
  COUNT(*) as total_events,
  COUNT(CASE WHEN event_type = 'stock_change' THEN 1 END) as stock_change_events,
  COUNT(CASE WHEN event_type = 'tasted' THEN 1 END) as tasted_events,
  COUNT(CASE WHEN event_type = 'noted' THEN 1 END) as noted_events
FROM wine_history;

-- 2. Lister les 10 derniers événements
SELECT '=== 10 DERNIERS ÉVÉNEMENTS ===' as section;

SELECT 
  id,
  event_type,
  wine_id,
  user_id,
  previous_amount,
  new_amount,
  notes,
  rating,
  event_date,
  created_at
FROM wine_history 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Vérifier les événements stock_change problématiques
SELECT '=== ÉVÉNEMENTS STOCK_CHANGE PROBLÉMATIQUES ===' as section;

SELECT 
  id,
  wine_id,
  user_id,
  previous_amount,
  new_amount,
  (previous_amount - new_amount) as difference,
  CASE 
    WHEN previous_amount > new_amount THEN 'Réduction ✅'
    WHEN previous_amount < new_amount THEN 'Augmentation 📈'
    ELSE 'Aucun changement ⚠️'
  END as statut,
  created_at
FROM wine_history 
WHERE event_type = 'stock_change'
ORDER BY created_at DESC;

-- 4. Vérifier les vins Batti
SELECT '=== VINS BATTI ===' as section;

SELECT 
  id,
  name,
  wine_type,
  created_at
FROM wine 
WHERE name ILIKE '%batti%'
ORDER BY created_at DESC;

-- 5. Vérifier les user_wine pour les vins Batti
SELECT '=== USER_WINE POUR BATTI ===' as section;

SELECT 
  uw.id,
  uw.user_id,
  uw.wine_id,
  w.name as wine_name,
  uw.amount,
  uw.origin,
  uw.favorite,
  uw.rating,
  uw.created_at,
  uw.updated_at
FROM user_wine uw
JOIN wine w ON uw.wine_id = w.id
WHERE w.name ILIKE '%batti%'
ORDER BY uw.created_at DESC;

-- 6. Vérifier les événements pour les vins Batti
SELECT '=== ÉVÉNEMENTS POUR BATTI ===' as section;

SELECT 
  wh.id,
  wh.event_type,
  wh.wine_id,
  w.name as wine_name,
  wh.user_id,
  wh.previous_amount,
  wh.new_amount,
  (wh.previous_amount - wh.new_amount) as difference,
  wh.notes,
  wh.rating,
  wh.created_at
FROM wine_history wh
JOIN wine w ON wh.wine_id = w.id
WHERE w.name ILIKE '%batti%'
ORDER BY wh.created_at DESC;

-- 7. Statistiques globales user_wine
SELECT '=== STATISTIQUES USER_WINE ===' as section;

SELECT 
  COUNT(*) as total_entries,
  COUNT(CASE WHEN origin = 'cellar' THEN 1 END) as cellar_wines,
  COUNT(CASE WHEN origin = 'wishlist' THEN 1 END) as wishlist_wines,
  COUNT(CASE WHEN favorite = true THEN 1 END) as favorite_wines,
  SUM(amount) as total_bottles,
  SUM(CASE WHEN origin = 'cellar' THEN amount ELSE 0 END) as cellar_bottles
FROM user_wine;

-- 8. Statistiques par type de vin
SELECT '=== STATISTIQUES PAR TYPE ===' as section;

SELECT 
  w.wine_type,
  COUNT(uw.id) as wine_count,
  SUM(uw.amount) as total_bottles
FROM user_wine uw
JOIN wine w ON uw.wine_id = w.id
WHERE uw.origin = 'cellar'
GROUP BY w.wine_type
ORDER BY total_bottles DESC;

-- 9. Vérifier les utilisateurs
SELECT '=== UTILISATEURS ===' as section;

SELECT 
  id,
  email,
  first_name,
  created_at
FROM "User"
ORDER BY created_at DESC
LIMIT 5;

-- 10. Vérifier les user_wine récents
SELECT '=== USER_WINE RÉCENTS ===' as section;

SELECT 
  uw.id,
  uw.user_id,
  w.name as wine_name,
  w.wine_type,
  uw.amount,
  uw.origin,
  uw.favorite,
  uw.created_at
FROM user_wine uw
JOIN wine w ON uw.wine_id = w.id
ORDER BY uw.created_at DESC
LIMIT 10;

-- 11. Recherche d'événements avec previous_amount = new_amount (problématiques)
SELECT '=== ÉVÉNEMENTS AVEC PREVIOUS = NEW (PROBLÉMATIQUES) ===' as section;

SELECT 
  id,
  wine_id,
  user_id,
  previous_amount,
  new_amount,
  notes,
  created_at
FROM wine_history 
WHERE event_type = 'stock_change' 
  AND previous_amount = new_amount
ORDER BY created_at DESC;

-- 12. Compter les dégustations valides (réductions de stock)
SELECT '=== DÉGUSTATIONS VALIDES ===' as section;

SELECT 
  COUNT(*) as valid_tastings,
  COUNT(DISTINCT wine_id) as unique_wines_tasted
FROM wine_history 
WHERE event_type = 'stock_change' 
  AND previous_amount > new_amount;
