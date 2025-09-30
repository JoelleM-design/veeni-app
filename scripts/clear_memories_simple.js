#!/usr/bin/env node

/**
 * Script simple pour supprimer tous les souvenirs
 * Utilise l'API REST de Supabase directement
 */

const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL || "https://yzdyepdejftgqpnwitcq.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY manquante dans les variables d\'environnement');
  process.exit(1);
}

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'yzdyepdejftgqpnwitcq.supabase.co',
      port: 443,
      path: `/rest/v1/${path}`,
      method: method,
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = body ? JSON.parse(body) : null;
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function clearMemories() {
  console.log('🧹 Suppression des souvenirs...');

  try {
    // 1. Supprimer les likes d'abord
    console.log('🗑️ Suppression des likes...');
    const likesResult = await makeRequest('wine_memory_likes', 'DELETE');
    console.log('✅ Likes supprimés:', likesResult.status);

    // 2. Supprimer les souvenirs
    console.log('🗑️ Suppression des souvenirs...');
    const memoriesResult = await makeRequest('wine_memories', 'DELETE');
    console.log('✅ Souvenirs supprimés:', memoriesResult.status);

    // 3. Vérifier
    console.log('🔍 Vérification...');
    const checkMemories = await makeRequest('wine_memories?select=count');
    const checkLikes = await makeRequest('wine_memory_likes?select=count');
    
    console.log('📊 Résultat:', {
      memories: checkMemories.data,
      likes: checkLikes.data
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

clearMemories();