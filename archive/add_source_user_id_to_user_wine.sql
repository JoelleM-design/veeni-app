-- Ajout colonne sociale pour wishlist: source_user_id
-- Référence la table publique "User" (id)

ALTER TABLE public.user_wine
ADD COLUMN IF NOT EXISTS source_user_id uuid NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_wine_source_user_id_fkey'
  ) THEN
    ALTER TABLE public.user_wine
    ADD CONSTRAINT user_wine_source_user_id_fkey
    FOREIGN KEY (source_user_id) REFERENCES public."User"(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Index pour filtres/joins sociaux
CREATE INDEX IF NOT EXISTS idx_user_wine_source_user_id ON public.user_wine(source_user_id);

-- (Optionnel) Mettre à jour RLS si besoin (lecture) – supposé déjà couvert par policies existantes
-- Exemple:
-- CREATE POLICY "read user_wine with source"
--   ON public.user_wine FOR SELECT USING (auth.uid() = user_id OR source_user_id IS NOT NULL);

