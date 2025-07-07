-- Script pour ajouter les politiques RLS (Row Level Security) pour la table shared_caves
-- À exécuter dans l'interface SQL de Supabase

-- 1. Activer RLS sur la table shared_caves
ALTER TABLE public.shared_caves ENABLE ROW LEVEL SECURITY;

-- 2. Politique pour permettre aux utilisateurs de voir leur propre cave partagée
CREATE POLICY "Users can view their own shared cave" ON public.shared_caves
FOR SELECT USING (
  auth.uid() = owner_id OR auth.uid() = partner_id
);

-- 3. Politique pour permettre aux utilisateurs de créer leur propre cave partagée
CREATE POLICY "Users can create their own shared cave" ON public.shared_caves
FOR INSERT WITH CHECK (
  auth.uid() = owner_id
);

-- 4. Politique pour permettre aux propriétaires de mettre à jour leur cave partagée
CREATE POLICY "Owners can update their shared cave" ON public.shared_caves
FOR UPDATE USING (
  auth.uid() = owner_id
);

-- 5. Politique pour permettre aux propriétaires de supprimer leur cave partagée
CREATE POLICY "Owners can delete their shared cave" ON public.shared_caves
FOR DELETE USING (
  auth.uid() = owner_id
);

-- 6. Politique pour permettre aux partenaires de quitter une cave partagée (mettre à jour partner_id à null)
CREATE POLICY "Partners can leave shared cave" ON public.shared_caves
FOR UPDATE USING (
  auth.uid() = partner_id
) WITH CHECK (
  auth.uid() = partner_id AND partner_id IS NULL
);

-- Vérification des politiques créées
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'shared_caves'; 