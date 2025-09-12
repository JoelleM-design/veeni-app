-- Ajout de la colonne tasting_profile à user_wine
-- Type: JSONB | Contenu attendu: { power, tannin, acidity, sweetness }

BEGIN;

ALTER TABLE public.user_wine
ADD COLUMN IF NOT EXISTS tasting_profile jsonb;

COMMENT ON COLUMN public.user_wine.tasting_profile IS 'Profil de dégustation (power, tannin, acidity, sweetness)';

-- Valeur par défaut pour les lignes existantes (évite les nulls)
UPDATE public.user_wine
SET tasting_profile = COALESCE(
  tasting_profile,
  '{"power":0,"tannin":0,"acidity":0,"sweetness":0}'::jsonb
);

-- Recharger le cache de schéma PostgREST pour exposer la colonne immédiatement
NOTIFY pgrst, 'reload schema';

COMMIT;

-- Ajouter la colonne tasting_profile à la table user_wine
ALTER TABLE user_wine 
ADD COLUMN tasting_profile JSONB DEFAULT '{"acidity": 0, "power": 0, "sweetness": 0, "tannin": 0}'::jsonb;

-- Mettre à jour les enregistrements existants avec un profil par défaut
UPDATE user_wine 
SET tasting_profile = '{"acidity": 0, "power": 0, "sweetness": 0, "tannin": 0}'::jsonb 
WHERE tasting_profile IS NULL;

-- Vérifier que la colonne a été ajoutée
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_wine' 
ORDER BY ordinal_position;