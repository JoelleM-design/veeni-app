#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://yzdyepdejftgqpnwitcq.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6ZHllcGRlamZ0Z3FwbndpdGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwODAwOTksImV4cCI6MjA2NTY1NjA5OX0.wGFjpAAoYtcLlk6o1_lgZb0EhX3NB9SoYQ_D1rOc2E0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAuth() {
  console.log('🔍 Debug de l\'authentification...\n');

  try {
    // 1. Vérifier l'état de l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Erreur authentification:', authError);
      return;
    }

    if (!user) {
      console.log('❌ Aucun utilisateur connecté');
      console.log('💡 Solution: Se connecter dans l\'app');
      return;
    }

    console.log('✅ Utilisateur connecté:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Créé: ${user.created_at}`);

    // 2. Vérifier les entrées user_wine pour cet utilisateur
    const { data: userWines, error: userWineError } = await supabase
      .from('user_wine')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (userWineError) {
      console.error('❌ Erreur récupération user_wine:', userWineError);
    } else {
      console.log(`\n📊 Entrées user_wine pour cet utilisateur: ${userWines?.length || 0}`);
      userWines?.forEach((uw, index) => {
        console.log(`${index + 1}. Wine ID: ${uw.wine_id}, Amount: ${uw.amount}, Origin: ${uw.origin}`);
      });
    }

    // 3. Vérifier les événements wine_history pour cet utilisateur
    const { data: history, error: historyError } = await supabase
      .from('wine_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (historyError) {
      console.error('❌ Erreur récupération wine_history:', historyError);
    } else {
      console.log(`\n📊 Événements wine_history pour cet utilisateur: ${history?.length || 0}`);
      history?.forEach((event, index) => {
        console.log(`${index + 1}. Wine: ${event.wine_id}, Type: ${event.event_type}, ${event.previous_amount}→${event.new_amount}`);
      });
    }

    // 4. Vérifier si l'utilisateur existe dans la table User
    const { data: userRecord, error: userRecordError } = await supabase
      .from('User')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userRecordError) {
      console.log(`\n❌ Utilisateur non trouvé dans la table User: ${userRecordError.message}`);
      console.log('💡 Solution: Créer l\'entrée dans la table User');
    } else {
      console.log('\n✅ Utilisateur trouvé dans la table User:');
      console.log(`   Nom: ${userRecord.first_name}`);
      console.log(`   Email: ${userRecord.email}`);
      console.log(`   Créé: ${userRecord.created_at}`);
    }

    // 5. Recommandations
    console.log('\n💡 Recommandations:');
    console.log('='.repeat(40));
    
    if (!userWines || userWines.length === 0) {
      console.log('🔧 SOLUTION: Recréer les entrées user_wine');
      console.log('   → Les vins existent mais ne sont pas liés à l\'utilisateur');
      console.log('   → Il faut recréer les entrées user_wine pour chaque vin');
    }
    
    if (!history || history.length === 0) {
      console.log('🔧 SOLUTION: Recréer les événements wine_history');
      console.log('   → Aucune dégustation enregistrée');
      console.log('   → Il faut recréer les événements de dégustation');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le script
debugAuth().then(() => {
  console.log('\n✅ Debug terminé');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
