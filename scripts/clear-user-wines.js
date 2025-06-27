const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase (même que dans lib/supabase.ts)
const SUPABASE_URL = "https://yzdyepdejftgqpnwitcq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6ZHllcGRlamZ0Z3FwbndpdGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwODAwOTksImV4cCI6MjA2NTY1NjA5OX0.wGFjpAAoYtcLlk6o1_lgZb0EhX3NB9SoYQ_D1rOc2E0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

async function clearUserWines() {
  try {
    console.log('🔍 Recherche de l\'utilisateur connecté...');
    
    // Récupérer la session actuelle
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Erreur récupération session:', sessionError);
      return;
    }
    
    if (!session) {
      console.error('❌ Aucune session active. Veuillez vous connecter.');
      return;
    }
    
    const userId = session.user.id;
    console.log(`👤 Utilisateur trouvé: ${userId}`);
    
    // Récupérer tous les vins de l'utilisateur
    console.log('🍷 Récupération des vins existants...');
    const { data: userWines, error: fetchError } = await supabase
      .from('user_wines')
      .select('*')
      .eq('user_id', userId);
    
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
    
    // Demander confirmation
    console.log('\n⚠️  ATTENTION: Cette action supprimera définitivement tous vos vins !');
    console.log('Pour confirmer, tapez "SUPPRIMER" (en majuscules):');
    
    // Simulation de confirmation pour le script automatique
    const confirmation = 'SUPPRIMER'; // En production, vous devriez utiliser readline
    
    if (confirmation !== 'SUPPRIMER') {
      console.log('❌ Suppression annulée');
      return;
    }
    
    // Supprimer tous les vins de l'utilisateur
    console.log('🗑️  Suppression des vins...');
    const { error: deleteError } = await supabase
      .from('user_wines')
      .delete()
      .eq('user_id', userId);
    
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
clearUserWines()
  .then(() => {
    console.log('✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }); 