const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase (même que dans lib/supabase.ts)
const SUPABASE_URL = "https://yzdyepdejftgqpnwitcq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6ZHllcGRlamZ0Z3FwbndpdGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwODAwOTksImV4cCI6MjA2NTY1NjA5OX0.wGFjpAAoYtcLlk6o1_lgZb0EhX3NB9SoYQ_D1rOc2E0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ID de l'utilisateur (d'après les logs)
const USER_ID = "27fd73b1-7088-4211-af88-3d075851f0db";

async function clearUserWinesDirect() {
  try {
    console.log(`🔍 Suppression des vins pour l'utilisateur: ${USER_ID}`);
    
    // Récupérer tous les vins de l'utilisateur
    console.log('🍷 Récupération des vins existants...');
    const { data: userWines, error: fetchError } = await supabase
      .from('user_wine')
      .select('*')
      .eq('user_id', USER_ID);
    
    if (fetchError) {
      console.error('❌ Erreur récupération vins:', fetchError);
      return;
    }
    
    if (!userWines || userWines.length === 0) {
      console.log('✅ Aucun vin trouvé pour cet utilisateur');
      return;
    }
    
    console.log(`📊 ${userWines.length} vins trouvés:`);
    userWines.forEach((wine, index) => {
      console.log(`  ${index + 1}. ${wine.wine?.name || 'Nom inconnu'} (${wine.origin})`);
    });
    
    // Supprimer tous les vins de l'utilisateur
    console.log('🗑️  Suppression des vins...');
    const { error: deleteError } = await supabase
      .from('user_wine')
      .delete()
      .eq('user_id', USER_ID);
    
    if (deleteError) {
      console.error('❌ Erreur suppression vins:', deleteError);
      return;
    }
    
    console.log('✅ Tous les vins ont été supprimés avec succès !');
    console.log(`🗑️  ${userWines.length} vins supprimés`);
    
  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
}

// Exécuter le script
clearUserWinesDirect()
  .then(() => {
    console.log('✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }); 