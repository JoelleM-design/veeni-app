#!/usr/bin/env node

/**
 * Script pour supprimer tous les souvenirs de vin de la base de données
 * Utilise la clé service_role pour contourner les politiques RLS
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const SUPABASE_URL = "https://yzdyepdejftgqpnwitcq.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6ZHllcGRlamZ0Z3FwbndpdGNxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImiaWF0IjoxNzAwMDgwMDk5LCJleHAiOjIwNjU2NTYwOTl9.wGFjpAAoYtcLlk6o1_lgZb0EhX3NB9SoYQ_D1rOc2E0";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function clearAllMemories() {
  console.log('🧹 Suppression de tous les souvenirs de vin...');
  console.log('==============================================');

  try {
    // 1. D'abord, compter combien il y a de souvenirs
    console.log('\n1️⃣ Comptage des souvenirs existants...');
    const { count: memoriesCount, error: countError } = await supabase
      .from('wine_memories')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Erreur lors du comptage:', countError);
      return;
    }

    console.log(`📊 Nombre de souvenirs trouvés: ${memoriesCount || 0}`);

    if (memoriesCount === 0) {
      console.log('✅ Aucun souvenir à supprimer');
      return;
    }

    // 2. Supprimer d'abord les likes pour éviter les problèmes de clés étrangères
    console.log('\n2️⃣ Suppression des likes de souvenirs...');
    const { error: deleteLikesError } = await supabase
      .from('wine_memory_likes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Supprime tout

    if (deleteLikesError) {
      console.error('❌ Erreur lors de la suppression des likes:', deleteLikesError);
    } else {
      console.log('✅ Likes supprimés');
    }

    // 3. Ensuite, supprimer tous les souvenirs
    console.log('\n3️⃣ Suppression des souvenirs...');
    const { error: deleteMemoriesError } = await supabase
      .from('wine_memories')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Supprime tout

    if (deleteMemoriesError) {
      console.error('❌ Erreur lors de la suppression des souvenirs:', deleteMemoriesError);
    } else {
      console.log('✅ Souvenirs supprimés');
    }

    // 4. Vérifier que tout a été supprimé
    console.log('\n4️⃣ Vérification...');
    const { count: finalCount, error: finalCountError } = await supabase
      .from('wine_memories')
      .select('*', { count: 'exact', head: true });

    if (finalCountError) {
      console.error('❌ Erreur lors de la vérification:', finalCountError);
    } else {
      console.log(`📊 Nombre de souvenirs restants: ${finalCount || 0}`);
      if (finalCount === 0) {
        console.log('🎉 Nettoyage terminé avec succès !');
      } else {
        console.log('⚠️ Il reste encore des souvenirs');
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le script
clearAllMemories();

