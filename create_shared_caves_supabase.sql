-- Script pour créer la table shared_caves dans Supabase
-- À exécuter dans l'interface SQL de Supabase

-- Création de la table shared_caves
CREATE TABLE IF NOT EXISTS public.shared_caves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    invite_code VARCHAR(6) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_shared_caves_owner_id ON public.shared_caves(owner_id);
CREATE INDEX IF NOT EXISTS idx_shared_caves_partner_id ON public.shared_caves(partner_id);
CREATE INDEX IF NOT EXISTS idx_shared_caves_invite_code ON public.shared_caves(invite_code);

-- Contrainte pour s'assurer qu'un utilisateur ne peut être que owner OU partner, pas les deux
ALTER TABLE public.shared_caves ADD CONSTRAINT check_owner_not_partner CHECK (owner_id != partner_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.update_shared_caves_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_shared_caves_updated_at
    BEFORE UPDATE ON public.shared_caves
    FOR EACH ROW
    EXECUTE FUNCTION public.update_shared_caves_updated_at();

-- Fonction pour générer un code d'invitation unique
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS VARCHAR(6) AS $$
DECLARE
    code VARCHAR(6);
    exists BOOLEAN;
BEGIN
    LOOP
        -- Générer un code de 6 caractères alphanumériques
        code := upper(substring(md5(random()::text) from 1 for 6));
        
        -- Vérifier si le code existe déjà
        SELECT EXISTS(SELECT 1 FROM public.shared_caves WHERE invite_code = code) INTO exists;
        
        -- Si le code n'existe pas, on peut l'utiliser
        IF NOT exists THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Politique RLS (Row Level Security)
ALTER TABLE public.shared_caves ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs de voir les caves où ils sont owner ou partner
CREATE POLICY "Users can view their shared caves" ON public.shared_caves
    FOR SELECT USING (
        auth.uid() = owner_id OR auth.uid() = partner_id
    );

-- Politique pour permettre aux utilisateurs de créer des caves partagées
CREATE POLICY "Users can create shared caves" ON public.shared_caves
    FOR INSERT WITH CHECK (
        auth.uid() = owner_id
    );

-- Politique pour permettre aux propriétaires de mettre à jour leurs caves
CREATE POLICY "Owners can update their shared caves" ON public.shared_caves
    FOR UPDATE USING (
        auth.uid() = owner_id
    );

-- Politique pour permettre aux propriétaires de supprimer leurs caves
CREATE POLICY "Owners can delete their shared caves" ON public.shared_caves
    FOR DELETE USING (
        auth.uid() = owner_id
    );

-- Politique pour permettre aux partenaires de quitter une cave (mettre à jour partner_id à null)
CREATE POLICY "Partners can leave shared caves" ON public.shared_caves
    FOR UPDATE USING (
        auth.uid() = partner_id
    );

-- Politique pour permettre de rejoindre une cave avec un code d'invitation
CREATE POLICY "Anyone can view caves by invite code" ON public.shared_caves
    FOR SELECT USING (true); 