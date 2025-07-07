-- Script pour corriger la structure de la table shared_caves
-- Remplacer les références à auth.users par User

-- 1. Supprimer les contraintes existantes
ALTER TABLE shared_caves DROP CONSTRAINT IF EXISTS shared_caves_owner_id_fkey;
ALTER TABLE shared_caves DROP CONSTRAINT IF EXISTS shared_caves_partner_id_fkey;

-- 2. Ajouter les nouvelles contraintes avec la table User
ALTER TABLE shared_caves 
ADD CONSTRAINT shared_caves_owner_id_fkey 
FOREIGN KEY (owner_id) REFERENCES "User"(id) ON DELETE CASCADE;

ALTER TABLE shared_caves 
ADD CONSTRAINT shared_caves_partner_id_fkey 
FOREIGN KEY (partner_id) REFERENCES "User"(id) ON DELETE CASCADE;

-- 3. Vérifier que la table existe et a la bonne structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'shared_caves' 
ORDER BY ordinal_position;

-- 4. Vérifier les contraintes
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'shared_caves' 
AND tc.constraint_type = 'FOREIGN KEY'; 