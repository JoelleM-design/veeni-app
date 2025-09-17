-- Ajouter la colonne avatar à la table User
ALTER TABLE public."User" 
ADD COLUMN avatar text;

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN public."User".avatar IS 'URI de la photo de profil de l''utilisateur'; 