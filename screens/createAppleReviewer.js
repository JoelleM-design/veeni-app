// createAppleReviewer.js
// Node.js (CommonJS) — fonctionne avec node 16+
// Utilise la SUPABASE_SERVICE_ROLE_KEY (recommandé)

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Configure SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY en variables d'environnement.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function run() {
  try {
    // 1) create user (Apple reviewer)
    const email = "apple-review@veeni.test";
    const password = "Test1234!"; // mot de passe à communiquer à Apple
    console.log("➡️  Création de l'utilisateur de test:", email);

    const { data: userData, error: userErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: "Apple",
        avatar_initial: "A",
      },
    });

    if (userErr) {
      console.error("❌ Erreur création utilisateur:", userErr);
      return;
    }
    const userId = userData.user.id;
    console.log("✅ Utilisateur créé:", userId);

    // 2) créer quelques vins (si inexistants) — on insert avec des external ids simples
    const sampleWines = [
      { id: "00000000-0000-4000-8000-000000000000", name: "Château Moulin de Vignolle", year: "2020", wine_type: "red", region: null },
      { id: "042a10b1-9466-4e80-9c8b-0f77d935396c", name: "Domaine Arica", year: "2024", wine_type: "white", region: "Ile De Ré" },
      { id: "0b1f003b-f1f6-452f-9b45-b246f75c5a96", name: "Les Roches Blanches", year: "2024", wine_type: "white", region: null }
    ];

    console.log("➡️  Insertion sample wines (ok si existent déjà)...");
    const { error: wineErr } = await supabase
      .from("wine")
      .upsert(sampleWines, { onConflict: "id" });
    if (wineErr) {
      console.warn("⚠️ Erreur insert wine (peut être ok si RLS):", wineErr);
    } else {
      console.log("✅ Wines inserted/upserted.");
    }

    // 3) Créer user_wine pour ce testeur : 1 cave, 1 wishlist, 1 degusté
    const userWines = [
      {
        user_id: userId,
        wine_id: "00000000-0000-4000-8000-000000000000",
        amount: 2,
        rating: 3,
        origin: "cellar",
        favorite: true,
        created_at: new Date().toISOString()
      },
      {
        user_id: userId,
        wine_id: "042a10b1-9466-4e80-9c8b-0f77d935396c",
        amount: 0,
        rating: null,
        origin: "wishlist",
        favorite: false,
        created_at: new Date().toISOString()
      },
      {
        user_id: userId,
        wine_id: "0b1f003b-f1f6-452f-9b45-b246f75c5a96",
        amount: 0,
        rating: 5,
        origin: "cellar",
        favorite: true,
        created_at: new Date().toISOString()
      }
    ];

    console.log("➡️  Insertion user_wine...");
    const { data: uwData, error: uwErr } = await supabase
      .from("user_wine")
      .insert(userWines);
    if (uwErr) {
      console.error("❌ Erreur insert user_wine:", uwErr);
    } else {
      console.log("✅ user_wine insérés:", uwData.length);
    }

    // 4) Insérer wine_history (events), ex : added + tasted + stock_change
    const wineHistory = [
      {
        user_id: userId,
        wine_id: "00000000-0000-4000-8000-000000000000",
        event_type: "added",
        event_date: new Date().toISOString(),
        previous_amount: null,
        new_amount: 2,
        notes: "Ajout initial",
      },
      {
        user_id: userId,
        wine_id: "0b1f003b-f1f6-452f-9b45-b246f75c5a96",
        event_type: "tasted",
        event_date: new Date().toISOString(),
        rating: 5,
        notes: "Dégustation test",
      }
    ];

    console.log("➡️  Insertion wine_history...");
    const { data: whData, error: whErr } = await supabase
      .from("wine_history")
      .insert(wineHistory);
    if (whErr) {
      console.error("❌ Erreur insert wine_history:", whErr);
    } else {
      console.log("✅ wine_history insérés:", whData.length);
    }

    console.log("\n🎉 FIN — compte de test prêt !");
    console.log("Données utilisateur:");
    console.log("  email:", email);
    console.log("  password:", password);
    console.log("  user_id:", userId);

    console.log("\n📌 Rappels sécurité:");
    console.log("- Ne partage PAS la SERVICE_ROLE_KEY publiquement.");
    console.log("- Supprime ce compte de test si tu le laisses en prod plus tard.");

  } catch (err) {
    console.error("❌ Erreur générale:", err);
  }
}

run();