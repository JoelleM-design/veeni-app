-- Script pour créer la structure d'historique des vins
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Créer la table wine_history pour tracer tous les événements
CREATE TABLE IF NOT EXISTS wine_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  wine_id UUID NOT NULL REFERENCES wine(id) ON DELETE CASCADE,
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('added', 'tasted', 'stock_change', 'removed', 'noted', 'favorited')),
  event_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  previous_amount INTEGER,
  new_amount INTEGER,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Créer les index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_wine_history_user_id ON wine_history(user_id);
CREATE INDEX IF NOT EXISTS idx_wine_history_wine_id ON wine_history(wine_id);
CREATE INDEX IF NOT EXISTS idx_wine_history_event_date ON wine_history(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_wine_history_event_type ON wine_history(event_type);

-- 3. Ajouter une colonne history à la table user_wine pour la compatibilité
ALTER TABLE user_wine ADD COLUMN IF NOT EXISTS history JSONB DEFAULT '[]';

-- 4. Créer une fonction pour automatiquement ajouter des entrées d'historique
CREATE OR REPLACE FUNCTION add_wine_history_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Si c'est une nouvelle entrée
  IF TG_OP = 'INSERT' THEN
    INSERT INTO wine_history (user_id, wine_id, event_type, new_amount, rating)
    VALUES (NEW.user_id, NEW.wine_id, 'added', NEW.amount, NEW.rating);
    
    -- Mettre à jour le JSON history dans user_wine
    NEW.history = jsonb_build_array(
      jsonb_build_object(
        'type', 'added',
        'date', NOW()::text,
        'value', NEW.amount
      )
    );
    
  -- Si c'est une mise à jour
  ELSIF TG_OP = 'UPDATE' THEN
    -- Si le stock a changé
    IF OLD.amount != NEW.amount THEN
      INSERT INTO wine_history (user_id, wine_id, event_type, previous_amount, new_amount)
      VALUES (NEW.user_id, NEW.wine_id, 'stock_change', OLD.amount, NEW.amount);
      
      -- Si le stock passe à 0, marquer comme supprimé
      IF NEW.amount = 0 THEN
        INSERT INTO wine_history (user_id, wine_id, event_type, previous_amount, new_amount)
        VALUES (NEW.user_id, NEW.wine_id, 'removed', OLD.amount, 0);
      END IF;
    END IF;
    
    -- Si la note a changé
    IF OLD.rating != NEW.rating AND NEW.rating IS NOT NULL THEN
      INSERT INTO wine_history (user_id, wine_id, event_type, rating)
      VALUES (NEW.user_id, NEW.wine_id, 'tasted', NEW.rating);
    END IF;
    
    -- Si le statut favori a changé
    IF OLD.liked != NEW.liked THEN
      INSERT INTO wine_history (user_id, wine_id, event_type)
      VALUES (NEW.user_id, NEW.wine_id, 'favorited');
    END IF;
    
    -- Mettre à jour le JSON history
    NEW.history = (
      SELECT jsonb_agg(
        jsonb_build_object(
          'type', wh.event_type,
          'date', wh.event_date::text,
          'value', COALESCE(wh.new_amount, wh.rating)
        )
      )
      FROM wine_history wh
      WHERE wh.user_id = NEW.user_id AND wh.wine_id = NEW.wine_id
      ORDER BY wh.event_date DESC
    );
    
  -- Si c'est une suppression
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO wine_history (user_id, wine_id, event_type, previous_amount, new_amount)
    VALUES (OLD.user_id, OLD.wine_id, 'removed', OLD.amount, 0);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Créer le trigger pour automatiser l'historique
DROP TRIGGER IF EXISTS trigger_wine_history ON user_wine;
CREATE TRIGGER trigger_wine_history
  AFTER INSERT OR UPDATE OR DELETE ON user_wine
  FOR EACH ROW EXECUTE FUNCTION add_wine_history_event();

-- 6. Créer une vue pour faciliter les requêtes d'historique
CREATE OR REPLACE VIEW user_wine_history AS
SELECT 
  wh.id,
  wh.user_id,
  wh.wine_id,
  wh.event_type,
  wh.event_date,
  wh.previous_amount,
  wh.new_amount,
  wh.rating,
  wh.notes,
  w.name as wine_name,
  w.year as vintage,
  w.wine_type as color,
  w.region,
  p.name as producer_name
FROM wine_history wh
JOIN wine w ON wh.wine_id = w.id
JOIN producer p ON w.producer_id = p.id
ORDER BY wh.event_date DESC;

-- 7. Créer une fonction pour obtenir l'historique d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_wine_history(user_uuid UUID)
RETURNS TABLE (
  wine_id UUID,
  wine_name TEXT,
  vintage INTEGER,
  color TEXT,
  region TEXT,
  producer_name TEXT,
  event_type TEXT,
  event_date TIMESTAMP WITH TIME ZONE,
  previous_amount INTEGER,
  new_amount INTEGER,
  rating INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wh.wine_id,
    wh.wine_name,
    wh.vintage,
    wh.color,
    wh.region,
    wh.producer_name,
    wh.event_type,
    wh.event_date,
    wh.previous_amount,
    wh.new_amount,
    wh.rating
  FROM user_wine_history wh
  WHERE wh.user_id = user_uuid
  ORDER BY wh.event_date DESC;
END;
$$ LANGUAGE plpgsql;

-- 8. Ajouter des données de test pour l'historique (optionnel)
-- Insérer quelques événements d'historique pour les vins existants
INSERT INTO wine_history (user_id, wine_id, event_type, new_amount, rating, event_date)
SELECT 
  uw.user_id,
  uw.wine_id,
  'added',
  uw.amount,
  uw.rating,
  uw.created_at
FROM user_wine uw
WHERE uw.user_id = '27fd73b1-7088-4211-af88-3d075851f0db'
ON CONFLICT DO NOTHING;

-- 9. Vérifier la structure créée
SELECT 
  'Structure créée' as check_type,
  (SELECT COUNT(*) FROM wine_history) as history_count,
  (SELECT COUNT(*) FROM user_wine_history) as view_count;

-- 10. Exemple d'utilisation de la fonction
-- SELECT * FROM get_user_wine_history('27fd73b1-7088-4211-af88-3d075851f0db'); 