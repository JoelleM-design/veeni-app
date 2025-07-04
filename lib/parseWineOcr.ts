// parseWineOcr.ts
// Transforme un texte OCR en structure vin exploitable
import { knownGrapes, KnownGrapes } from '../constants/grapes';
import { knownRegions, KnownRegions } from '../constants/regions';

export interface ParsedWine {
  name: string;
  producer: string;
  year: string;
  grapeVarieties: string[];
  wineType: 'red' | 'white' | 'rosé' | 'sparkling' | '';
  region: string;
  rawText: string;
  uncertainFields?: (keyof ParsedWine)[];
}

const ocrCorrections: Record<string, string> = {
  'PROTEGION': 'PROTECTION',
  'APPELLATON': 'APPELLATION',
  'CHATEU': 'CHÂTEAU',
  'DOMNE': 'DOMAINE',
  // ... autres corrections fréquentes
};

const wineTypeKeywords = [
  { type: 'red', keywords: ['ROUGE', 'RED'] },
  { type: 'white', keywords: ['BLANC', 'WHITE'] },
  { type: 'rosé', keywords: ['ROSÉ', 'ROSE'] },
  { type: 'sparkling', keywords: ['EFFERVESCENT', 'SPARKLING', 'MOUSSEUX', 'CHAMPAGNE'] },
];

export function parseWineOcr(rawText: string): ParsedWine {
  let text = rawText;
  // 1. Nettoyage de base
  text = text.replace(/[!@#$%^&*_+=\[\]{}|;:'",<>/?~`]/g, ' ');
  // 2. Corrections OCR
  for (const [wrong, right] of Object.entries(ocrCorrections)) {
    text = text.replace(new RegExp(wrong, 'gi'), right);
  }
  // 3. Split lignes et mots
  const lines = text.split(/\n|\r/).map(l => l.trim()).filter(Boolean);
  const words = text.split(/\s+/);

  // 4. Extraction année
  const yearMatch = text.match(/\b(19[8-9]\d|20[0-3]\d)\b/);
  const year = yearMatch ? yearMatch[0] : '';

  // 5. Extraction type de vin
  let wineType: ParsedWine['wineType'] = '';
  for (const { type, keywords } of wineTypeKeywords) {
    if (keywords.some(k => text.toUpperCase().includes(k))) {
      wineType = type as ParsedWine['wineType'];
      break;
    }
  }

  // 6. Extraction cépages
  const grapeVarieties = (knownGrapes as KnownGrapes).filter((grape: string) =>
    text.toUpperCase().includes(grape.toUpperCase())
  );

  // 7. Extraction région/appellation
  let region = '';
  for (const reg of knownRegions as KnownRegions) {
    if (text.toUpperCase().includes(reg.toUpperCase())) {
      region = reg;
      break;
    }
  }

  // 8. Extraction producteur
  let producer = '';
  for (const line of lines) {
    if (/CH[ÂA]TEAU|DOMAINE|CLOS|MAISON/i.test(line)) {
      producer = line;
      break;
    }
  }
  if (!producer) producer = 'Domaine inconnu';

  // 9. Extraction nom (ligne la plus longue hors producteur/région/année)
  let name = lines
    .filter(l => l !== producer && !l.includes(year) && !l.includes(region))
    .sort((a, b) => b.length - a.length)[0] || '';

  // 10. Champs incertains
  const uncertainFields: (keyof ParsedWine)[] = [];
  if (!name) uncertainFields.push('name');
  if (!producer || producer === 'Domaine inconnu') uncertainFields.push('producer');
  if (!year) uncertainFields.push('year');
  if (!grapeVarieties.length) uncertainFields.push('grapeVarieties');
  if (!wineType) uncertainFields.push('wineType');
  if (!region) uncertainFields.push('region');

  return {
    name,
    producer,
    year,
    grapeVarieties,
    wineType,
    region,
    rawText,
    uncertainFields,
  };
} 