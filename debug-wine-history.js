#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://yzdyepdejftgqpnwitcq.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6ZHllcGRlamZ0Z3FwbndpdGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwODAwOTksImV4cCI6MjA2NTY1NjA5OX0.wGFjpAAoYtcLlk6o1_lgZb0EhX3NB9SoYQ_D1rOc2E0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeWineEvents(wine) {
  // 2. Récupérer tous les événements pour ce vin
  const { data: events, error: eventsError } = await supabase
    .from('wine_history')
    .select('*')
    .eq('wine_id', wine.id)
    .order('created_at', { ascending: false });

  if (eventsError) {
    console.error('❌ Erreur récupération événements:', eventsError);
    return;
  }

  console.log(`📊 Nombre total d'événements: ${events?.length || 0}\n`);

  if (!events || events.length === 0) {
    console.log('❌ Aucun événement trouvé pour ce vin');
    return;
  }

  // 3. Analyser chaque événement
  console.log('📋 Détail des événements:');
  console.log('='.repeat(80));
  
  events.forEach((event, index) => {
    console.log(`\n${index + 1}. Événement ID: ${event.id}`);
    console.log(`   Type: ${event.event_type}`);
    console.log(`   Date: ${event.event_date || event.created_at}`);
    console.log(`   User ID: ${event.user_id}`);
    
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

  // 4. Compter les événements par type
  console.log('\n📊 Résumé par type d\'événement:');
  console.log('='.repeat(40));
  
  const eventsByType = events.reduce((acc, event) => {
    acc[event.event_type] = (acc[event.event_type] || 0) + 1;
    return acc;
  }, {});

  Object.entries(eventsByType).forEach(([type, count]) => {
    console.log(`${type}: ${count}`);
  });

  // 5. Analyser les stock_change spécifiquement
  const stockChangeEvents = events.filter(e => e.event_type === 'stock_change');
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
        console.log(`   ${index + 1}. ID: ${event.id}, previous: ${event.previous_amount}, new: ${event.new_amount}`);
      });
    }
  }

  // 6. Calculer les stats comme dans l'app
  console.log('\n📈 Calcul des stats (comme dans l\'app):');
  console.log('='.repeat(40));
  
  const validTastedEvents = stockChangeEvents.filter(e => 
    (e.previous_amount || 0) > (e.new_amount || 0)
  );
  const uniqueTastedWines = new Set(validTastedEvents.map(e => e.wine_id)).size;
  
  console.log(`Événements stock_change avec réduction: ${validTastedEvents.length}`);
  console.log(`Vins uniques dégustés: ${uniqueTastedWines}`);
  
  // 7. Vérifier les user_wine pour ce vin
  console.log('\n👤 État actuel dans user_wine:');
  console.log('='.repeat(40));
  
  const { data: userWines, error: userWineError } = await supabase
    .from('user_wine')
    .select('*')
    .eq('wine_id', wine.id);

  if (userWineError) {
    console.error('❌ Erreur récupération user_wine:', userWineError);
  } else {
    userWines?.forEach((uw, index) => {
      console.log(`${index + 1}. User ID: ${uw.user_id}`);
      console.log(`   Amount: ${uw.amount}`);
      console.log(`   Origin: ${uw.origin}`);
      console.log(`   Favorite: ${uw.favorite}`);
      console.log(`   Created: ${uw.created_at}`);
    });
  }
}

async function debugWineHistory() {
  console.log('🔍 Debug des événements wine_history pour le vin Moulin Neuf...\n');

  try {
    // 1. Lister tous les vins récents
    const { data: allWines, error: wineError } = await supabase
      .from('wine')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (wineError) {
      console.error('❌ Erreur recherche vins:', wineError);
      return;
    }

    console.log('🍷 Vins récents trouvés:');
    allWines?.forEach((wine, index) => {
      console.log(`${index + 1}. ${wine.name} (ID: ${wine.id}) - ${wine.created_at}`);
    });

    // Chercher spécifiquement Moulin Neuf
    const moulinNeufWines = allWines?.filter(w => w.name.toLowerCase().includes('moulin'));
    
    if (!moulinNeufWines || moulinNeufWines.length === 0) {
      console.log('\n❌ Aucun vin "Moulin" trouvé dans les vins récents');
      console.log('🔍 Recherche dans tous les vins...\n');
      
      const { data: allWines2, error: wineError2 } = await supabase
        .from('wine')
        .select('id, name, created_at')
        .ilike('name', '%moulin%');

      if (wineError2) {
        console.error('❌ Erreur recherche Moulin:', wineError2);
        return;
      }

      if (!allWines2 || allWines2.length === 0) {
        console.log('❌ Aucun vin trouvé avec "Moulin" dans le nom');
        return;
      }

      console.log('🍷 Vins "Moulin" trouvés:');
      allWines2.forEach((wine, index) => {
        console.log(`${index + 1}. ${wine.name} (ID: ${wine.id}) - ${wine.created_at}`);
      });
      
      const selectedWine = allWines2[0];
      console.log(`\n🍷 Analyse du vin: ${selectedWine.name} (ID: ${selectedWine.id})\n`);
      
      await analyzeWineEvents(selectedWine);
      return;
    }

    console.log(`\n🍷 ${moulinNeufWines.length} vins "Moulin" trouvés:`);
    moulinNeufWines.forEach((wine, index) => {
      console.log(`${index + 1}. ${wine.name} (ID: ${wine.id}) - ${wine.created_at}`);
    });

    // Analyser le plus récent d'abord
    const mostRecentMoulin = moulinNeufWines[0];
    console.log(`\n🍷 Analyse du vin le plus récent: ${mostRecentMoulin.name} (ID: ${mostRecentMoulin.id})\n`);
    
    await analyzeWineEvents(mostRecentMoulin);

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le script
debugWineHistory().then(() => {
  console.log('\n✅ Debug terminé');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
