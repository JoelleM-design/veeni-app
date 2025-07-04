-- Script pour supprimer tous les vins et nettoyer la base de données
-- ATTENTION: Ce script supprime TOUS les vins de TOUS les utilisateurs

-- Supprimer tous les vins de la table user_wine (liaison utilisateur-vin)
DELETE FROM user_wine;

-- Supprimer tous les vins de la table wine
DELETE FROM wine;

-- Réinitialiser les séquences si elles existent
-- (PostgreSQL utilise des UUIDs, donc pas de séquences à réinitialiser)

-- Vérifier que les tables sont vides
SELECT 'user_wine count:' as table_name, COUNT(*) as count FROM user_wine
UNION ALL
SELECT 'wine count:' as table_name, COUNT(*) as count FROM wine;

-- Message de confirmation
SELECT 'Tous les vins ont été supprimés avec succès' as message; 