-- Script SQL pour supprimer tous les souvenirs de vin
-- À exécuter directement dans l'éditeur SQL de Supabase

-- 1. Supprimer d'abord les likes pour éviter les problèmes de clés étrangères
DELETE FROM wine_memory_likes;

-- 2. Supprimer tous les souvenirs
DELETE FROM wine_memories;

-- 3. Vérifier que tout a été supprimé
SELECT COUNT(*) as remaining_memories FROM wine_memories;
SELECT COUNT(*) as remaining_likes FROM wine_memory_likes;
