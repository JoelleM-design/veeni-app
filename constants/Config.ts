// Configuration des clés API
export const CONFIG = {
  // Google Vision API Key - REMPLACER PAR VOTRE VRAIE CLÉ
  // Obtenir sur : https://console.cloud.google.com/apis/credentials
  GOOGLE_VISION_API_KEY: 'AIzaSyB...', // Remplacer par votre vraie clé
  
  // Supabase
  SUPABASE_URL: 'https://yzdyepdejftgqpnwitcq.supabase.co',
  SUPABASE_ANON_KEY: 'your_supabase_anon_key_here',
};

// Log de vérification
console.log('🔧 CONFIG chargé - Clé Google Vision:', CONFIG.GOOGLE_VISION_API_KEY.substring(0, 10) + '...'); 