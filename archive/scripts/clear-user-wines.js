const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearUserWines() {
  try {
    console.log('🚀 Début du nettoyage des vins utilisateur...');

    // Récupérer tous les utilisateurs
    const { data: users, error: usersError } = await supabase
      .from('User')
      .select('id, email');

    if (usersError) {
      console.error('❌ Erreur lors de la récupération des utilisateurs:', usersError);
      return;
    }

    console.log(`📊 ${users.length} utilisateurs trouvés`);

    for (const user of users) {
      console.log(`\n👤 Traitement de l'utilisateur: ${user.email} (${user.id})`);

      // Récupérer les vins de l'utilisateur
      const { data: userWines, error: winesError } = await supabase
        .from('user_wine')
        .select('wine_id, wine(name)')
        .eq('user_id', user.id);

      if (winesError) {
        console.error(`❌ Erreur lors de la récupération des vins pour ${user.email}:`, winesError);
        continue;
      }

      console.log(`🍷 ${userWines.length} vins trouvés pour ${user.email}`);

      if (userWines.length === 0) {
        console.log(`✅ Aucun vin à supprimer pour ${user.email}`);
        continue;
      }

      // Supprimer les vins de l'utilisateur
      const { error: deleteError } = await supabase
        .from('user_wine')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        console.error(`❌ Erreur lors de la suppression des vins pour ${user.email}:`, deleteError);
        continue;
      }

      console.log(`✅ ${userWines.length} vins supprimés pour ${user.email}`);

      // Identifier les vins orphelins (qui ne sont plus référencés par aucun utilisateur)
      const wineIds = userWines.map(uw => uw.wine_id);
      
      for (const wineId of wineIds) {
        const { data: remainingReferences, error: refError } = await supabase
          .from('user_wine')
          .select('id')
          .eq('wine_id', wineId);

        if (refError) {
          console.error(`❌ Erreur lors de la vérification des références pour le vin ${wineId}:`, refError);
          continue;
        }

        // Si plus aucune référence, supprimer le vin
        if (remainingReferences.length === 0) {
          const { error: wineDeleteError } = await supabase
            .from('wine')
            .delete()
            .eq('id', wineId);

          if (wineDeleteError) {
            console.error(`❌ Erreur lors de la suppression du vin orphelin ${wineId}:`, wineDeleteError);
          } else {
            console.log(`🗑️ Vin orphelin supprimé: ${wineId}`);
          }
        }
      }
    }

    console.log('\n🎉 Nettoyage terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

clearUserWines(); 