-- Supprimer la table User si elle existe (ATTENTION: cela supprimera toutes les données)
DROP TABLE IF EXISTS public."User" CASCADE;

-- Recréer la table User avec la structure correcte
CREATE TABLE public."User" (
  id uuid NOT NULL,
  first_name text NOT NULL,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  avatar text,
  avatar_initial text,
  onboarding_complete boolean DEFAULT false,
  has_notifications_active boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "User_pkey" PRIMARY KEY (id),
  CONSTRAINT "User_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id)
);

-- Ajouter des commentaires pour documenter
COMMENT ON TABLE public."User" IS 'Table des utilisateurs de l''application Veeni';
COMMENT ON COLUMN public."User".avatar IS 'URI de la photo de profil de l''utilisateur';
COMMENT ON COLUMN public."User".avatar_initial IS 'Initiales de l''utilisateur pour l''avatar par défaut';

-- Créer un index sur l'email pour les performances
CREATE INDEX idx_user_email ON public."User"(email);

-- Activer RLS (Row Level Security)
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour que les utilisateurs ne voient que leurs propres données
CREATE POLICY "Users can view own profile" ON public."User"
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public."User"
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public."User"
  FOR INSERT WITH CHECK (auth.uid() = id); 