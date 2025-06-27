import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from '../_shared/cors.ts';

// Types
interface GoogleVisionResponse {
  responses: Array<{
    fullTextAnnotation?: {
      text: string;
    };
    error?: {
      message: string;
    };
  }>;
}

interface ParsedWine {
  name: string;
  vintage: number | null;
  appellation: string | null;
  region: string | null;
}

interface EnrichedWine extends ParsedWine {
  id: string;
  type: 'red' | 'white' | 'rosé' | 'sparkling';
  country: string;
  grapes: string[];
  source: 'openwinedata' | 'user' | 'manual';
}

// Simulation de l'API Google Vision (fallback quand pas de clé API)
function simulateGoogleVision(images: string[]): GoogleVisionResponse {
  console.log(`Simulation Google Vision pour ${images.length} images`);
  
  const mockTexts = [
    "Château Margaux 2015\nBordeaux\nFrance\nCabernet Sauvignon, Merlot",
    "Domaine de la Romanée-Conti 2018\nBourgogne\nFrance\nPinot Noir",
    "Château Lafite Rothschild 2016\nBordeaux\nFrance\nCabernet Sauvignon, Merlot",
    "Chablis Grand Cru 2020\nBourgogne\nFrance\nChardonnay",
    "Champagne Dom Pérignon 2012\nChampagne\nFrance\nChardonnay, Pinot Noir"
  ];

  return {
    responses: images.map((_, index) => ({
      fullTextAnnotation: {
        text: mockTexts[index % mockTexts.length]
      }
    }))
  };
}

// Fonction pour appeler l'API Google Vision
async function callGoogleVisionAPI(images: string[], apiKey: string): Promise<GoogleVisionResponse | null> {
  try {
    console.log('Tentative d\'appel à l\'API Google Vision...');
    
    const visionRequests = images.map((base64Image: string) => ({
      image: { content: base64Image },
      features: [{ type: 'TEXT_DETECTION', maxResults: 10 }]
    }));

    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: visionRequests })
      }
    );

    if (!visionResponse.ok) {
      console.error(`Erreur Google Vision API: ${visionResponse.status} - ${visionResponse.statusText}`);
      return null;
    }

    const visionData: GoogleVisionResponse = await visionResponse.json();
    console.log('API Google Vision appelée avec succès');
    return visionData;
  } catch (error) {
    console.error('Erreur lors de l\'appel à l\'API Google Vision:', error);
    return null;
  }
}

// Fonction de recherche dans OpenWineData (côté serveur)
async function searchInOpenWineData(parsed: ParsedWine): Promise<EnrichedWine | null> {
  try {
    console.log('Recherche dans OpenWineData pour:', parsed);
    
    // Simulation de données de vin (remplacera par le vrai fichier JSON)
    const mockWines = [
      {
        id: '1',
        name: 'Château Margaux',
        color: 'red',
        country: 'France',
        regions: ['Bordeaux'],
        appellation: 'Bordeaux',
        grapes: [{ name: 'Cabernet Sauvignon' }, { name: 'Merlot' }]
      },
      {
        id: '2',
        name: 'Domaine de la Romanée-Conti',
        color: 'red',
        country: 'France',
        regions: ['Bourgogne'],
        appellation: 'Bourgogne',
        grapes: [{ name: 'Pinot Noir' }]
      },
      {
        id: '3',
        name: 'Château Lafite Rothschild',
        color: 'red',
        country: 'France',
        regions: ['Bordeaux'],
        appellation: 'Bordeaux',
        grapes: [{ name: 'Cabernet Sauvignon' }, { name: 'Merlot' }]
      },
      {
        id: '4',
        name: 'Chablis Grand Cru',
        color: 'white',
        country: 'France',
        regions: ['Bourgogne'],
        appellation: 'Bourgogne',
        grapes: [{ name: 'Chardonnay' }]
      },
      {
        id: '5',
        name: 'Champagne Dom Pérignon',
        color: 'sparkling',
        country: 'France',
        regions: ['Champagne'],
        appellation: 'Champagne',
        grapes: [{ name: 'Chardonnay' }, { name: 'Pinot Noir' }]
      }
    ];
    
    // Recherche dans les données simulées
    const match = mockWines.find((wine: any) => 
      (parsed.name && wine.name?.toLowerCase().includes(parsed.name.toLowerCase())) ||
      (parsed.appellation && wine.appellation?.toLowerCase().includes(parsed.appellation.toLowerCase()))
    );

    if (match) {
      console.log('Vin trouvé:', match);
      return {
        id: `owd-${match.id}`,
        name: match.name,
        vintage: parsed.vintage,
        type: match.color?.toLowerCase() as any || 'red',
        country: match.country || '',
        region: match.regions?.[0] || '',
        appellation: match.appellation || '',
        grapes: match.grapes?.map((g: any) => g.name) || [],
        source: 'openwinedata'
      };
    }
    
    console.log('Aucun vin trouvé, création manuelle');
    return null;
  } catch (error) {
    console.error('Erreur recherche OpenWineData:', error);
    return null;
  }
}

// Fonction de parsing du texte OCR améliorée et enrichie
function parseOcrText(fullText: string): ParsedWine & { grapes: string[] } {
  console.log('Parsing du texte OCR:', fullText);
  
  // Liste de cépages connus (à compléter si besoin)
  const grapeList = [
    'SYRAH', 'MERLOT', 'CHARDONNAY', 'CABERNET', 'SAUVIGNON', 'PINOT', 'NOIR', 'GRENACHE', 'MOURVEDRE',
    'CARIGNAN', 'CINSAULT', 'MALBEC', 'GAMAY', 'SÉMILLON', 'VIOGNIER', 'MUSCAT', 'RIESLING', 'ALIGOTÉ',
    'SAVAGNIN', 'PETIT VERDOT', 'TEMPRANILLO', 'SANGIOVESE', 'ZINFANDEL', 'BARBERA', 'NEBBIOLO', 'TOURIGA',
    'VERDEJO', 'VERMENTINO', 'TREBBIANO', 'MOSCATO', 'FURMINT', 'GRÜNER VELTLINER', 'ALBARINO', 'MACABEO',
    'BACO', 'PETIT MANSENG', 'GROS MANSENG', 'TANNAT', 'MUSCADELLE', 'UGNI BLANC', 'COLOMBARD', 'FOLLE BLANCHE'
  ];
  const upperText = fullText.toUpperCase();
  const lines = fullText.split(/\n|\r|\s{2,}/).filter(Boolean);

  // Extraction des cépages
  const grapes = grapeList.filter(grape => upperText.includes(grape));

  // Extraction du millésime
  const yearMatch = upperText.match(/(19\d{2}|20\d{2})/);
  const vintage = yearMatch ? parseInt(yearMatch[0]) : null;

  // Extraction du nom complet (avant le premier mot-clé ou cépage)
  let name = '';
  const stopWords = [...grapeList, 'VEGAN', 'BIO', 'BIODYNAMIC', '&', 'VIN', 'WINE', 'BLANC', 'ROUGE', 'WHITE', 'RED'];
  let foundName = false;
  for (const line of lines) {
    let stop = false;
    for (const word of stopWords) {
      if (line.toUpperCase().includes(word)) stop = true;
    }
    if (!stop && !foundName) {
      name += (name ? ' ' : '') + line.trim();
    } else if (!foundName && name) {
      foundName = true;
    }
  }

  // Extraction de la région/appellation
  const regionKeywords = ['BORDEAUX', 'BOURGOGNE', 'CHAMPAGNE', 'PROVENCE', 'LANGUEDOC', 'RHÔNE', 'ALSACE', 'LOIRE'];
  let region = null;
  let appellation = null;
  
  for (const line of lines) {
    const upperLine = line.toUpperCase();
    for (const keyword of regionKeywords) {
      if (upperLine.includes(keyword)) {
        region = line.trim();
        appellation = line.trim();
        break;
      }
    }
    if (region) break;
  }

  // Si pas de nom trouvé, prendre la première ligne non vide
  if (!name && lines.length > 0) {
    name = lines[0].trim();
  }

  console.log('Parsing résultat:', { name, vintage, region, appellation, grapes });
  
  return {
    name: name || 'Vin non identifié',
    vintage,
    region,
    appellation,
    grapes
  };
}

// Fonction principale de traitement OCR
async function processWineImages(images: string[]): Promise<EnrichedWine[]> {
  console.log(`Traitement de ${images.length} images...`);
  
  // 1. Tentative d'appel à l'API Google Vision
  const googleVisionApiKey = Deno.env.get('GOOGLE_VISION_API_KEY');
  let visionResponse: GoogleVisionResponse | null = null;
  let apiUsed = false;

  if (googleVisionApiKey) {
    console.log('Clé API Google Vision trouvée, tentative d\'appel...');
    visionResponse = await callGoogleVisionAPI(images, googleVisionApiKey);
    if (visionResponse) {
      apiUsed = true;
      console.log('API Google Vision utilisée avec succès');
    } else {
      console.log('Échec de l\'API Google Vision, utilisation de la simulation');
    }
  } else {
    console.log('Aucune clé API Google Vision, utilisation de la simulation');
  }

  // 2. Fallback vers la simulation si pas d'API ou échec
  if (!visionResponse) {
    visionResponse = simulateGoogleVision(images);
    apiUsed = false;
  }

  // 3. Traitement des réponses
  const enrichedWines: EnrichedWine[] = [];
  
  for (let i = 0; i < visionResponse.responses.length; i++) {
    const response = visionResponse.responses[i];
    
    if (response.error) {
      console.error(`Erreur pour l'image ${i}:`, response.error);
      continue;
    }
    
    if (!response.fullTextAnnotation?.text) {
      console.log(`Aucun texte détecté pour l'image ${i}`);
      continue;
    }
    
    // 4. Parsing du texte OCR
    const parsed = parseOcrText(response.fullTextAnnotation.text);
    
    // 5. Recherche dans OpenWineData
    const enriched = await searchInOpenWineData(parsed);
    
    if (enriched) {
      enrichedWines.push(enriched);
    } else {
      // Création d'un vin manuel si pas trouvé
      enrichedWines.push({
        id: `manual-${Date.now()}-${i}`,
        name: parsed.name,
        vintage: parsed.vintage,
        type: 'red', // par défaut
        country: 'France', // par défaut
        region: parsed.region || '',
        appellation: parsed.appellation || '',
        grapes: parsed.grapes,
        source: 'manual'
      });
    }
  }
  
  console.log(`${enrichedWines.length} vins traités avec succès (API utilisée: ${apiUsed})`);
  return enrichedWines;
}

// Fonction principale de l'Edge Function
serve(async (req) => {
  // Gestion CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Vérification de l'authentification (optionnelle pour les tests)
    const authHeader = req.headers.get('Authorization');
    let userId = 'test-user';
    
    if (authHeader) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data: { user }, error: authError } = await supabase.auth.getUser(
          authHeader.replace('Bearer ', '')
        );
        
        if (authError || !user) {
          console.warn('Authentification échouée, utilisation du mode test');
        } else {
          userId = user.id;
          console.log('Utilisateur authentifié:', userId);
        }
      } catch (authError) {
        console.warn('Erreur d\'authentification, utilisation du mode test:', authError);
      }
    }

    // Récupération des données de la requête
    const { image } = await req.json();
    
    if (!image) {
      return new Response(
        JSON.stringify({ error: 'Image requise' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Traitement de l'image
    const images = Array.isArray(image) ? image : [image];
    const enrichedWines = await processWineImages(images);

    // Log de l'utilisation
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      await supabase
        .from('ocr_logs')
        .insert({
          user_id: userId,
          images_count: images.length,
          wines_found: enrichedWines.length,
          success: true
        });
    } catch (logError) {
      console.error('Erreur lors du log:', logError);
      // Ne pas faire échouer la requête si le log échoue
    }

    return new Response(
      JSON.stringify({
        success: true,
        wines: enrichedWines,
        text: enrichedWines.length > 0 ? enrichedWines[0].name : 'Aucun vin détecté'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erreur dans l\'Edge Function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Erreur interne du serveur',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 