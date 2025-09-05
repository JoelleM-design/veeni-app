/**
 * Fonction de débogage pour détecter les objets non sérialisés dans un vin
 */
export const debugWine = (wine: any) => {
  console.log('🔍 Début du débogage du vin:', wine.id || 'ID inconnu');
  
  for (const [key, value] of Object.entries(wine)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      console.log(`🔍 ${key}:`, value);
    }
  }
  
  console.log('🔍 Fin du débogage du vin');
}; 