-- Vérifier quels pays sont utilisés dans la table wine
SELECT 
  c.name as country_name,
  c.flag_emoji,
  COUNT(w.id) as wine_count
FROM country c
LEFT JOIN wine w ON w.country_id = c.id
GROUP BY c.id, c.name, c.flag_emoji
ORDER BY wine_count DESC, c.name;

-- Vérifier les pays qui ne sont PAS des pays (régions)
SELECT 
  c.name as region_name,
  c.flag_emoji,
  COUNT(w.id) as wine_count
FROM country c
LEFT JOIN wine w ON w.country_id = c.id
WHERE c.name IN (
  'Bordeaux', 'BORDEAUX', 'Beaujolais-Villages', 'Bourgogne', 'Champagne', 
  'Alsace', 'Loire', 'Rhône', 'Languedoc-Roussillon', 'Provence', 
  'Sud-Ouest', 'Corsica', 'Jura', 'Savoie', 'Anjou', 'Touraine', 
  'Sancerre', 'Côtes du Rhône', 'Côtes de Provence'
)
GROUP BY c.id, c.name, c.flag_emoji
ORDER BY wine_count DESC;
