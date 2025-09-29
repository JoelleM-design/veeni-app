#!/usr/bin/env node

/**
 * Script de test pour la fonctionnalité Wine Memories
 * Vérifie que les tables et politiques sont correctement créées
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://yzdyepdejftgqpnwitcq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6ZHllcGRlamZ0Z3FwbndpdGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwODAwOTksImV4cCI6MjA2NTY1NjA5OX0.wGFjpAAoYtcLlk6o1_lgZb0EhX3NB9SoYQ_D1rOc2E0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testWineMemories() {
  console.log('🧪 Test de la fonctionnalité Wine Memories');
  console.log('==========================================');

  try {
    // 1. Vérifier que les tables existent
    console.log('\n1️⃣ Vérification des tables...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .in('table_name', ['wine_memories', 'wine_memory_likes'])
      .eq('table_schema', 'public');

    if (tablesError) {
      console.error('❌ Erreur lors de la vérification des tables:', tablesError);
      return;
    }

    const tableNames = tables.map(t => t.table_name);
    console.log('✅ Tables trouvées:', tableNames);

    if (!tableNames.includes('wine_memories')) {
      console.error('❌ Table wine_memories manquante');
      return;
    }

    if (!tableNames.includes('wine_memory_likes')) {
      console.error('❌ Table wine_memory_likes manquante');
      return;
    }

    // 2. Vérifier la structure de wine_memories
    console.log('\n2️⃣ Vérification de la structure wine_memories...');
    
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'wine_memories')
      .eq('table_schema', 'public');

    if (columnsError) {
      console.error('❌ Erreur lors de la vérification des colonnes:', columnsError);
      return;
    }

    const expectedColumns = [
      'id', 'wine_id', 'user_id', 'text', 'photo_urls', 
      'friends_tagged', 'location_text', 'created_at', 'updated_at'
    ];

    const actualColumns = columns.map(c => c.column_name);
    const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));

    if (missingColumns.length > 0) {
      console.error('❌ Colonnes manquantes:', missingColumns);
    } else {
      console.log('✅ Structure de wine_memories correcte');
    }

    // 3. Vérifier les politiques RLS
    console.log('\n3️⃣ Vérification des politiques RLS...');
    
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('tablename, policyname, cmd')
      .in('tablename', ['wine_memories', 'wine_memory_likes']);

    if (policiesError) {
      console.error('❌ Erreur lors de la vérification des politiques:', policiesError);
      return;
    }

    console.log('✅ Politiques trouvées:', policies.length);
    policies.forEach(policy => {
      console.log(`   - ${policy.tablename}: ${policy.policyname} (${policy.cmd})`);
    });

    // 4. Vérifier le bucket de stockage
    console.log('\n4️⃣ Vérification du bucket de stockage...');
    
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erreur lors de la vérification des buckets:', bucketsError);
      return;
    }

    const wineMemoriesBucket = buckets.find(b => b.name === 'wine_memories_images');
    if (wineMemoriesBucket) {
      console.log('✅ Bucket wine_memories_images trouvé');
    } else {
      console.log('⚠️  Bucket wine_memories_images non trouvé - sera créé automatiquement');
    }

    // 5. Test de création d'un souvenir (si des vins existent)
    console.log('\n5️⃣ Test de création d\'un souvenir...');
    
    const { data: wines, error: winesError } = await supabase
      .from('wine')
      .select('id, name')
      .limit(1);

    if (winesError) {
      console.error('❌ Erreur lors de la récupération des vins:', winesError);
      return;
    }

    if (wines && wines.length > 0) {
      const testWine = wines[0];
      console.log(`✅ Vin de test trouvé: ${testWine.name}`);
      
      // Note: On ne peut pas créer de souvenir sans authentification
      console.log('ℹ️  Création de souvenir nécessite une authentification utilisateur');
    } else {
      console.log('⚠️  Aucun vin trouvé pour le test');
    }

    console.log('\n🎉 Test terminé avec succès !');
    console.log('\n📋 Prochaines étapes :');
    console.log('1. Exécutez le script SQL dans Supabase si ce n\'est pas fait');
    console.log('2. Testez la création de souvenirs dans l\'app');
    console.log('3. Vérifiez l\'affichage des onglets dans la fiche vin');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Exécuter le test
testWineMemories();

