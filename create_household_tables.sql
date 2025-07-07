-- =====================================================
-- CRÉATION DES TABLES POUR LA CAVE PARTAGÉE
-- Étape 1 : Nouvelles tables sans toucher à l'existant
-- =====================================================

-- =====================================================
-- 1. TABLE HOUSEHOLDS
-- =====================================================

CREATE TABLE public.households (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text,
  join_code text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT households_pkey PRIMARY KEY (id)
);

-- =====================================================
-- 2. TABLE USER_HOUSEHOLD
-- =====================================================

CREATE TABLE public.user_household (
  user_id uuid NOT NULL,
  household_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT user_household_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_household_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."User"(id) ON DELETE CASCADE,
  CONSTRAINT user_household_household_id_fkey FOREIGN KEY (household_id) REFERENCES public.households(id) ON DELETE CASCADE
);

-- =====================================================
-- 3. INDEXES POUR LES PERFORMANCES
-- =====================================================

CREATE INDEX idx_households_join_code ON public.households(join_code);
CREATE INDEX idx_user_household_user_id ON public.user_household(user_id);
CREATE INDEX idx_user_household_household_id ON public.user_household(household_id);

-- =====================================================
-- 4. CONTRAINTES DE VALIDATION
-- =====================================================

-- Contrainte pour s'assurer qu'un utilisateur n'appartient qu'à une seule household
-- (déjà géré par la clé primaire sur user_id)

-- =====================================================
-- 5. POLICIES RLS (Row Level Security)
-- =====================================================

-- Activer RLS sur les nouvelles tables
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_household ENABLE ROW LEVEL SECURITY;

-- Policies pour households
CREATE POLICY "Users can view their own household" ON public.households FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_household 
    WHERE user_household.household_id = households.id 
    AND user_household.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own household" ON public.households FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.user_household 
    WHERE user_household.household_id = households.id 
    AND user_household.user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can create households" ON public.households FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policies pour user_household
CREATE POLICY "Users can view their own household membership" ON public.user_household FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own household membership" ON public.user_household FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- 6. FONCTIONS ET TRIGGERS
-- =====================================================

-- Fonction pour générer un join_code unique
CREATE OR REPLACE FUNCTION generate_join_code()
RETURNS text AS $$
DECLARE
  code text;
  counter integer := 0;
BEGIN
  LOOP
    -- Générer un code de 6 caractères (lettres majuscules et chiffres)
    code := upper(substring(md5(random()::text) from 1 for 6));
    
    -- Vérifier que le code n'existe pas déjà
    IF NOT EXISTS (SELECT 1 FROM public.households WHERE join_code = code) THEN
      RETURN code;
    END IF;
    
    counter := counter + 1;
    -- Éviter une boucle infinie
    IF counter > 100 THEN
      RAISE EXCEPTION 'Impossible de générer un code unique après 100 tentatives';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_households_updated_at 
  BEFORE UPDATE ON public.households 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. VÉRIFICATION DE LA CRÉATION
-- =====================================================

-- Vérifier que les tables ont été créées
SELECT 'Tables créées avec succès' as status;

-- Afficher la structure des nouvelles tables
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('households', 'user_household')
ORDER BY table_name, ordinal_position; 