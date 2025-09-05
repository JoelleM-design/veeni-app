import { Wine } from '../types/wine';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingWine?: Wine;
  duplicateType: 'exact' | 'similar' | 'none';
  reason?: string;
}

/**
 * Vérifie si un vin est un doublon d'un vin existant
 * @param newWine Le nouveau vin à vérifier
 * @param existingWines La liste des vins existants
 * @returns Résultat de la vérification
 */
export function checkWineDuplicate(newWine: Wine, existingWines: Wine[]): DuplicateCheckResult {
  console.log('🔍 checkWineDuplicate - Nouveau vin:', {
    name: newWine.name,
    domaine: newWine.domaine,
    vintage: newWine.vintage,
    region: newWine.region,
    color: newWine.color
  });
  
  console.log('🔍 checkWineDuplicate - Vins existants:', existingWines.map(w => ({
    name: w.name,
    domaine: w.domaine,
    vintage: w.vintage,
    region: w.region,
    color: w.color
  })));

  // Normaliser les données pour la comparaison
  const normalizeString = (str: string) => 
    str.toLowerCase().trim().replace(/[^\w\s]/g, '');

  const normalizeWine = (wine: Wine) => ({
    name: normalizeString(wine.name || ''),
    domaine: normalizeString(wine.domaine || ''),
    vintage: wine.vintage || 0,
    region: normalizeString(wine.region || ''),
    color: wine.color
  });

  const normalizedNewWine = normalizeWine(newWine);
  console.log('🔍 checkWineDuplicate - Vin normalisé:', normalizedNewWine);

  for (const existingWine of existingWines) {
    const normalizedExisting = normalizeWine(existingWine);
    console.log('🔍 checkWineDuplicate - Comparaison avec:', normalizedExisting);

    // Vérification exacte : même nom, domaine, millésime, région et couleur
    if (
      normalizedNewWine.name === normalizedExisting.name &&
      normalizedNewWine.domaine === normalizedExisting.domaine &&
      normalizedNewWine.vintage === normalizedExisting.vintage &&
      normalizedNewWine.region === normalizedExisting.region &&
      normalizedNewWine.color === normalizedExisting.color
    ) {
      console.log('🚫 DOUBLON EXACT DÉTECTÉ!');
      return {
        isDuplicate: true,
        existingWine,
        duplicateType: 'exact',
        reason: 'Vin identique trouvé (même nom, domaine, millésime, région et couleur)'
      };
    }

    // Vérification similaire : même nom et domaine mais millésime différent
    if (
      normalizedNewWine.name === normalizedExisting.name &&
      normalizedNewWine.domaine === normalizedExisting.domaine &&
      normalizedNewWine.vintage !== normalizedExisting.vintage &&
      normalizedNewWine.region === normalizedExisting.region &&
      normalizedNewWine.color === normalizedExisting.color
    ) {
      console.log('ℹ️ VIN SIMILAIRE DÉTECTÉ!');
      return {
        isDuplicate: false,
        existingWine,
        duplicateType: 'similar',
        reason: `Vin similaire trouvé avec un millésime différent (${normalizedExisting.vintage} vs ${normalizedNewWine.vintage})`
      };
    }
  }

  console.log('✅ Aucun doublon détecté');
  return {
    isDuplicate: false,
    duplicateType: 'none'
  };
}

/**
 * Génère un message d'erreur pour les doublons
 */
export function getDuplicateErrorMessage(result: DuplicateCheckResult, targetList: 'cellar' | 'wishlist'): string {
  if (!result.isDuplicate) {
    return '';
  }

  if (targetList === 'wishlist') {
    return `Vous avez déjà ce vin dans votre liste d'envies. Les doublons ne sont pas autorisés dans la wishlist.`;
  } else {
    return `Vous avez déjà ce vin dans votre cave. Voulez-vous ajouter une bouteille supplémentaire ?`;
  }
}

/**
 * Génère un message d'information pour les vins similaires
 */
export function getSimilarWineMessage(result: DuplicateCheckResult): string {
  if (result.duplicateType === 'similar' && result.existingWine) {
    return `Vin similaire trouvé : ${result.existingWine.name} ${result.existingWine.vintage} (${result.existingWine.domaine}). Le nouveau vin sera ajouté car il s'agit d'un millésime différent.`;
  }
  return '';
}
