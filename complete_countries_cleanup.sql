-- Nettoyage complet de la table country

-- 1. D'abord, mettre à jour TOUS les vins qui référencent des régions vers "France"
UPDATE wine 
SET country_id = (SELECT id FROM country WHERE name = 'France' LIMIT 1)
WHERE country_id IN (
  SELECT id FROM country 
  WHERE name NOT IN (
    'France', 'Italie', 'Espagne', 'Allemagne', 'Portugal', 'États-Unis', 
    'Chili', 'Argentine', 'Afrique du Sud', 'Australie', 'Nouvelle-Zélande', 
    'Autriche', 'Hongrie', 'Grèce', 'Roumanie', 'Bulgarie', 'Croatie', 
    'Slovénie', 'Géorgie', 'Liban'
  )
);

-- 2. Supprimer TOUTES les entrées qui ne sont pas des vrais pays
DELETE FROM country 
WHERE name NOT IN (
  'France', 'Italie', 'Espagne', 'Allemagne', 'Portugal', 'États-Unis', 
  'Chili', 'Argentine', 'Afrique du Sud', 'Australie', 'Nouvelle-Zélande', 
  'Autriche', 'Hongrie', 'Grèce', 'Roumanie', 'Bulgarie', 'Croatie', 
  'Slovénie', 'Géorgie', 'Liban'
);

-- 3. Mettre à jour les emojis corrects
UPDATE country SET flag_emoji = '🇫🇷' WHERE name = 'France';
UPDATE country SET flag_emoji = '🇮🇹' WHERE name = 'Italie';
UPDATE country SET flag_emoji = '🇪🇸' WHERE name = 'Espagne';
UPDATE country SET flag_emoji = '🇩🇪' WHERE name = 'Allemagne';
UPDATE country SET flag_emoji = '🇵🇹' WHERE name = 'Portugal';
UPDATE country SET flag_emoji = '🇺🇸' WHERE name = 'États-Unis';
UPDATE country SET flag_emoji = '🇨🇱' WHERE name = 'Chili';
UPDATE country SET flag_emoji = '🇦🇷' WHERE name = 'Argentine';
UPDATE country SET flag_emoji = '🇿🇦' WHERE name = 'Afrique du Sud';
UPDATE country SET flag_emoji = '🇦🇺' WHERE name = 'Australie';
UPDATE country SET flag_emoji = '🇳🇿' WHERE name = 'Nouvelle-Zélande';
UPDATE country SET flag_emoji = '🇦🇹' WHERE name = 'Autriche';
UPDATE country SET flag_emoji = '🇭🇺' WHERE name = 'Hongrie';
UPDATE country SET flag_emoji = '🇬🇷' WHERE name = 'Grèce';
UPDATE country SET flag_emoji = '🇷🇴' WHERE name = 'Roumanie';
UPDATE country SET flag_emoji = '🇧🇬' WHERE name = 'Bulgarie';
UPDATE country SET flag_emoji = '🇭🇷' WHERE name = 'Croatie';
UPDATE country SET flag_emoji = '🇸🇮' WHERE name = 'Slovénie';
UPDATE country SET flag_emoji = '🇬🇪' WHERE name = 'Géorgie';
UPDATE country SET flag_emoji = '🇱🇧' WHERE name = 'Liban';

-- 4. Vérifier le résultat final
SELECT 'RÉSULTAT FINAL' as status;
SELECT name, flag_emoji, 
  (SELECT COUNT(*) FROM wine WHERE country_id = country.id) as wine_count
FROM country 
ORDER BY name;
