const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration Supabase
const supabaseUrl = 'https://yzdyepdejftgqpnwitcq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6ZHllcGRlanN0Z3FwbndpdGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI5NzQsImV4cCI6MjA1MDU0ODk3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOCR() {
  try {
    console.log('🧪 Test de l\'Edge Function OCR...');
    
    // Connexion avec le compte utilisateur
    console.log('🔐 Connexion...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'wspt.joelle@gmail.com',
      password: 'Jojo2018'
    });

    if (authError) {
      console.error('❌ Erreur de connexion:', authError.message);
      return;
    }
    
    console.log('✅ Connexion réussie');
    
    // Créer une image de test simple (base64 d'une image 1x1 pixel)
    const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    console.log('📤 Envoi de la requête...');
    
    const { data, error } = await supabase.functions.invoke('ocr-scan', {
      body: { 
        images: [testImage]
      },
      headers: {
        'Authorization': `Bearer ${authData.session.access_token}`
      }
    });

    if (error) {
      console.error('❌ Erreur:', error);
      return;
    }

    console.log('✅ Réponse reçue:');
    console.log('Success:', data.success);
    console.log('API utilisée:', data.api_used);
    console.log('Vins détectés:', data.wines?.length || 0);
    
    if (data.wines && data.wines.length > 0) {
      console.log('🍷 Premier vin:');
      console.log('  - Nom:', data.wines[0].name);
      console.log('  - Millésime:', data.wines[0].vintage);
      console.log('  - Type:', data.wines[0].type);
      console.log('  - Région:', data.wines[0].region);
      console.log('  - Appellation:', data.wines[0].appellation);
      console.log('  - Pays:', data.wines[0].country);
      console.log('  - Source:', data.wines[0].source);
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

testOCR(); 