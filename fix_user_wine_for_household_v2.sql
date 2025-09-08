-- Script pour adapter user_wine au modèle household correct (Version 2)
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Ajouter la colonne household_id à user_wine
ALTER TABLE user_wine 
ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES public.households(id) ON DELETE CASCADE;

-- 2. Créer un index pour household_id
CREATE INDEX IF NOT EXISTS idx_user_wine_household_id ON user_wine(household_id);

-- 3. Ajouter household_id à wine_history
ALTER TABLE wine_history 
ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES public.households(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_wine_history_household_id ON wine_history(household_id);

-- 4. Supprimer l'ancienne clé primaire AVANT de modifier user_id
ALTER TABLE user_wine DROP CONSTRAINT IF EXISTS user_wine_pkey;

-- 5. Modifier user_id pour le rendre nullable AVANT la migration
ALTER TABLE user_wine 
ALTER COLUMN user_id DROP NOT NULL;

-- 6. Modifier user_id pour le rendre nullable dans wine_history aussi
ALTER TABLE wine_history 
ALTER COLUMN user_id DROP NOT NULL;

-- 7. Créer des households pour tous les utilisateurs existants
INSERT INTO public.households (id, name, join_code, created_at, updated_at)
SELECT 
  gen_random_uuid() as id,
  COALESCE(u.first_name || '''s Cave', 'Cave de ' || u.email) as name,
  upper(substring(md5(random()::text) from 1 for 6)) as join_code,
  now() as created_at,
  now() as updated_at
FROM public."User" u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_household uh 
  WHERE uh.user_id = u.id
);

-- 8. Associer chaque utilisateur à sa household
INSERT INTO public.user_household (user_id, household_id, created_at)
SELECT 
  u.id as user_id,
  h.id as household_id,
  now() as created_at
FROM public."User" u
JOIN public.households h ON h.name LIKE '%' || u.first_name || '%' OR h.name LIKE '%' || u.email || '%'
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_household uh 
  WHERE uh.user_id = u.id
);

-- 9. Créer une table temporaire avec les mappings user -> household
CREATE TEMP TABLE user_household_mapping AS
SELECT 
  u.id as user_id,
  uh.household_id
FROM public."User" u
JOIN public.user_household uh ON u.id = uh.user_id;

-- 10. Mettre à jour user_wine pour utiliser household_id au lieu de user_id
UPDATE public.user_wine 
SET 
  household_id = uhm.household_id,
  user_id = NULL
FROM user_household_mapping uhm
WHERE user_wine.user_id = uhm.user_id;

-- 11. Mettre à jour wine_history
UPDATE public.wine_history 
SET 
  household_id = uhm.household_id,
  user_id = NULL
FROM user_household_mapping uhm
WHERE wine_history.user_id = uhm.user_id;

-- 12. Nettoyer la table temporaire
DROP TABLE user_household_mapping;

-- 13. Ajouter les contraintes de validation
ALTER TABLE user_wine 
ADD CONSTRAINT check_user_or_household 
CHECK (
  (user_id IS NOT NULL AND household_id IS NULL) OR 
  (user_id IS NULL AND household_id IS NOT NULL)
);

ALTER TABLE wine_history 
ADD CONSTRAINT check_wine_history_user_or_household 
CHECK (
  (user_id IS NOT NULL AND household_id IS NULL) OR 
  (user_id IS NULL AND household_id IS NOT NULL)
);

-- 14. Créer une nouvelle clé primaire basée sur wine_id + une colonne unique
-- Utiliser un identifiant unique pour chaque ligne
ALTER TABLE user_wine 
ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

-- Mettre à jour les IDs existants s'ils sont NULL
UPDATE user_wine SET id = gen_random_uuid() WHERE id IS NULL;

-- Rendre la colonne id NOT NULL
ALTER TABLE user_wine ALTER COLUMN id SET NOT NULL;

-- Créer la nouvelle clé primaire
ALTER TABLE user_wine 
ADD CONSTRAINT user_wine_pkey PRIMARY KEY (id);

-- 15. Mettre à jour les politiques RLS pour supporter household_id
DROP POLICY IF EXISTS "Users can view their own wines" ON public.user_wine;
CREATE POLICY "Users can view their own wines" ON public.user_wine FOR SELECT USING (
  -- Vins personnels
  (user_id = auth.uid() AND household_id IS NULL) OR
  -- Vins de household (si l'utilisateur est membre)
  (household_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_household 
    WHERE user_household.household_id = user_wine.household_id 
    AND user_household.user_id = auth.uid()
  ))
);

DROP POLICY IF EXISTS "Users can insert their own wines" ON public.user_wine;
CREATE POLICY "Users can insert their own wines" ON public.user_wine FOR INSERT WITH CHECK (
  -- Vins personnels
  (user_id = auth.uid() AND household_id IS NULL) OR
  -- Vins de household (si l'utilisateur est membre)
  (household_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_household 
    WHERE user_household.household_id = user_wine.household_id 
    AND user_household.user_id = auth.uid()
  ))
);

DROP POLICY IF EXISTS "Users can update their own wines" ON public.user_wine;
CREATE POLICY "Users can update their own wines" ON public.user_wine FOR UPDATE USING (
  -- Vins personnels
  (user_id = auth.uid() AND household_id IS NULL) OR
  -- Vins de household (si l'utilisateur est membre)
  (household_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_household 
    WHERE user_household.household_id = user_wine.household_id 
    AND user_household.user_id = auth.uid()
  ))
);

DROP POLICY IF EXISTS "Users can delete their own wines" ON public.user_wine;
CREATE POLICY "Users can delete their own wines" ON public.user_wine FOR DELETE USING (
  -- Vins personnels
  (user_id = auth.uid() AND household_id IS NULL) OR
  -- Vins de household (si l'utilisateur est membre)
  (household_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_household 
    WHERE user_household.household_id = user_wine.household_id 
    AND user_household.user_id = auth.uid()
  ))
);

-- 16. Mettre à jour les politiques RLS pour wine_history
DROP POLICY IF EXISTS "Users can view their own wine history" ON public.wine_history;
CREATE POLICY "Users can view their own wine history" ON public.wine_history FOR SELECT USING (
  -- Historique personnel
  (user_id = auth.uid() AND household_id IS NULL) OR
  -- Historique de household (si l'utilisateur est membre)
  (household_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_household 
    WHERE user_household.household_id = wine_history.household_id 
    AND user_household.user_id = auth.uid()
  ))
);

DROP POLICY IF EXISTS "Users can insert their own wine history" ON public.wine_history;
CREATE POLICY "Users can insert their own wine history" ON public.wine_history FOR INSERT WITH CHECK (
  -- Historique personnel
  (user_id = auth.uid() AND household_id IS NULL) OR
  -- Historique de household (si l'utilisateur est membre)
  (household_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_household 
    WHERE user_household.household_id = wine_history.household_id 
    AND user_household.user_id = auth.uid()
  ))
);

-- 17. Vérifier la structure mise à jour
SELECT 
  'Structure user_wine mise à jour' as check_type,
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_wine' 
ORDER BY ordinal_position;

-- 18. Vérifier les contraintes
SELECT 
  'Contraintes user_wine' as check_type,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'user_wine' 
AND table_schema = 'public';

-- 19. Vérifier la migration des données
SELECT 
  'Vérification migration user_wine' as check_type,
  COUNT(*) as total_wines,
  COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as personal_wines,
  COUNT(CASE WHEN household_id IS NOT NULL THEN 1 END) as household_wines
FROM public.user_wine;

SELECT 
  'Vérification migration wine_history' as check_type,
  COUNT(*) as total_events,
  COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as personal_events,
  COUNT(CASE WHEN household_id IS NOT NULL THEN 1 END) as household_events
FROM public.wine_history;
