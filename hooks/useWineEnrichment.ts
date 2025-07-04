import { useCallback } from 'react';

// Types pour les données de vin
interface WineData {
  id: string;
  name: string;
  vintage?: number;
  type: 'red' | 'white' | 'rosé' | 'sparkling';
  country?: string;
  region?: string;
  appellation?: string;
  grapes?: string[];
  producer?: string;
  photo: string;
}

// --- Fonctions utilitaires pour améliorer l'analyse OCR ---

// Mots à ignorer car non pertinents pour les noms de vins
const IGNORED_WORDS = [
  'SERVICE', 'CARAFAGE', 'ADEGUSTER', 'ACCORD', 'PARFAIT', 'COTE', 'FOURCHETTE', 'DET', 'VIANDES',
  'APPELLATION', 'D\'ORIGINE', 'PROTEGEE', 'CUVEE', 'PRESTIGE', 'MAISON', 'VIN', 'ROUGE', 'BLANC',
  'ROSE', 'CHAMPAGNE', 'BOUTEILLE', 'BOTTLE', 'MILLILITRES', 'ML', 'ALCOOL', 'VOL', 'CONTIENT',
  'SULFITES', 'PRODUIT', 'FRANCE', 'ESPAGNE', 'ITALIE', 'ALLEMAGNE', 'PORTUGAL', 'AUTRICHE',
  'SUISSE', 'LUXEMBOURG', 'BELGIQUE', 'PAYS-BAS', 'DANEMARK', 'SUEDE', 'NORVEGE', 'FINLANDE'
];

function cleanOcrText(text: string): string {
  if (!text) return '';
  
  // Supprimer les mots non pertinents
  let cleaned = text.toUpperCase();
  IGNORED_WORDS.forEach(word => {
    cleaned = cleaned.replace(new RegExp(`\\b${word}\\b`, 'g'), '');
  });
  
  // Nettoyer les espaces multiples et caractères spéciaux
  cleaned = cleaned
    .replace(/\s+/g, ' ')
    .replace(/[^A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ\s\-']/g, '')
    .trim();
  
  // Si le texte est trop court après nettoyage, retourner l'original
  if (cleaned.length < 3) {
    return text;
  }
  
  // Mettre en forme : première lettre majuscule, reste en minuscule
  return cleaned
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(/\s+/g, ' ');
}

function removeAllCaps(text: string): string {
  if (!text) return '';
  
  // Si le texte est tout en majuscules, le convertir en format normal
  if (text === text.toUpperCase() && text.length > 3) {
    return text
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/\s+/g, ' ');
  }
  
  return text;
}

function extractVintage(text: string): number | undefined {
  if (!text) return undefined;
  
  // Chercher un millésime (4 chiffres entre 1900 et 2030)
  const vintageMatch = text.match(/\b(19[0-9]{2}|20[0-2][0-9]|2030)\b/);
  if (vintageMatch) {
    const vintage = parseInt(vintageMatch[1]);
    if (vintage >= 1900 && vintage <= 2030) {
      return vintage;
    }
  }
  
  return undefined;
}

function extractDomain(text: string): string {
  if (!text) return 'Domaine inconnu';
  
  const domainKeywords = [
    'CHÂTEAU', 'CHATEAU', 'DOMAINE', 'DOMAIN', 'CLOS', 'MAS', 'VILLA', 'CASTELLO',
    'BODEGA', 'WEINGUT', 'WEINGUT', 'CANTINA', 'QUINTA', 'FINCA', 'HACIENDA'
  ];
  
  const words = text.toUpperCase().split(/\s+/);
  
  for (let i = 0; i < words.length - 1; i++) {
    if (domainKeywords.includes(words[i])) {
      // Prendre le mot suivant comme nom du domaine
      const domainName = words.slice(i + 1, i + 4).join(' '); // Prendre jusqu'à 3 mots
      if (domainName.length > 2) {
        return domainName
          .toLowerCase()
          .replace(/\b\w/g, l => l.toUpperCase());
      }
    }
  }
  
  return 'Domaine inconnu';
}

function extractRegion(text: string): string {
  if (!text) return '';
  
  const regionKeywords = [
    'BORDEAUX', 'BURGUNDY', 'BEAUJOLAIS', 'RHÔNE', 'RHONE', 'LOIRE', 'ALSACE',
    'CHAMPAGNE', 'PROVENCE', 'LANGUEDOC', 'ROUSSILLON', 'SUD-OUEST', 'JURA',
    'SAVOIE', 'CORSICA', 'CORSE', 'RIOJA', 'RIBERA', 'TORO', 'PRIORAT',
    'TOSCANA', 'PIEMONTE', 'VENETO', 'SICILIA', 'PUGLIA', 'MOSEL', 'RHEIN',
    'PFALZ', 'BADEN', 'WURTTEMBERG', 'PORTUGAL', 'DOURO', 'ALENTEJO'
  ];
  
  const words = text.toUpperCase().split(/\s+/);
  
  for (const word of words) {
    if (regionKeywords.includes(word)) {
      return word
        .toLowerCase()
        .replace(/\b\w/g, l => l.toUpperCase());
    }
  }
  
  return '';
}

function extractGrapes(text: string): string[] {
  if (!text) return [];
  
  const grapeVarieties = [
    'CABERNET', 'SAUVIGNON', 'MERLOT', 'PINOT', 'NOIR', 'CHARDONNAY', 'SYRAH',
    'GRENACHE', 'TEMPRANILLO', 'SANGIOVESE', 'NEBBIOLO', 'BARBERA', 'DOLCETTO',
    'MALBEC', 'CARMENERE', 'PETIT', 'VERDOT', 'CABERNET', 'FRANC', 'GAMAY',
    'BEAUJOLAIS', 'VIOGNIER', 'ROUSSANNE', 'MARSANNE', 'CHENIN', 'BLANC',
    'SAUVIGNON', 'BLANC', 'SEMILLON', 'MUSCADET', 'MELON', 'BURGUNDY',
    'PINOT', 'GRIS', 'GEWURZTRAMINER', 'RIESLING', 'SILVANER', 'MULLER',
    'THURGAU', 'GARNACHA', 'MONASTRELL', 'GRAZIANO', 'CORVINA', 'RONDINELLA',
    'MOLINARA', 'NEGROAMARO', 'PRIMITIVO', 'AGLIANICO', 'NERO', 'D\'AVOLA'
  ];
  
  const foundGrapes: string[] = [];
  const words = text.toUpperCase().split(/\s+/);
  
  for (const word of words) {
    if (grapeVarieties.includes(word) && !foundGrapes.includes(word)) {
      foundGrapes.push(word);
    }
  }
  
  return foundGrapes.slice(0, 3); // Limiter à 3 cépages max
}

export function useWineEnrichment() {
  const enrichWine = useCallback((ocrData: any): WineData => {
    console.log('Données OCR brutes:', ocrData);
    
    // Nettoyage et extraction
    let name = cleanOcrText(removeAllCaps(ocrData.name || ''));
    let vintage = extractVintage(ocrData.name || '');
    let domaine = extractDomain(ocrData.name || '');
    let region = extractRegion(ocrData.name || '');
    let grapes = extractGrapes(ocrData.name || '');
    
    // Si le nom est trop court ou non pertinent, essayer d'extraire du domaine
    if (name.length < 5 || IGNORED_WORDS.some(word => name.toUpperCase().includes(word))) {
      if (domaine !== 'Domaine inconnu') {
        name = domaine;
        domaine = 'Domaine inconnu';
      }
    }
    
    // Détection du type de vin basée sur les mots-clés
    let type: 'red' | 'white' | 'rosé' | 'sparkling' = 'red';
    const text = (ocrData.name || '').toUpperCase();
    if (text.includes('CHAMPAGNE') || text.includes('MOUSSEUX') || text.includes('SPARKLING')) {
      type = 'sparkling';
    } else if (text.includes('BLANC') || text.includes('WHITE')) {
      type = 'white';
    } else if (text.includes('ROSE') || text.includes('ROSÉ')) {
      type = 'rosé';
    }
    
    const enrichedWine: WineData = {
      id: ocrData.id || `ocr-${Date.now()}`,
      name: name || 'Vin sans nom',
      vintage: vintage,
      type: type,
      country: region || undefined,
      region: region || undefined,
      appellation: region || undefined,
      grapes: grapes,
      producer: domaine !== 'Domaine inconnu' ? domaine : undefined,
      photo: ocrData.photo || ''
    };
    
    console.log('Vin enrichi:', enrichedWine);
    return enrichedWine;
  }, []);

  return { enrichWine };
} 