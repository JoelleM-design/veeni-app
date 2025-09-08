import { detectFrenchAppellation } from './frenchAppellations';

export interface ImprovedParsedWine {
  name: string;
  domaine: string;
  vintage: number;
  color: 'red' | 'white' | 'rosé' | 'sparkling';
  country: string;
  region: string;
  appellation: string;
  grapes: string[];
  confiance: number;
}

// Fonction améliorée pour analyser le texte OCR
export function parseWineOcrImproved(rawText: string): ImprovedParsedWine {
  console.log('🔍 Analyse OCR améliorée:', rawText.substring(0, 200) + '...');
  
  let text = rawText;
  
  // 1. Nettoyage de base
  text = text.replace(/[!@#$%^&*_+=\[\]{}|;:'",<>/?~`]/g, ' ');
  
  // 2. Détection de l'appellation française
  const appellationData = detectFrenchAppellation(text);
  
  // 3. Extraction de l'année
  const yearMatch = text.match(/\b(19[8-9]\d|20[0-3]\d)\b/);
  const vintage = yearMatch ? parseInt(yearMatch[0]) : 0;
  
  // 4. Détection du type de vin
  let color: 'red' | 'white' | 'rosé' | 'sparkling' = 'red';
  const upperText = text.toUpperCase();
  if (upperText.includes('CHAMPAGNE') || upperText.includes('CRÉMANT') || upperText.includes('SPARKLING')) {
    color = 'sparkling';
  } else if (upperText.includes('BLANC') || upperText.includes('WHITE')) {
    color = 'white';
  } else if (upperText.includes('ROSÉ') || upperText.includes('ROSE')) {
    color = 'rosé';
  }
  
  // 5. Extraction du nom et du domaine
  const lines = text.split(/\n|\r/).map(l => l.trim()).filter(Boolean);
  let name = '';
  let domaine = '';
  
  // Chercher le domaine en premier
  for (const line of lines) {
    if (/CH[ÂA]TEAU|DOMAINE|CLOS|MAISON/i.test(line)) {
      domaine = line;
      break;
    }
  }
  
  // Le nom est la ligne la plus longue qui n'est pas le domaine
  const nameLines = lines.filter(line => 
    line !== domaine && 
    line.length > 3 && 
    !line.match(/^\d{4}$/) && // Pas une année
    !line.match(/^(ROUGE|BLANC|ROSÉ|ROSE)$/i) // Pas un type
  );
  
  if (nameLines.length > 0) {
    name = nameLines.reduce((longest, current) => 
      current.length > longest.length ? current : longest
    );
  }
  
  if (!name) name = 'Vin sans nom';
  if (!domaine) domaine = 'Domaine inconnu';
  
  // 6. Cépages basiques
  const basicGrapes = ['CABERNET', 'MERLOT', 'SYRAH', 'CHARDONNAY', 'SAUVIGNON', 'PINOT'];
  const grapes = basicGrapes.filter(grape => 
    upperText.includes(grape)
  );
  
  // 7. Calcul de la confiance
  let confiance = 50; // Base
  if (appellationData) confiance += 30;
  if (vintage > 0) confiance += 10;
  if (name.length > 5) confiance += 10;
  if (domaine !== 'Domaine inconnu') confiance += 10;
  
  const result: ImprovedParsedWine = {
    name,
    domaine,
    vintage,
    color,
    country: appellationData?.country || '',
    region: appellationData?.region || '',
    appellation: appellationData?.appellation || '',
    grapes,
    confiance: Math.min(confiance, 100)
  };
  
  console.log('✅ Résultat OCR amélioré:', result);
  return result;
}
