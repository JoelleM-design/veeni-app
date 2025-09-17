-- Nettoyer la liste des pays - supprimer les régions et doublons
DELETE FROM country WHERE name IN (
  'Bordeaux',
  'BORDEAUX', 
  'Beaujolais-Villages',
  'Bourgogne',
  'Champagne',
  'Alsace',
  'Loire',
  'Rhône',
  'Languedoc-Roussillon',
  'Provence',
  'Sud-Ouest',
  'Corsica',
  'Jura',
  'Savoie',
  'Anjou',
  'Touraine',
  'Sancerre',
  'Côtes du Rhône',
  'Côtes de Provence'
);

-- Supprimer les doublons en gardant le premier
DELETE FROM country 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM country 
  GROUP BY name
);

-- Vérifier la liste finale
SELECT name, flag_emoji FROM country ORDER BY name;
