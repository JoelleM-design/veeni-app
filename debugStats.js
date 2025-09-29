// debugStats.js
const { createClient } = require("@supabase/supabase-js");

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// UUID de l'utilisateur à analyser (modifiez selon vos besoins)
const USER_ID = "27fd73b1-7088-4211-af88-3d075851f0db";

// Vérification des variables d'environnement
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Variables d'environnement manquantes !");
  console.log("💡 Définissez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY");
  console.log("   export SUPABASE_URL='https://votre-projet.supabase.co'");
  console.log("   export SUPABASE_SERVICE_ROLE_KEY='votre_clé_service_role'");
  process.exit(1);
}

// Initialisation du client Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function debugStats() {
  console.log("🔍 Debug des données Supabase");
  console.log("=============================");
  console.log("User ID:", USER_ID);
  console.log("URL:", SUPABASE_URL);
  console.log("");

  try {
    // 1. Récupération des données user_wine
    console.log("1️⃣ Récupération des données user_wine...");
    const { data: userWines, error: userWinesError } = await supabase
      .from("user_wine")
      .select(`
        id,
        user_id,
        wine_id,
        amount,
        rating,
        origin,
        favorite,
        source_user_id,
        created_at,
        wine: wine_id (id, name, year, wine_type, region)
      `)
      .eq("user_id", USER_ID);

    if (userWinesError) {
      console.error("❌ Erreur user_wine:", userWinesError.message);
    } else {
      console.log(`✅ user_wine: ${userWines?.length || 0} enregistrements trouvés`);
      
      if (userWines && userWines.length > 0) {
        console.log("\n📊 Détail des user_wine:");
        userWines.forEach((uw, index) => {
          console.log(`\n  ${index + 1}. ID: ${uw.id}`);
          console.log(`     Wine ID: ${uw.wine_id}`);
          console.log(`     Amount: ${uw.amount || 0} bouteilles`);
          console.log(`     Rating: ${uw.rating || 'Non noté'}`);
          console.log(`     Origin: ${uw.origin}`);
          console.log(`     Favorite: ${uw.favorite ? 'Oui' : 'Non'}`);
          console.log(`     Source User ID: ${uw.source_user_id || 'Aucun'}`);
          console.log(`     Created: ${uw.created_at}`);
          
          if (uw.wine) {
            console.log(`     🍷 Vin: ${uw.wine.name} (${uw.wine.year}) - ${uw.wine.wine_type}`);
            console.log(`     📍 Région: ${uw.wine.region || 'Non spécifiée'}`);
          }
        });

        // Statistiques calculées
        const cellarWines = userWines.filter(w => w.origin === 'cellar');
        const wishlistWines = userWines.filter(w => w.origin === 'wishlist');
        const favoriteWines = userWines.filter(w => w.favorite === true);
        const inspiredWines = userWines.filter(w => w.origin === 'wishlist' && w.source_user_id);

        console.log("\n📈 Statistiques user_wine:");
        console.log(`   🍷 Cave: ${cellarWines.length} vins`);
        console.log(`   📝 Wishlist: ${wishlistWines.length} vins`);
        console.log(`   ❤️ Favoris: ${favoriteWines.length} vins`);
        console.log(`   ✨ Inspirés: ${inspiredWines.length} vins`);
        console.log(`   📦 Total bouteilles: ${cellarWines.reduce((sum, w) => sum + (w.amount || 0), 0)}`);
      }
    }

    // 2. Récupération des événements wine_history
    console.log("\n2️⃣ Récupération des événements wine_history...");
    const { data: wineHistory, error: historyError } = await supabase
      .from("wine_history")
      .select(`
        id,
        user_id,
        wine_id,
        event_type,
        event_date,
        wine: wine_id (id, name, wine_type)
      `)
      .eq("user_id", USER_ID)
      .order("event_date", { ascending: false });

    if (historyError) {
      console.error("❌ Erreur wine_history:", historyError.message);
    } else {
      console.log(`✅ wine_history: ${wineHistory?.length || 0} événements trouvés`);
      
      if (wineHistory && wineHistory.length > 0) {
        console.log("\n📅 Détail des événements wine_history:");
        wineHistory.forEach((event, index) => {
          console.log(`\n  ${index + 1}. ID: ${event.id}`);
          console.log(`     Wine ID: ${event.wine_id}`);
          console.log(`     Type: ${event.event_type}`);
          console.log(`     Date: ${event.event_date}`);
          
          if (event.wine) {
            console.log(`     🍷 Vin: ${event.wine.name} - ${event.wine.wine_type}`);
          }
        });

        // Statistiques par type d'événement
        const eventTypes = wineHistory.reduce((acc, event) => {
          acc[event.event_type] = (acc[event.event_type] || 0) + 1;
          return acc;
        }, {});

        console.log("\n📊 Statistiques wine_history:");
        Object.entries(eventTypes).forEach(([type, count]) => {
          console.log(`   ${type}: ${count} événements`);
        });
      }
    }

    // 3. Récupération des relations friend
    console.log("\n3️⃣ Récupération des relations friend...");
    const { data: friends, error: friendsError } = await supabase
      .from("friend")
      .select(`
        id,
        user_id,
        friend_id,
        status,
        created_at,
        user: user_id (id, email),
        friend: friend_id (id, email)
      `)
      .or(`user_id.eq.${USER_ID},friend_id.eq.${USER_ID}`);

    if (friendsError) {
      console.error("❌ Erreur friend:", friendsError.message);
    } else {
      console.log(`✅ friend: ${friends?.length || 0} relations trouvées`);
      
      if (friends && friends.length > 0) {
        console.log("\n👥 Détail des relations friend:");
        friends.forEach((friend, index) => {
          console.log(`\n  ${index + 1}. ID: ${friend.id}`);
          console.log(`     User ID: ${friend.user_id}`);
          console.log(`     Friend ID: ${friend.friend_id}`);
          console.log(`     Status: ${friend.status}`);
          console.log(`     Created: ${friend.created_at}`);
          
          if (friend.user) {
            console.log(`     👤 User: ${friend.user.email}`);
          }
          if (friend.friend) {
            console.log(`     👤 Friend: ${friend.friend.email}`);
          }
        });

        // Statistiques par statut
        const statusCounts = friends.reduce((acc, friend) => {
          acc[friend.status] = (acc[friend.status] || 0) + 1;
          return acc;
        }, {});

        console.log("\n📊 Statistiques friend:");
        Object.entries(statusCounts).forEach(([status, count]) => {
          console.log(`   ${status}: ${count} relations`);
        });
      }
    }

    console.log("\n✅ Debug terminé !");
    console.log("==================");

  } catch (error) {
    console.error("❌ Erreur générale:", error);
  }
}

// Exécution du script
debugStats().catch(console.error);