// Configuration des clés API
export const CONFIG = {
  // Google Vision API Key - Obtenir sur : https://console.cloud.google.com/apis/credentials
  GOOGLE_VISION_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY || '',
  
  // Supabase
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://yzdyepdejftgqpnwitcq.supabase.co',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
};

// Vérification des clés requises
if (!CONFIG.GOOGLE_VISION_API_KEY) {
  console.warn('⚠️ GOOGLE_VISION_API_KEY manquante dans les variables d\'environnement');
}

if (!CONFIG.SUPABASE_ANON_KEY) {
  console.warn('⚠️ SUPABASE_ANON_KEY manquante dans les variables d\'environnement');
}

// Log de vérification (sans exposer la clé)
console.log('🔧 CONFIG chargé - Clé Google Vision:', CONFIG.GOOGLE_VISION_API_KEY ? '✅ Présente' : '❌ Manquante'); 