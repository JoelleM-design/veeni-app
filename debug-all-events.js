#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://yzdyepdejftgqpnwitcq.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6ZHllcGRlamZ0Z3FwbndpdGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwODAwOTksImV4cCI6MjA2NTY1NjA5OX0.wGFjpAAoYtcLlk6o1_lgZb0EhX3NB9SoYQ_D1rOc2E0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAllEvents() {
  console.log('🔍 Debug de tous les événements wine_history...\n');

  try {
    // 1. Lister tous les événements récents
    const { data: allEvents, error: eventsError } = await supabase
      .from('wine_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (eventsError) {
      console.error('❌ Erreur récupération événements:', eventsError);
      return;
    }

    console.log(`📊 Nombre total d'événements récents: ${allEvents?.length || 0}\n`);

    if (!allEvents || allEvents.length === 0) {
      console.log('❌ Aucun événement trouvé dans wine_history');
      return;
    }

    // 2. Analyser chaque événement
    console.log('📋 Détail des événements récents:');
    console.log('='.repeat(100));
    
    allEvents.forEach((event, index) => {
      console.log(`\n${index + 1}. Événement ID: ${event.id}`);
      console.log(`   Type: ${event.event_type}`);
      console.log(`   Date: ${event.event_date || event.created_at}`);
      console.log(`   User ID: ${event.user_id}`);
      console.log(`   Wine ID: ${event.wine_id}`);
      
      if (event.event_type === 'stock_change') {
        console.log(`   Previous amount: ${event.previous_amount}`);
        console.log(`   New amount: ${event.new_amount}`);
        const diff = (event.previous_amount || 0) - (event.new_amount || 0);
        console.log(`   Différence: ${diff}`);
        if (diff > 0) {
          console.log(`   ✅ Réduction de stock (${diff} bouteille${diff > 1 ? 's' : ''} consommée${diff > 1 ? 's' : ''})`);
        } else if (diff < 0) {
          console.log(`   📈 Augmentation de stock (${Math.abs(diff)} bouteille${Math.abs(diff) > 1 ? 's' : ''} ajoutée${Math.abs(diff) > 1 ? 's' : ''})`);
        } else {
          console.log(`   ⚠️  Aucun changement de stock (previous = new)`);
        }
      }
      
      if (event.notes) {
        console.log(`   Notes: ${event.notes}`);
      }
      if (event.rating) {
        console.log(`   Rating: ${event.rating}`);
      }
    });

    // 3. Compter les événements par type
    console.log('\n📊 Résumé par type d\'événement:');
    console.log('='.repeat(40));
    
    const eventsByType = allEvents.reduce((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {});

    Object.entries(eventsByType).forEach(([type, count]) => {
      console.log(`${type}: ${count}`);
    });

    // 4. Analyser les stock_change spécifiquement
    const stockChangeEvents = allEvents.filter(e => e.event_type === 'stock_change');
    console.log(`\n🍷 Événements stock_change: ${stockChangeEvents.length}`);
    
    if (stockChangeEvents.length > 0) {
      const validStockChanges = stockChangeEvents.filter(e => 
        (e.previous_amount || 0) > (e.new_amount || 0)
      );
      const invalidStockChanges = stockChangeEvents.filter(e => 
        (e.previous_amount || 0) <= (e.new_amount || 0)
      );
      
      console.log(`   ✅ Réductions de stock: ${validStockChanges.length}`);
      console.log(`   ⚠️  Événements invalides: ${invalidStockChanges.length}`);
      
      if (invalidStockChanges.length > 0) {
        console.log('\n🚨 Événements stock_change invalides:');
        invalidStockChanges.forEach((event, index) => {
          console.log(`   ${index + 1}. ID: ${event.id}, wine_id: ${event.wine_id}, previous: ${event.previous_amount}, new: ${event.new_amount}`);
        });
      }
    }

    // 5. Chercher les événements pour les vins Batti
    console.log('\n🔍 Recherche d\'événements pour les vins Batti:');
    console.log('='.repeat(50));
    
    const battiEvents = allEvents.filter(e => {
      // On va chercher les noms des vins pour ces wine_ids
      return e.wine_id === 'f07ac22e-5fe3-4500-8c50-8966fe14931f' || 
             e.wine_id === '30e33e7b-88f5-4c59-9abc-407b77f495cf';
    });

    if (battiEvents.length > 0) {
      console.log(`✅ ${battiEvents.length} événements trouvés pour les vins Batti:`);
      battiEvents.forEach((event, index) => {
        console.log(`   ${index + 1}. Type: ${event.event_type}, Wine ID: ${event.wine_id}, Date: ${event.created_at}`);
      });
    } else {
      console.log('❌ Aucun événement trouvé pour les vins Batti');
    }

    // 6. Vérifier les user_wine pour les vins Batti
    console.log('\n👤 État actuel dans user_wine pour les vins Batti:');
    console.log('='.repeat(60));
    
    const { data: userWines, error: userWineError } = await supabase
      .from('user_wine')
      .select('*')
      .or('wine_id.eq.f07ac22e-5fe3-4500-8c50-8966fe14931f,wine_id.eq.30e33e7b-88f5-4c59-9abc-407b77f495cf');

    if (userWineError) {
      console.error('❌ Erreur récupération user_wine:', userWineError);
    } else {
      console.log(`📊 ${userWines?.length || 0} entrées user_wine trouvées:`);
      userWines?.forEach((uw, index) => {
        console.log(`\n${index + 1}. User ID: ${uw.user_id}`);
        console.log(`   Wine ID: ${uw.wine_id}`);
        console.log(`   Amount: ${uw.amount}`);
        console.log(`   Origin: ${uw.origin}`);
        console.log(`   Favorite: ${uw.favorite}`);
        console.log(`   Created: ${uw.created_at}`);
        console.log(`   Updated: ${uw.updated_at}`);
      });
    }

    // 7. Calculer les stats globales
    console.log('\n📈 Calcul des stats globales:');
    console.log('='.repeat(40));
    
    const validTastedEvents = stockChangeEvents.filter(e => 
      (e.previous_amount || 0) > (e.new_amount || 0)
    );
    const uniqueTastedWines = new Set(validTastedEvents.map(e => e.wine_id)).size;
    
    console.log(`Événements stock_change avec réduction: ${validTastedEvents.length}`);
    console.log(`Vins uniques dégustés: ${uniqueTastedWines}`);
    
    // 8. Lister tous les utilisateurs
    console.log('\n👥 Utilisateurs dans la base:');
    console.log('='.repeat(40));
    
    const { data: users, error: usersError } = await supabase
      .from('User')
      .select('id, email, first_name')
      .limit(10);

    if (usersError) {
      console.error('❌ Erreur récupération utilisateurs:', usersError);
    } else {
      users?.forEach((user, index) => {
        console.log(`${index + 1}. ${user.first_name} (${user.email}) - ID: ${user.id}`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le script
debugAllEvents().then(() => {
  console.log('\n✅ Debug terminé');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
