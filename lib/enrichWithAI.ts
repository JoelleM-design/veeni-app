import { supabase } from './supabase';

export interface ParsedWine {
  name: string;
  producer?: string;
  year?: number;
  grapeVariety?: string[];
  wineType?: 'red' | 'white' | 'rosé' | 'sparkling';
  region?: string;
  appellation?: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface EnrichmentRequest {
  ocrText: string;
  currentParsing: Partial<ParsedWine>;
  missingFields: string[];
}

export interface EnrichmentResponse {
  success: boolean;
  data?: ParsedWine;
  error?: string;
}

/**
 * Enrichit les données OCR avec l'IA quand le parsing local échoue
 */
export async function enrichWithAI(
  ocrText: string,
  currentParsing: Partial<ParsedWine>,
  missingFields: string[]
): Promise<EnrichmentResponse> {
  try {
    console.log('🔍 Enrichissement IA demandé pour:', { ocrText, missingFields });
    
    const request: EnrichmentRequest = {
      ocrText,
      currentParsing,
      missingFields
    };

    // Appel à la Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('ocr-enrich', {
      body: request
    });

    if (error) {
      console.error('❌ Erreur enrichissement IA:', error);
      return {
        success: false,
        error: error.message
      };
    }

    console.log('✅ Enrichissement IA réussi:', data);
    
    return {
      success: true,
      data: data as ParsedWine
    };

  } catch (error) {
    console.error('❌ Exception enrichissement IA:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Détermine si l'enrichissement IA est nécessaire
 */
export function needsEnrichment(parsedWine: Partial<ParsedWine>): {
  needsEnrichment: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];
  
  // Champs critiques manquants
  if (!parsedWine.name || parsedWine.name.length < 3) {
    missingFields.push('name');
  }
  
  if (!parsedWine.year) {
    missingFields.push('year');
  }
  
  if (!parsedWine.wineType) {
    missingFields.push('wineType');
  }
  
  // Champs secondaires manquants
  if (!parsedWine.producer) {
    missingFields.push('producer');
  }
  
  if (!parsedWine.region) {
    missingFields.push('region');
  }
  
  if (!parsedWine.grapeVariety || parsedWine.grapeVariety.length === 0) {
    missingFields.push('grapeVariety');
  }
  
  // Enrichissement nécessaire si au moins 2 champs critiques manquent
  const criticalMissing = missingFields.filter(field => 
    ['name', 'year', 'wineType'].includes(field)
  );
  
  const needsEnrichment = criticalMissing.length >= 2 || 
                         (criticalMissing.length >= 1 && missingFields.length >= 3);
  
  return {
    needsEnrichment,
    missingFields
  };
} 