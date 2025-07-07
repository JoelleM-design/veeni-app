const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration Supabase
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   EXPO_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQLFile(filePath) {
  try {
    console.log(`\n📁 Lecture du fichier: ${filePath}`);
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    console.log(`🚀 Exécution du script SQL...`);
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error(`❌ Erreur lors de l'exécution:`, error);
      return false;
    }
    
    console.log(`✅ Script exécuté avec succès`);
    if (data) {
      console.log('📊 Résultats:', data);
    }
    return true;
  } catch (err) {
    console.error(`❌ Erreur lors de la lecture/exécution:`, err);
    return false;
  }
}

async function executeSQLQueries() {
  console.log('🏠 MIGRATION HOUSEHOLD - DÉBUT');
  console.log('=====================================');
  
  const scripts = [
    'create_household_tables.sql',
    'migrate_users_to_households.sql',
    'test_household_functionality.sql'
  ];
  
  for (const script of scripts) {
    const filePath = path.join(__dirname, '..', script);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Fichier non trouvé: ${filePath}`);
      continue;
    }
    
    console.log(`\n🔄 Exécution de: ${script}`);
    console.log('-------------------------------------');
    
    const success = await executeSQLFile(filePath);
    
    if (!success) {
      console.error(`❌ Échec de l'exécution de ${script}`);
      console.log('🛑 Arrêt de la migration');
      process.exit(1);
    }
    
    console.log(`✅ ${script} terminé avec succès`);
  }
  
  console.log('\n🎉 MIGRATION HOUSEHOLD TERMINÉE AVEC SUCCÈS');
  console.log('=====================================');
}

// Fonction alternative si exec_sql n'existe pas
async function executeQueriesManually() {
  console.log('🏠 MIGRATION HOUSEHOLD - MODE MANUEL');
  console.log('=====================================');
  
  try {
    // Étape 1: Créer les tables
    console.log('\n1️⃣ Création des tables...');
    
    const createTablesSQL = `
      -- Créer la table households
      CREATE TABLE IF NOT EXISTS public.households (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        name text,
        join_code text UNIQUE NOT NULL,
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
        updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
        CONSTRAINT households_pkey PRIMARY KEY (id)
      );
      
      -- Créer la table user_household
      CREATE TABLE IF NOT EXISTS public.user_household (
        user_id uuid NOT NULL,
        household_id uuid NOT NULL,
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
        CONSTRAINT user_household_pkey PRIMARY KEY (user_id),
        CONSTRAINT user_household_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."User"(id) ON DELETE CASCADE,
        CONSTRAINT user_household_household_id_fkey FOREIGN KEY (household_id) REFERENCES public.households(id) ON DELETE CASCADE
      );
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTablesSQL });
    if (createError) {
      console.error('❌ Erreur création tables:', createError);
      return;
    }
    console.log('✅ Tables créées');
    
    // Étape 2: Créer les indexes
    console.log('\n2️⃣ Création des indexes...');
    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_households_join_code ON public.households(join_code);
      CREATE INDEX IF NOT EXISTS idx_user_household_user_id ON public.user_household(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_household_household_id ON public.user_household(household_id);
    `;
    
    const { error: indexError } = await supabase.rpc('exec_sql', { sql: createIndexesSQL });
    if (indexError) {
      console.error('❌ Erreur création indexes:', indexError);
      return;
    }
    console.log('✅ Indexes créés');
    
    // Étape 3: Activer RLS
    console.log('\n3️⃣ Activation RLS...');
    const enableRLSSQL = `
      ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.user_household ENABLE ROW LEVEL SECURITY;
    `;
    
    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: enableRLSSQL });
    if (rlsError) {
      console.error('❌ Erreur activation RLS:', rlsError);
      return;
    }
    console.log('✅ RLS activé');
    
    // Étape 4: Créer les policies
    console.log('\n4️⃣ Création des policies...');
    const createPoliciesSQL = `
      -- Policies pour households
      DROP POLICY IF EXISTS "Users can view their own household" ON public.households;
      CREATE POLICY "Users can view their own household" ON public.households FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.user_household 
          WHERE user_household.household_id = households.id 
          AND user_household.user_id = auth.uid()
        )
      );
      
      DROP POLICY IF EXISTS "Users can update their own household" ON public.households;
      CREATE POLICY "Users can update their own household" ON public.households FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM public.user_household 
          WHERE user_household.household_id = households.id 
          AND user_household.user_id = auth.uid()
        )
      );
      
      DROP POLICY IF EXISTS "Authenticated users can create households" ON public.households;
      CREATE POLICY "Authenticated users can create households" ON public.households FOR INSERT WITH CHECK (auth.role() = 'authenticated');
      
      -- Policies pour user_household
      DROP POLICY IF EXISTS "Users can view their own household membership" ON public.user_household;
      CREATE POLICY "Users can view their own household membership" ON public.user_household FOR SELECT USING (auth.uid() = user_id);
      
      DROP POLICY IF EXISTS "Users can manage their own household membership" ON public.user_household;
      CREATE POLICY "Users can manage their own household membership" ON public.user_household FOR ALL USING (auth.uid() = user_id);
    `;
    
    const { error: policyError } = await supabase.rpc('exec_sql', { sql: createPoliciesSQL });
    if (policyError) {
      console.error('❌ Erreur création policies:', policyError);
      return;
    }
    console.log('✅ Policies créées');
    
    // Étape 5: Créer la fonction generate_join_code
    console.log('\n5️⃣ Création de la fonction generate_join_code...');
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION generate_join_code()
      RETURNS text AS $$
      DECLARE
        code text;
        counter integer := 0;
      BEGIN
        LOOP
          code := upper(substring(md5(random()::text) from 1 for 6));
          IF NOT EXISTS (SELECT 1 FROM public.households WHERE join_code = code) THEN
            RETURN code;
          END IF;
          counter := counter + 1;
          IF counter > 100 THEN
            RAISE EXCEPTION 'Impossible de générer un code unique après 100 tentatives';
          END IF;
        END LOOP;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    const { error: functionError } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });
    if (functionError) {
      console.error('❌ Erreur création fonction:', functionError);
      return;
    }
    console.log('✅ Fonction créée');
    
    // Étape 6: Migrer les utilisateurs
    console.log('\n6️⃣ Migration des utilisateurs...');
    
    // D'abord, récupérer tous les utilisateurs
    const { data: users, error: usersError } = await supabase
      .from('User')
      .select('id, first_name, email');
    
    if (usersError) {
      console.error('❌ Erreur récupération utilisateurs:', usersError);
      return;
    }
    
    console.log(`📊 ${users.length} utilisateurs trouvés`);
    
    // Créer une household pour chaque utilisateur
    for (const user of users) {
      const householdName = `Cave de ${user.first_name || 'Utilisateur'}`;
      
      // Générer un join_code unique
      const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Créer la household
      const { data: household, error: householdError } = await supabase
        .from('households')
        .insert({
          name: householdName,
          join_code: joinCode
        })
        .select()
        .single();
      
      if (householdError) {
        console.error(`❌ Erreur création household pour ${user.email}:`, householdError);
        continue;
      }
      
      // Associer l'utilisateur à sa household
      const { error: membershipError } = await supabase
        .from('user_household')
        .insert({
          user_id: user.id,
          household_id: household.id
        });
      
      if (membershipError) {
        console.error(`❌ Erreur association household pour ${user.email}:`, membershipError);
        continue;
      }
      
      console.log(`✅ ${user.email} -> ${householdName} (${joinCode})`);
    }
    
    console.log('\n🎉 MIGRATION TERMINÉE AVEC SUCCÈS');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécution
if (require.main === module) {
  executeQueriesManually();
} 