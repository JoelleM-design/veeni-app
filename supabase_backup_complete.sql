-- =====================================================
-- SAUVEGARDE COMPLÈTE VEENI - BASE DE DONNÉES SUPABASE
-- Date: $(date)
-- Description: Sauvegarde complète avant implémentation cave partagée
-- Structure réelle de la base
-- =====================================================

-- Désactiver les triggers temporairement pour éviter les conflits
SET session_replication_role = replica;

-- =====================================================
-- 1. TABLE USER (Structure + Données)
-- =====================================================

-- Supprimer la table si elle existe (pour restauration propre)
DROP TABLE IF EXISTS "User" CASCADE;

-- Recréer la table User
CREATE TABLE public."User" (
  onboarding_complete boolean DEFAULT false,
  id uuid NOT NULL,
  has_notifications_active boolean DEFAULT false,
  first_name text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  email text NOT NULL UNIQUE,
  avatar_initial text,
  CONSTRAINT User_pkey PRIMARY KEY (id),
  CONSTRAINT User_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

-- Insérer les données existantes (à remplacer par tes vraies données)
INSERT INTO public."User" (id, first_name, email, onboarding_complete, has_notifications_active, avatar_initial, created_at) VALUES
('27fd73b1-7088-4211-af88-3d075851f0db', 'Joëlle', 'joelle@example.com', true, true, 'JM', '2025-01-01T00:00:00Z');

-- =====================================================
-- 2. TABLE WINE (Structure + Données)
-- =====================================================

DROP TABLE IF EXISTS wine CASCADE;

CREATE TABLE public.wine (
  grapes text[],
  name text NOT NULL,
  year text,
  wine_type text CHECK (wine_type = ANY (ARRAY['red'::text, 'white'::text, 'rose'::text, 'sparkling'::text])),
  price_range text,
  region text,
  description text,
  strength integer,
  tannins integer,
  sugar integer,
  acidity integer,
  optimal_conso_date date,
  image_uri text,
  producer_id uuid,
  country_id uuid,
  designation_id uuid,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT wine_pkey PRIMARY KEY (id),
  CONSTRAINT wine_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.country(id),
  CONSTRAINT wine_producer_id_fkey FOREIGN KEY (producer_id) REFERENCES public.producer(id),
  CONSTRAINT wine_designation_id_fkey FOREIGN KEY (designation_id) REFERENCES public.designation(id)
);

-- Insérer les données existantes
INSERT INTO public.wine (id, name, year, wine_type, region, country_id, producer_id, designation_id, description, image_uri, acidity, tannins, strength, sugar, optimal_conso_date, price_range, grapes, created_at) VALUES
('44444444-4444-4444-8444-444444444444', 'Les Roches Blanches', '2024', 'white', '', NULL, 'b6dbe57d-743d-45e8-8878-ca0b96b37766', NULL, NULL, 'file:///var/mobile/Containers/Data/Application/231019E2-83BD-4A70-9DA7-E633AFF0D2C3/Library/Caches/ExponentExperienceData/@anonymous/veeni-app-6e0b3a85-b45d-4a25-8e78-95cf589700b2/Camera/E6624588-A8CF-486C-88A3-047BCC4F92E7.jpg', NULL, NULL, NULL, NULL, NULL, NULL, ARRAY['Sauvignon Blanc'], '2025-07-02T15:26:46.567445+00:00'),
('bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', 'LES SALINES', '2024', 'red', '', NULL, 'b2d03c65-59f0-45ec-b572-c6ae55c883cd', NULL, NULL, 'file:///var/mobile/Containers/Data/Application/231019E2-83BD-4A70-9DA7-E633AFF0D2C3/Library/Caches/ExponentExperienceData/@anonymous/veeni-app-6e0b3a85-b45d-4a25-8e78-95cf589700b2/Camera/F838FD14-674E-4498-9A61-4A958F453909.jpg', NULL, NULL, NULL, NULL, NULL, NULL, ARRAY[], '2025-07-03T14:39:08.386291+00:00'),
('22222222-2222-4222-a222-222222222222', 'Cibolo', NULL, 'red', 'Jumilla', 'bcce2163-f027-4794-b4ab-607b8edf5934', NULL, NULL, NULL, 'file:///var/mobile/Containers/Data/Application/231019E2-83BD-4A70-9DA7-E633AFF0D2C3/Library/Caches/ExponentExperienceData/@anonymous/veeni-app-6e0b3a85-b45d-4a25-8e78-95cf589700b2/Camera/F61B17AC-E0D2-41C1-8847-E25ADF9BA98C.jpg', NULL, NULL, NULL, NULL, NULL, NULL, ARRAY['Monastrell'], '2025-07-03T14:39:12.48267+00:00');

-- =====================================================
-- 3. TABLE USER_WINE (Structure + Données)
-- =====================================================

DROP TABLE IF EXISTS user_wine CASCADE;

CREATE TABLE public.user_wine (
  origin character varying DEFAULT 'cellar'::character varying CHECK (origin::text = ANY (ARRAY['cellar'::character varying, 'wishlist'::character varying]::text[])),
  user_id uuid NOT NULL,
  wine_id uuid NOT NULL,
  rating integer,
  personal_comment text,
  amount integer DEFAULT 1,
  liked boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  history jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT user_wine_pkey PRIMARY KEY (user_id, wine_id),
  CONSTRAINT user_wine_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."User"(id),
  CONSTRAINT user_wine_wine_id_fkey FOREIGN KEY (wine_id) REFERENCES public.wine(id)
);

-- Insérer les données existantes
INSERT INTO public.user_wine (user_id, wine_id, amount, liked, rating, personal_comment, origin, history, created_at, updated_at) VALUES
('27fd73b1-7088-4211-af88-3d075851f0db', '44444444-4444-4444-8444-444444444444', 1, true, NULL, NULL, 'cellar', '[]', '2025-07-02T15:26:46.645655+00:00', '2025-07-02T15:26:46.645655+00:00'),
('27fd73b1-7088-4211-af88-3d075851f0db', 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb', 0, false, NULL, NULL, 'wishlist', '[]', '2025-07-03T14:39:08.443676+00:00', '2025-07-03T14:39:08.443676+00:00'),
('27fd73b1-7088-4211-af88-3d075851f0db', '22222222-2222-4222-a222-222222222222', 1, false, NULL, NULL, 'cellar', '[]', '2025-07-03T14:39:12.623272+00:00', '2025-07-03T14:39:12.623272+00:00');

-- =====================================================
-- 4. TABLE PRODUCER (Structure + Données)
-- =====================================================

DROP TABLE IF EXISTS producer CASCADE;

CREATE TABLE public.producer (
  name text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT producer_pkey PRIMARY KEY (id)
);

-- Insérer les données existantes
INSERT INTO public.producer (id, name) VALUES
('b6dbe57d-743d-45e8-8878-ca0b96b37766', 'Château Roquefort'),
('b2d03c65-59f0-45ec-b572-c6ae55c883cd', 'JOMAINE ARICI');

-- =====================================================
-- 5. TABLE COUNTRY (Structure + Données)
-- =====================================================

DROP TABLE IF EXISTS country CASCADE;

CREATE TABLE public.country (
  name text NOT NULL,
  flag_emoji text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT country_pkey PRIMARY KEY (id)
);

-- Insérer les données existantes
INSERT INTO public.country (id, name, flag_emoji) VALUES
('bcce2163-f027-4794-b4ab-607b8edf5934', 'Espagne', '🇪🇸');

-- =====================================================
-- 6. TABLE DESIGNATION (Structure + Données)
-- =====================================================

DROP TABLE IF EXISTS designation CASCADE;

CREATE TABLE public.designation (
  name text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT designation_pkey PRIMARY KEY (id)
);

-- =====================================================
-- 7. TABLE GRAPE_VARIETY (Structure + Données)
-- =====================================================

DROP TABLE IF EXISTS grape_variety CASCADE;

CREATE TABLE public.grape_variety (
  name text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT grape_variety_pkey PRIMARY KEY (id)
);

-- =====================================================
-- 8. TABLE GRAPES_WINE (Structure + Données)
-- =====================================================

DROP TABLE IF EXISTS grapes_wine CASCADE;

CREATE TABLE public.grapes_wine (
  wine_id uuid NOT NULL,
  grape_variety_id uuid NOT NULL,
  CONSTRAINT grapes_wine_pkey PRIMARY KEY (wine_id, grape_variety_id),
  CONSTRAINT grapes_wine_wine_id_fkey FOREIGN KEY (wine_id) REFERENCES public.wine(id),
  CONSTRAINT grapes_wine_grape_variety_id_fkey FOREIGN KEY (grape_variety_id) REFERENCES public.grape_variety(id)
);

-- =====================================================
-- 9. TABLE FRIEND (Structure + Données)
-- =====================================================

DROP TABLE IF EXISTS friend CASCADE;

CREATE TABLE public.friend (
  user_id uuid NOT NULL,
  friend_id uuid NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'blocked'::text])),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT friend_pkey PRIMARY KEY (user_id, friend_id),
  CONSTRAINT friend_friend_id_fkey FOREIGN KEY (friend_id) REFERENCES public."User"(id),
  CONSTRAINT friend_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."User"(id)
);

-- =====================================================
-- 10. TABLE WINE_HISTORY (Structure + Données)
-- =====================================================

DROP TABLE IF EXISTS wine_history CASCADE;

CREATE TABLE public.wine_history (
  user_id uuid NOT NULL,
  wine_id uuid NOT NULL,
  event_type character varying NOT NULL CHECK (event_type::text = ANY (ARRAY['added'::character varying, 'tasted'::character varying, 'stock_change'::character varying, 'removed'::character varying, 'noted'::character varying, 'favorited'::character varying]::text[])),
  previous_amount integer,
  new_amount integer,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  notes text,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_date timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT wine_history_pkey PRIMARY KEY (id),
  CONSTRAINT wine_history_wine_id_fkey FOREIGN KEY (wine_id) REFERENCES public.wine(id),
  CONSTRAINT wine_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."User"(id)
);

-- =====================================================
-- 11. TABLE OCR_LOGS (Structure + Données)
-- =====================================================

DROP TABLE IF EXISTS ocr_logs CASCADE;

CREATE TABLE public.ocr_logs (
  user_id uuid,
  image_count integer,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ocr_logs_pkey PRIMARY KEY (id),
  CONSTRAINT ocr_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- =====================================================
-- 12. INDEXES ET CONTRAINTES
-- =====================================================

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_user_wine_user_id ON user_wine(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wine_wine_id ON user_wine(wine_id);
CREATE INDEX IF NOT EXISTS idx_wine_producer_id ON wine(producer_id);
CREATE INDEX IF NOT EXISTS idx_wine_country_id ON wine(country_id);
CREATE INDEX IF NOT EXISTS idx_ocr_logs_user_id ON ocr_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_wine_history_user_id ON wine_history(user_id);
CREATE INDEX IF NOT EXISTS idx_wine_history_wine_id ON wine_history(wine_id);
CREATE INDEX IF NOT EXISTS idx_friend_user_id ON friend(user_id);
CREATE INDEX IF NOT EXISTS idx_friend_friend_id ON friend(friend_id);

-- =====================================================
-- 13. POLICIES RLS (Row Level Security)
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wine ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wine ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producer ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.country ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grape_variety ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grapes_wine ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wine_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocr_logs ENABLE ROW LEVEL SECURITY;

-- Policies pour User
CREATE POLICY "Users can view their own profile" ON public."User" FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public."User" FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public."User" FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies pour user_wine
CREATE POLICY "Users can view their own wines" ON public.user_wine FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own wines" ON public.user_wine FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own wines" ON public.user_wine FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own wines" ON public.user_wine FOR DELETE USING (auth.uid() = user_id);

-- Policies pour wine (lecture publique)
CREATE POLICY "Anyone can view wines" ON public.wine FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert wines" ON public.wine FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update wines" ON public.wine FOR UPDATE USING (auth.role() = 'authenticated');

-- Policies pour friend
CREATE POLICY "Users can view their own friends" ON public.friend FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can manage their own friends" ON public.friend FOR ALL USING (auth.uid() = user_id);

-- Policies pour wine_history
CREATE POLICY "Users can view their own wine history" ON public.wine_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own wine history" ON public.wine_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies pour ocr_logs
CREATE POLICY "Users can view their own OCR logs" ON public.ocr_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own OCR logs" ON public.ocr_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 14. FONCTIONS ET TRIGGERS
-- =====================================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_user_wine_updated_at BEFORE UPDATE ON public.user_wine FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 15. RÉACTIVATION DES TRIGGERS
-- =====================================================

SET session_replication_role = DEFAULT;

-- =====================================================
-- FIN DE LA SAUVEGARDE
-- =====================================================

-- Vérification des données restaurées
SELECT 'User count:' as info, COUNT(*) as count FROM public."User"
UNION ALL
SELECT 'Wine count:', COUNT(*) FROM public.wine
UNION ALL
SELECT 'User wine count:', COUNT(*) FROM public.user_wine
UNION ALL
SELECT 'Producer count:', COUNT(*) FROM public.producer
UNION ALL
SELECT 'Country count:', COUNT(*) FROM public.country
UNION ALL
SELECT 'Designation count:', COUNT(*) FROM public.designation
UNION ALL
SELECT 'Grape variety count:', COUNT(*) FROM public.grape_variety
UNION ALL
SELECT 'Friend count:', COUNT(*) FROM public.friend
UNION ALL
SELECT 'Wine history count:', COUNT(*) FROM public.wine_history
UNION ALL
SELECT 'OCR logs count:', COUNT(*) FROM public.ocr_logs; 