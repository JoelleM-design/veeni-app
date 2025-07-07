-- Script pour vérifier l'amitié entre Julien et Joëlle
-- À exécuter dans l'éditeur SQL de Supabase

-- Vérifier si l'amitié existe
SELECT 
    f.user_id,
    u1.first_name as user_name,
    u1.email as user_email,
    f.friend_id,
    u2.first_name as friend_name,
    u2.email as friend_email,
    f.status,
    f.created_at
FROM friend f
JOIN "User" u1 ON f.user_id = u1.id
JOIN "User" u2 ON f.friend_id = u2.id
WHERE (u1.email = 'nyc.jul@gmail.com' AND u2.email = 'wspt.joelle@gmail.com')
   OR (u1.email = 'wspt.joelle@gmail.com' AND u2.email = 'nyc.jul@gmail.com')
ORDER BY f.created_at DESC;

-- Vérifier tous les amis de Joëlle
SELECT 
    'Amis de Joëlle' as info,
    f.user_id,
    u1.first_name as user_name,
    u1.email as user_email,
    f.friend_id,
    u2.first_name as friend_name,
    u2.email as friend_email,
    f.status,
    f.created_at
FROM friend f
JOIN "User" u1 ON f.user_id = u1.id
JOIN "User" u2 ON f.friend_id = u2.id
WHERE u1.email = 'wspt.joelle@gmail.com'
ORDER BY f.created_at DESC;

-- Vérifier tous les amis de Julien
SELECT 
    'Amis de Julien' as info,
    f.user_id,
    u1.first_name as user_name,
    u1.email as user_email,
    f.friend_id,
    u2.first_name as friend_name,
    u2.email as friend_email,
    f.status,
    f.created_at
FROM friend f
JOIN "User" u1 ON f.user_id = u1.id
JOIN "User" u2 ON f.friend_id = u2.id
WHERE u1.email = 'nyc.jul@gmail.com'
ORDER BY f.created_at DESC; 