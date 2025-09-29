#!/usr/bin/env node

/**
 * Test du hook useProfileStats corrigé
 * Utilise uniquement l'Anon key et respecte les règles RLS
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yzdyepdejftgqpnwitcq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6ZHllcGRlamZ0Z3FwbndpdGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwODAwOTksImV4cCI6MjA2NTY1NjA5OX0.wGFjpAAoYtcLlk6o1_lgZb0EhX3NB9SoYQ_D1rOc2E0';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testProfileStats(userId, viewerId) {
  console.log('🧪 Test useProfileStats corrigé');
  console.log('================================');
  console.log('User ID:', userId);
  console.log('Viewer ID:', viewerId || 'Aucun (profil perso)');
  
  const stats = {
    tastedCount: 0,
    favoritesCount: 0,
    wishlistCount: 0,
    cellarCount: 0,
    commonCount: 0,
    inspiredCount: 0
  };

  try {
    // 1. Dégustés - wine_history avec event_type = 'tasted'
    console.log('\\n1. 🔍 Calcul des dégustés...');
    const { data: tastedData, error: tastedError } = await supabase
      .from('wine_history')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('event_type', 'tasted');

    if (tastedError) {
      console.log('❌ Erreur tasted:', tastedError.message);
    } else {
      stats.tastedCount = tastedData?.length || 0;
      console.log('✅ Dégustés:', stats.tastedCount);
    }

    // 2. Favoris - user_wine avec favorite = true
    console.log('\\n2. 🔍 Calcul des favoris...');
    const { data: favoritesData, error: favoritesError } = await supabase
      .from('user_wine')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('favorite', true);

    if (favoritesError) {
      console.log('❌ Erreur favorites:', favoritesError.message);
    } else {
      stats.favoritesCount = favoritesData?.length || 0;
      console.log('✅ Favoris:', stats.favoritesCount);
    }

    // 3. Wishlist - user_wine avec origin = 'wishlist' (même si amount = 0)
    console.log('\\n3. 🔍 Calcul de la wishlist...');
    const { data: wishlistData, error: wishlistError } = await supabase
      .from('user_wine')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('origin', 'wishlist');

    if (wishlistError) {
      console.log('❌ Erreur wishlist:', wishlistError.message);
    } else {
      stats.wishlistCount = wishlistData?.length || 0;
      console.log('✅ Wishlist:', stats.wishlistCount);
    }

    // 4. Cave - user_wine avec origin = 'cellar' (même si amount = 0)
    console.log('\\n4. 🔍 Calcul de la cave...');
    const { data: cellarData, error: cellarError } = await supabase
      .from('user_wine')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('origin', 'cellar');

    if (cellarError) {
      console.log('❌ Erreur cellar:', cellarError.message);
    } else {
      stats.cellarCount = cellarData?.length || 0;
      console.log('✅ Cave:', stats.cellarCount);
    }

    // 5. Inspirés - user_wine avec source_user_id (pour plus tard)
    console.log('\\n5. 🔍 Calcul des inspirés...');
    const { data: inspiredData, error: inspiredError } = await supabase
      .from('user_wine')
      .select('id', { count: 'exact' })
      .eq('origin', 'wishlist')
      .eq('source_user_id', userId);

    if (inspiredError) {
      console.log('⚠️ Erreur inspired (normal si colonne manquante):', inspiredError.message);
      stats.inspiredCount = 0;
    } else {
      stats.inspiredCount = inspiredData?.length || 0;
      console.log('✅ Inspirés:', stats.inspiredCount);
    }

    // 6. Communs - logique différente selon le contexte
    console.log('\\n6. 🔍 Calcul des communs...');
    
    if (viewerId && viewerId !== userId) {
      // Cas "profil visité" : intersection (vins de l'ami) ∩ (mes vins)
      console.log('   Mode: Profil visité');
      
      const { data: userWines, error: userWinesError } = await supabase
        .from('user_wine')
        .select('wine_id')
        .eq('user_id', userId)
        .in('origin', ['cellar', 'wishlist']);

      const { data: viewerWines, error: viewerWinesError } = await supabase
        .from('user_wine')
        .select('wine_id')
        .eq('user_id', viewerId)
        .in('origin', ['cellar', 'wishlist']);

      if (userWinesError || viewerWinesError) {
        console.log('❌ Erreur communs profil visité:', userWinesError?.message || viewerWinesError?.message);
        stats.commonCount = 0;
      } else {
        const userWineIds = new Set(userWines?.map(w => w.wine_id) || []);
        const viewerWineIds = new Set(viewerWines?.map(w => w.wine_id) || []);
        stats.commonCount = [...userWineIds].filter(id => viewerWines.has(id)).length;
        console.log('✅ Communs (profil visité):', stats.commonCount);
      }
    } else {
      // Cas "profil perso" : intersection (mes vins) ∩ (amis acceptés vins)
      console.log('   Mode: Profil perso');
      
      // Récupérer les amis acceptés (sans colonne id, clé primaire composée)
      const { data: friends, error: friendsError } = await supabase
        .from('friend')
        .select('user_id, friend_id, status')
        .eq('user_id', userId)
        .eq('status', 'accepted');

      if (friendsError) {
        console.log('❌ Erreur friends:', friendsError.message);
        stats.commonCount = 0;
      } else {
        const friendIds = friends?.map(f => f.friend_id) || [];
        console.log('   Amis trouvés:', friendIds.length);
        
        if (friendIds.length > 0) {
          // Récupérer mes vins (cave + wishlist)
          const { data: myWines, error: myWinesError } = await supabase
            .from('user_wine')
            .select('wine_id')
            .eq('user_id', userId)
            .in('origin', ['cellar', 'wishlist']);

          if (myWinesError) {
            console.log('❌ Erreur myWines:', myWinesError.message);
            stats.commonCount = 0;
          } else {
            const myWineIds = new Set(myWines?.map(w => w.wine_id) || []);
            console.log('   Mes vins:', myWineIds.size);
            
            if (myWineIds.size > 0) {
              // Récupérer les vins des amis
              const { data: friendWines, error: friendWinesError } = await supabase
                .from('user_wine')
                .select('wine_id')
                .in('user_id', friendIds)
                .in('wine_id', Array.from(myWineIds))
                .in('origin', ['cellar', 'wishlist']);

              if (friendWinesError) {
                console.log('❌ Erreur friendWines:', friendWinesError.message);
                stats.commonCount = 0;
              } else {
                const friendWineIds = new Set(friendWines?.map(w => w.wine_id) || []);
                stats.commonCount = [...myWineIds].filter(id => friendWineIds.has(id)).length;
                console.log('✅ Communs (profil perso):', stats.commonCount);
              }
            } else {
              stats.commonCount = 0;
              console.log('✅ Communs (profil perso): 0 (pas de vins)');
            }
          }
        } else {
          stats.commonCount = 0;
          console.log('✅ Communs (profil perso): 0 (pas d\'amis)');
        }
      }
    }

    // Résumé final
    console.log('\\n📊 RÉSULTATS FINAUX:');
    console.log('====================');
    console.log('🍷 Dégustés:', stats.tastedCount);
    console.log('❤️ Favoris:', stats.favoritesCount);
    console.log('📝 Wishlist:', stats.wishlistCount);
    console.log('🏠 Cave:', stats.cellarCount);
    console.log('🤝 Communs:', stats.commonCount);
    console.log('✨ Inspirés:', stats.inspiredCount);

    return stats;

  } catch (error) {
    console.error('❌ Erreur générale:', error);
    return stats;
  }
}

async function main() {
  const userId = process.argv[2];
  const viewerId = process.argv[3];
  
  if (!userId) {
    console.log('❌ Usage: node test-profile-stats.js [USER_ID] [VIEWER_ID]');
    console.log('   USER_ID: ID de l\'utilisateur à analyser');
    console.log('   VIEWER_ID: ID du viewer (optionnel, pour profil visité)');
    process.exit(1);
  }

  console.log('🚀 Test des statistiques corrigées...');
  await testProfileStats(userId, viewerId);
}

main().catch(console.error);




