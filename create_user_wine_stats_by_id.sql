-- Fonction RPC pour récupérer les statistiques d'un utilisateur spécifique
CREATE OR REPLACE FUNCTION get_user_wine_stats_by_id(target_user_id uuid)
RETURNS TABLE (
  total_tasted_wines bigint,
  shared_wines_with_friends bigint,
  shared_wines_count bigint,
  total_bottles_in_cellar bigint,
  favorite_wines_count bigint,
  total_wines bigint,
  cellar_count bigint,
  wishlist_count bigint,
  red_wines_count bigint,
  white_wines_count bigint,
  rose_wines_count bigint,
  sparkling_wines_count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_wines_count bigint;
  cellar_wines_count bigint;
  wishlist_wines_count bigint;
  favorite_wines_count bigint;
  red_wines_count bigint;
  white_wines_count bigint;
  rose_wines_count bigint;
  sparkling_wines_count bigint;
  total_bottles bigint;
  tasted_wines_count bigint;
  shared_wines_count bigint;
  shared_with_friends_count bigint;
BEGIN
  -- Vérifier que l'utilisateur cible existe
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'ID utilisateur manquant';
  END IF;

  -- Compter les vins de l'utilisateur par type
  SELECT 
    COUNT(*) INTO user_wines_count
  FROM user_wine uw
  WHERE uw.user_id = target_user_id;

  -- Compter les vins en cave
  SELECT 
    COUNT(*) INTO cellar_wines_count
  FROM user_wine uw
  WHERE uw.user_id = target_user_id AND uw.origin = 'cellar';

  -- Compter les vins en wishlist
  SELECT 
    COUNT(*) INTO wishlist_wines_count
  FROM user_wine uw
  WHERE uw.user_id = target_user_id AND uw.origin = 'wishlist';

  -- Compter les vins favoris
  SELECT 
    COUNT(*) INTO favorite_wines_count
  FROM user_wine uw
  WHERE uw.user_id = target_user_id AND uw.favorite = true;

  -- Compter les bouteilles par couleur (pour Ma cave)
  SELECT 
    COALESCE(SUM(uw.stock), 0) INTO red_wines_count
  FROM user_wine uw
  JOIN wine w ON uw.wine_id = w.id
  WHERE uw.user_id = target_user_id AND w.color = 'red' AND uw.origin = 'cellar';

  SELECT 
    COALESCE(SUM(uw.stock), 0) INTO white_wines_count
  FROM user_wine uw
  JOIN wine w ON uw.wine_id = w.id
  WHERE uw.user_id = target_user_id AND w.color = 'white' AND uw.origin = 'cellar';

  SELECT 
    COALESCE(SUM(uw.stock), 0) INTO rose_wines_count
  FROM user_wine uw
  JOIN wine w ON uw.wine_id = w.id
  WHERE uw.user_id = target_user_id AND w.color = 'rose' AND uw.origin = 'cellar';

  SELECT 
    COALESCE(SUM(uw.stock), 0) INTO sparkling_wines_count
  FROM user_wine uw
  JOIN wine w ON uw.wine_id = w.id
  WHERE uw.user_id = target_user_id AND w.color = 'sparkling' AND uw.origin = 'cellar';

  -- Calculer le total des bouteilles en cave
  SELECT 
    COALESCE(SUM(uw.stock), 0) INTO total_bottles
  FROM user_wine uw
  WHERE uw.user_id = target_user_id AND uw.origin = 'cellar';

  -- Compter le total des dégustations directement depuis wine_history
  SELECT 
    COUNT(DISTINCT wine_id) INTO tasted_wines_count
  FROM wine_history wh
  WHERE wh.user_id = target_user_id;

  -- Pour l'instant, on met shared_wines_count et shared_with_friends_count à 0
  -- Ces métriques nécessiteraient des calculs plus complexes
  shared_wines_count := 0;
  shared_with_friends_count := 0;

  -- Retourner les résultats
  RETURN QUERY SELECT 
    tasted_wines_count,
    shared_with_friends_count,
    shared_wines_count,
    total_bottles,
    favorite_wines_count,
    user_wines_count,
    cellar_wines_count,
    wishlist_wines_count,
    red_wines_count,
    white_wines_count,
    rose_wines_count,
    sparkling_wines_count;
END;
$$;
