#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://yzdyepdejftgqpnwitcq.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6ZHllcGRlamZ0Z3FwbndpdGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwODAwOTksImV4cCI6MjA2NTY1NjA5OX0.wGFjpAAoYtcLlk6o1_lgZb0EhX3NB9SoYQ_D1rOc2E0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugUserWines() {
  console.log('🔍 Debug des user_wine...\n');

  try {
    // 1. Lister tous les user_wine
    const { data: allUserWines, error: userWineError } = await supabase
      .from('user_wine')
      .select(`
        *,
        wine (
          id,
          name,
          wine_type
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (userWineError) {
      console.error('❌ Erreur récupération user_wine:', userWineError);
      return;
    }

    console.log(`📊 Nombre total d'entrées user_wine: ${allUserWines?.length || 0}\n`);

    if (!allUserWines || allUserWines.length === 0) {
      console.log('❌ Aucune entrée trouvée dans user_wine');
      return;
    }

    // 2. Analyser chaque entrée
    console.log('📋 Détail des user_wine:');
    console.log('='.repeat(100));
    
    allUserWines.forEach((uw, index) => {
      console.log(`\n${index + 1}. User Wine ID: ${uw.id}`);
      console.log(`   User ID: ${uw.user_id}`);
      console.log(`   Wine: ${uw.wine?.name || 'N/A'} (ID: ${uw.wine_id})`);
      console.log(`   Type: ${uw.wine?.wine_type || 'N/A'}`);
      console.log(`   Amount: ${uw.amount}`);
      console.log(`   Origin: ${uw.origin}`);
      console.log(`   Favorite: ${uw.favorite}`);
      console.log(`   Rating: ${uw.rating}`);
      console.log(`   Created: ${uw.created_at}`);
      console.log(`   Updated: ${uw.updated_at}`);
    });

    // 3. Chercher les entrées pour les vins Batti
    console.log('\n🔍 Recherche d\'entrées pour les vins Batti:');
    console.log('='.repeat(50));
    
    const battiUserWines = allUserWines.filter(uw => {
      return uw.wine_id === 'f07ac22e-5fe3-4500-8c50-8966fe14931f' || 
             uw.wine_id === '30e33e7b-88f5-4c59-9abc-407b77f495cf' ||
             uw.wine?.name?.toLowerCase().includes('batti');
    });

    if (battiUserWines.length > 0) {
      console.log(`✅ ${battiUserWines.length} entrées trouvées pour les vins Batti:`);
      battiUserWines.forEach((uw, index) => {
        console.log(`\n${index + 1}. User: ${uw.user_id}`);
        console.log(`   Wine: ${uw.wine?.name} (ID: ${uw.wine_id})`);
        console.log(`   Amount: ${uw.amount}`);
        console.log(`   Origin: ${uw.origin}`);
        console.log(`   Created: ${uw.created_at}`);
      });
    } else {
      console.log('❌ Aucune entrée trouvée pour les vins Batti');
    }

    // 4. Compter par origine
    console.log('\n📊 Résumé par origine:');
    console.log('='.repeat(40));
    
    const byOrigin = allUserWines.reduce((acc, uw) => {
      acc[uw.origin || 'unknown'] = (acc[uw.origin || 'unknown'] || 0) + 1;
      return acc;
    }, {});

    Object.entries(byOrigin).forEach(([origin, count]) => {
      console.log(`${origin}: ${count}`);
    });

    // 5. Compter par type de vin
    console.log('\n🍷 Résumé par type de vin:');
    console.log('='.repeat(40));
    
    const byWineType = allUserWines.reduce((acc, uw) => {
      acc[uw.wine?.wine_type || 'unknown'] = (acc[uw.wine?.wine_type || 'unknown'] || 0) + 1;
      return acc;
    }, {});

    Object.entries(byWineType).forEach(([type, count]) => {
      console.log(`${type}: ${count}`);
    });

    // 6. Calculer les stats comme dans l'app
    console.log('\n📈 Calcul des stats (comme dans l\'app):');
    console.log('='.repeat(40));
    
    const cellarWines = allUserWines.filter(uw => uw.origin === 'cellar');
    const wishlistWines = allUserWines.filter(uw => uw.origin === 'wishlist');
    const favoriteWines = allUserWines.filter(uw => uw.favorite === true);
    
    const totalBottles = cellarWines.reduce((sum, uw) => sum + (uw.amount || 0), 0);
    const redBottles = cellarWines.filter(uw => uw.wine?.wine_type === 'red').reduce((sum, uw) => sum + (uw.amount || 0), 0);
    const whiteBottles = cellarWines.filter(uw => uw.wine?.wine_type === 'white').reduce((sum, uw) => sum + (uw.amount || 0), 0);
    const roseBottles = cellarWines.filter(uw => uw.wine?.wine_type === 'rose').reduce((sum, uw) => sum + (uw.amount || 0), 0);
    const sparklingBottles = cellarWines.filter(uw => uw.wine?.wine_type === 'sparkling').reduce((sum, uw) => sum + (uw.amount || 0), 0);
    
    console.log(`Vins en cave: ${cellarWines.length}`);
    console.log(`Vins en wishlist: ${wishlistWines.length}`);
    console.log(`Vins favoris: ${favoriteWines.length}`);
    console.log(`Total bouteilles: ${totalBottles}`);
    console.log(`Bouteilles rouges: ${redBottles}`);
    console.log(`Bouteilles blanches: ${whiteBottles}`);
    console.log(`Bouteilles rosées: ${roseBottles}`);
    console.log(`Bouteilles effervescentes: ${sparklingBottles}`);

    // 7. Lister les utilisateurs
    console.log('\n👥 Utilisateurs avec des vins:');
    console.log('='.repeat(40));
    
    const byUser = allUserWines.reduce((acc, uw) => {
      if (!acc[uw.user_id]) {
        acc[uw.user_id] = {
          count: 0,
          cellar: 0,
          wishlist: 0,
          bottles: 0
        };
      }
      acc[uw.user_id].count++;
      if (uw.origin === 'cellar') acc[uw.user_id].cellar++;
      if (uw.origin === 'wishlist') acc[uw.user_id].wishlist++;
      acc[uw.user_id].bottles += (uw.amount || 0);
      return acc;
    }, {});

    Object.entries(byUser).forEach(([userId, stats]) => {
      console.log(`\nUser ID: ${userId}`);
      console.log(`   Total vins: ${stats.count}`);
      console.log(`   Cave: ${stats.cellar}`);
      console.log(`   Wishlist: ${stats.wishlist}`);
      console.log(`   Bouteilles: ${stats.bottles}`);
    });

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le script
debugUserWines().then(() => {
  console.log('\n✅ Debug terminé');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
