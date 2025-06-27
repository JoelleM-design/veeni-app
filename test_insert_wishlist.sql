-- Test d'insertion d'un vin en wishlist pour l'utilisateur
INSERT INTO user_wine (user_id, wine_id, amount, rating, liked, origin)
VALUES ('27fd73b1-7088-4211-af88-3d075851f0db', '550e8400-e29b-41d4-a716-446655440103', 0, NULL, false, 'wishlist');
 
-- Vérifier que l'insertion a fonctionné
SELECT * FROM user_wine WHERE user_id = '27fd73b1-7088-4211-af88-3d075851f0db' AND wine_id = '550e8400-e29b-41d4-a716-446655440103'; 