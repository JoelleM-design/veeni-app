-- Création de la table shared_caves pour gérer les caves partagées (2 personnes max)
CREATE TABLE IF NOT EXISTS shared_caves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    invite_code VARCHAR(6) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_shared_caves_owner_id ON shared_caves(owner_id);
CREATE INDEX IF NOT EXISTS idx_shared_caves_partner_id ON shared_caves(partner_id);
CREATE INDEX IF NOT EXISTS idx_shared_caves_invite_code ON shared_caves(invite_code);

-- Contrainte pour s'assurer qu'un utilisateur ne peut être que owner OU partner, pas les deux
ALTER TABLE shared_caves ADD CONSTRAINT check_owner_not_partner CHECK (owner_id != partner_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_shared_caves_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_shared_caves_updated_at
    BEFORE UPDATE ON shared_caves
    FOR EACH ROW
    EXECUTE FUNCTION update_shared_caves_updated_at();

-- Fonction pour générer un code d'invitation unique
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS VARCHAR(6) AS $$
DECLARE
    code VARCHAR(6);
    exists BOOLEAN;
BEGIN
    LOOP
        -- Générer un code de 6 caractères alphanumériques
        code := upper(substring(md5(random()::text) from 1 for 6));
        
        -- Vérifier si le code existe déjà
        SELECT EXISTS(SELECT 1 FROM shared_caves WHERE invite_code = code) INTO exists;
        
        -- Si le code n'existe pas, on peut l'utiliser
        IF NOT exists THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql; 