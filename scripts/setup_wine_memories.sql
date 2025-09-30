-- Création des tables pour les souvenirs de vin
-- Table principale des souvenirs
CREATE TABLE IF NOT EXISTS wine_memories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wine_id UUID NOT NULL REFERENCES wine(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    text TEXT,
    photo_urls TEXT[] DEFAULT '{}',
    friends_tagged UUID[] DEFAULT '{}',
    location_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des likes sur les souvenirs
CREATE TABLE IF NOT EXISTS wine_memory_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    memory_id UUID NOT NULL REFERENCES wine_memories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(memory_id, user_id)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_wine_memories_wine_id ON wine_memories(wine_id);
CREATE INDEX IF NOT EXISTS idx_wine_memories_user_id ON wine_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_wine_memory_likes_memory_id ON wine_memory_likes(memory_id);
CREATE INDEX IF NOT EXISTS idx_wine_memory_likes_user_id ON wine_memory_likes(user_id);

-- RLS (Row Level Security)
ALTER TABLE wine_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE wine_memory_likes ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour wine_memories
CREATE POLICY "Users can view memories of wines they have access to" ON wine_memories
    FOR SELECT USING (
        wine_id IN (
            SELECT uw.wine_id FROM user_wine uw 
            WHERE uw.user_id = auth.uid() OR uw.household_id IN (
                SELECT h.id FROM household h 
                WHERE h.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create memories for their wines" ON wine_memories
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        wine_id IN (
            SELECT uw.wine_id FROM user_wine uw 
            WHERE uw.user_id = auth.uid() OR uw.household_id IN (
                SELECT h.id FROM household h 
                WHERE h.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update their own memories" ON wine_memories
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own memories" ON wine_memories
    FOR DELETE USING (user_id = auth.uid());

-- Politiques RLS pour wine_memory_likes
CREATE POLICY "Users can view likes on accessible memories" ON wine_memory_likes
    FOR SELECT USING (
        memory_id IN (
            SELECT wm.id FROM wine_memories wm
            WHERE wm.wine_id IN (
                SELECT uw.wine_id FROM user_wine uw 
                WHERE uw.user_id = auth.uid() OR uw.household_id IN (
                    SELECT h.id FROM household h 
                    WHERE h.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can like accessible memories" ON wine_memory_likes
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        memory_id IN (
            SELECT wm.id FROM wine_memories wm
            WHERE wm.wine_id IN (
                SELECT uw.wine_id FROM user_wine uw 
                WHERE uw.user_id = auth.uid() OR uw.household_id IN (
                    SELECT h.id FROM household h 
                    WHERE h.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can unlike their own likes" ON wine_memory_likes
    FOR DELETE USING (user_id = auth.uid());

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour wine_memories
CREATE TRIGGER update_wine_memories_updated_at 
    BEFORE UPDATE ON wine_memories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Créer le bucket pour les images de souvenirs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('wine_memories_images', 'wine_memories_images', true)
ON CONFLICT (id) DO NOTHING;

-- Politique pour le bucket wine_memories_images
CREATE POLICY "Users can view wine memory images" ON storage.objects
    FOR SELECT USING (bucket_id = 'wine_memories_images');

CREATE POLICY "Users can upload wine memory images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'wine_memories_images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own wine memory images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'wine_memories_images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own wine memory images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'wine_memories_images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );


