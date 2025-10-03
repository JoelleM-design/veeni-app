#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://yzdyepdejftgqpnwitcq.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6ZHllcGRlamZ0Z3FwbndpdGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwODAwOTksImV4cCI6MjA2NTY1NjA5OX0.wGFjpAAoYtcLlk6o1_lgZb0EhX3NB9SoYQ_D1rOc2E0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAllTables() {
  console.log('🔍 Debug de toutes les tables...\n');

  try {
    // 1. Vérifier la table wine
    const { data: wines, error: wineError } = await supabase
      .from('wine')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (wineError) {
      console.error('❌ Erreur récupération wines:', wineError);
    } else {
      console.log(`📊 Table wine: ${wines?.length || 0} vins`);
      wines?.forEach((wine, index) => {
        console.log(`${index + 1}. ${wine.name} (ID: ${wine.id}) - ${wine.created_at}`);
      });
    }

    // 2. Vérifier la table user_wine
    const { data: userWines, error: userWineError } = await supabase
      .from('user_wine')
      .select('id, wine_id, user_id, amount, origin, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (userWineError) {
      console.error('❌ Erreur récupération user_wine:', userWineError);
    } else {
      console.log(`\n📊 Table user_wine: ${userWines?.length || 0} entrées`);
      userWines?.forEach((uw, index) => {
        console.log(`${index + 1}. Wine ID: ${uw.wine_id}, User: ${uw.user_id}, Amount: ${uw.amount}, Origin: ${uw.origin} - ${uw.created_at}`);
      });
    }

    // 3. Vérifier la table wine_history
    const { data: history, error: historyError } = await supabase
      .from('wine_history')
      .select('id, wine_id, user_id, event_type, previous_amount, new_amount, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (historyError) {
      console.error('❌ Erreur récupération wine_history:', historyError);
    } else {
      console.log(`\n📊 Table wine_history: ${history?.length || 0} événements`);
      history?.forEach((event, index) => {
        console.log(`${index + 1}. Wine: ${event.wine_id}, Type: ${event.event_type}, ${event.previous_amount}→${event.new_amount} - ${event.created_at}`);
      });
    }

    // 4. Vérifier la table User
    const { data: users, error: usersError } = await supabase
      .from('User')
      .select('id, email, first_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (usersError) {
      console.error('❌ Erreur récupération User:', usersError);
    } else {
      console.log(`\n📊 Table User: ${users?.length || 0} utilisateurs`);
      users?.forEach((user, index) => {
        console.log(`${index + 1}. ${user.first_name} (${user.email}) - ID: ${user.id} - ${user.created_at}`);
      });
    }

    // 5. Analyser le problème
    console.log('\n🔍 Analyse du problème:');
    console.log('='.repeat(40));
    
    if (!wines || wines.length === 0) {
      console.log('❌ PROBLÈME: Aucun vin dans la table wine');
    } else {
      console.log('✅ Table wine: OK');
    }
    
    if (!userWines || userWines.length === 0) {
      console.log('❌ PROBLÈME: Aucune entrée dans user_wine');
      console.log('   → Les vins n\'apparaissent pas dans l\'app');
    } else {
      console.log('✅ Table user_wine: OK');
    }
    
    if (!history || history.length === 0) {
      console.log('❌ PROBLÈME: Aucun événement dans wine_history');
      console.log('   → Pas de dégustations enregistrées');
    } else {
      console.log('✅ Table wine_history: OK');
    }
    
    if (!users || users.length === 0) {
      console.log('❌ PROBLÈME: Aucun utilisateur');
    } else {
      console.log('✅ Table User: OK');
    }

    // 6. Recommandations
    console.log('\n💡 Recommandations:');
    console.log('='.repeat(40));
    
    if ((!userWines || userWines.length === 0) && wines && wines.length > 0) {
      console.log('🔧 SOLUTION: Recréer les entrées user_wine manquantes');
      console.log('   → Les vins existent mais ne sont pas liés aux utilisateurs');
      console.log('   → Il faut recréer les entrées user_wine pour chaque vin');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le script
debugAllTables().then(() => {
  console.log('\n✅ Debug terminé');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
