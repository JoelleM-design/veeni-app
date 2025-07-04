import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { parseWineOcrLocal } from "../../lib/parseWineOcrLocal.ts";
import { parseWithGPT } from "../../lib/parseWithGPT.ts";
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
  nom: string;
  producteur: string;
  année: string;
  cépages: string[];
  type: 'Rouge' | 'Blanc' | 'Rosé' | 'Effervescent' | '';
  région: string;
  source: 'local' | 'ai';
  confiance: number;
}

// Données de référence pour le parsing local
const knownGrapes = [
  'SYRAH', 'MERLOT', 'CHARDONNAY', 'CABERNET', 'SAUVIGNON', 'PINOT', 'NOIR', 'GRENACHE', 'MOURVEDRE',
  'CARIGNAN', 'CINSAULT', 'MALBEC', 'GAMAY', 'SÉMILLON', 'VIOGNIER', 'MUSCAT', 'RIESLING', 'ALIGOTÉ',
  'SAVAGNIN', 'PETIT VERDOT', 'TEMPRANILLO', 'SANGIOVESE', 'ZINFANDEL', 'BARBERA', 'NEBBIOLO', 'TOURIGA',
  'VERDEJO', 'VERMENTINO', 'TREBBIANO', 'MOSCATO', 'FURMINT', 'GRÜNER VELTLINER', 'ALBARINO', 'MACABEO',
  'BACO', 'PETIT MANSENG', 'GROS MANSENG', 'TANNAT', 'MUSCADELLE', 'UGNI BLANC', 'COLOMBARD', 'FOLLE BLANCHE'
];

const knownRegions = [
  'BORDEAUX', 'BOURGOGNE', 'CHAMPAGNE', 'PROVENCE', 'LANGUEDOC', 'RHÔNE', 'ALSACE', 'LOIRE',
  'BEAUJOLAIS', 'JURA', 'SAVOIE', 'SUD-OUEST', 'COTES DU RHONE', 'COTES DE PROVENCE', 'COTES DE BORDEAUX',
  'CASTILLA-LA MANCHA', 'RIOJA', 'CATALONIA', 'TUSCANY', 'PIEDMONT', 'VENETO', 'MOSEL', 'RHEINHESSEN'
];

const ocrCorrections: Record<string, string> = {
  'PROTEGION': 'PROTECTION',
  'APPELLATON': 'APPELLATION',
  'CHATEU': 'CHÂTEAU',
  'DOMNE': 'DOMAINE',
  'VIGNE': 'VIGNE',
  'VIN': 'VIN',
  'ROUGE': 'ROUGE',
  'BLANC': 'BLANC',
  'ROSÉ': 'ROSÉ',
  'EFFERVESCENT': 'EFFERVESCENT'
};

// Fonction pour appeler l'API Google Vision
async function callGoogleVisionAPI(images: string[], apiKey: string): Promise<GoogleVisionResponse | null> {
  try {
    console.log('🔍 === DÉBUT CALL GOOGLE VISION API ===');
    console.log('📊 Nombre d\'images:', images.length);
    console.log('🔑 Clé API présente:', !!apiKey);
    console.log('🔑 Clé API (début):', apiKey.substring(0, 10) + '...');
    
    // Vérifier chaque image
    images.forEach((image, index) => {
      console.log(`📸 Image ${index + 1}:`);
      console.log(`  - Longueur: ${image.length} caractères`);
      console.log(`  - Début: ${image.substring(0, 50)}`);
      console.log(`  - Fin: ${image.substring(image.length - 20)}`);
      
      // Vérifier si c'est du base64 valide
      const isValidBase64 = /^[A-Za-z0-9+/]*={0,2}$/.test(image);
      console.log(`  - Base64 valide: ${isValidBase64}`);
      
      // Vérifier si ça ressemble à une image
      const isLikelyImage = image.startsWith('/9j/') || image.startsWith('iVBORw0KGgo=') || image.startsWith('R0lGODlh');
      console.log(`  - Ressemble à une image: ${isLikelyImage}`);
    });
    
    const visionRequests = images.map((base64Image: string) => ({
      image: { content: base64Image },
      features: [{ type: 'TEXT_DETECTION', maxResults: 10 }]
    }));

    console.log('📤 Envoi de la requête à Google Vision...');
    console.log('📋 Structure de la requête:', JSON.stringify({
      requests: visionRequests.map(req => ({
        image: { content: req.image.content.substring(0, 50) + '...' },
        features: req.features
      }))
    }, null, 2));
    
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: visionRequests })
      }
    );

    console.log('📡 Statut de la réponse Google Vision:', visionResponse.status);
    console.log('📡 Headers de la réponse:', Object.fromEntries(visionResponse.headers.entries()));
    
    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error(`❌ Erreur Google Vision API: ${visionResponse.status} - ${visionResponse.statusText}`);
      console.error('📄 Détails de l\'erreur:', errorText);
      return null;
    }

    const visionData: GoogleVisionResponse = await visionResponse.json();
    console.log('✅ API Google Vision appelée avec succès');
    console.log('📊 Réponse Google Vision:', JSON.stringify(visionData, null, 2));
    console.log('🔍 === FIN CALL GOOGLE VISION API ===');
    return visionData;
  } catch (error) {
    console.error('❌ Erreur lors de l\'appel à l\'API Google Vision:', error);
    console.error('🔍 === FIN CALL GOOGLE VISION API (ERREUR) ===');
    return null;
  }
}

// Fonction de parsing local intelligent
function parseWineOcrLocal(rawText: string): ParsedWine {
  console.log('Parsing local du texte OCR:', rawText.substring(0, 200) + '...');
  
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
  const année = yearMatch ? yearMatch[0] : '';

  // 5. Extraction type de vin
  let type: ParsedWine['type'] = '';
  if (text.toUpperCase().includes('ROUGE') || text.toUpperCase().includes('RED')) {
    type = 'Rouge';
  } else if (text.toUpperCase().includes('BLANC') || text.toUpperCase().includes('WHITE')) {
    type = 'Blanc';
  } else if (text.toUpperCase().includes('ROSÉ') || text.toUpperCase().includes('ROSE')) {
    type = 'Rosé';
  } else if (text.toUpperCase().includes('EFFERVESCENT') || text.toUpperCase().includes('SPARKLING') || 
             text.toUpperCase().includes('MOUSSEUX') || text.toUpperCase().includes('CHAMPAGNE')) {
    type = 'Effervescent';
  }

  // 6. Extraction cépages
  const cépages = knownGrapes.filter(grape => 
    text.toUpperCase().includes(grape.toUpperCase())
  );

  // 7. Extraction région/appellation
  let région = '';
  for (const reg of knownRegions) {
    if (text.toUpperCase().includes(reg.toUpperCase())) {
      région = reg;
      break;
    }
  }

  // 8. Extraction producteur
  let producteur = '';
  for (const line of lines) {
    if (/CH[ÂA]TEAU|DOMAINE|CLOS|MAISON/i.test(line)) {
      producteur = line;
      break;
    }
  }
  if (!producteur) producteur = 'Domaine inconnu';

  // 9. Extraction nom (ligne la plus longue hors producteur/région/année)
  let nom = lines
    .filter(l => l !== producteur && !l.includes(année) && !l.includes(région))
    .sort((a, b) => b.length - a.length)[0] || '';

  // 10. NOUVEAU SYSTÈME DE SCORING HYBRIDE UX-DRIVEN
  
  // Validation structurelle (hard rules)
  const isNomOk = nom && nom.length > 3;
  const isProducteurOk = producteur && producteur !== 'Domaine inconnu';
  const isAnnéeOk = année && parseInt(année) >= 1980 && parseInt(année) <= 2035;
  
  // Score pondéré pour complétude (soft check)
  let confiance = 0;
  
  // Nom (30 points) - Élément critique
  if (isNomOk) {
    confiance += 30;
  }
  
  // Producteur (25 points) - Élément critique
  if (isProducteurOk) {
    confiance += 25;
  }
  
  // Année (10 points) - Recommandé mais pas critique
  if (isAnnéeOk) {
    confiance += 10;
  }
  
  // Cépages (15 points) - Bonus informatif
  if (cépages.length > 0) {
    confiance += 15;
  }
  
  // Type (10 points) - Bonus informatif
  if (type) {
    confiance += 10;
  }
  
  // Région (10 points) - Bonus informatif
  if (région) {
    confiance += 10;
  }

  console.log('Parsing local résultat:', { 
    nom, producteur, année, cépages, type, région, confiance,
    validation: { isNomOk, isProducteurOk, isAnnéeOk }
  });
  
  return {
    nom: nom || 'Vin non identifié',
    producteur,
    année,
    cépages,
    type,
    région,
    source: 'local',
    confiance
  };
}

// Fonction utilitaire pour parser avec GPT
async function parseWithGPT(text: string): Promise<ParsedWine> {
  console.log('Parsing IA avec GPT-4o...');
  
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  console.log('🔑 Clé OpenAI présente:', !!openaiApiKey);
  console.log('🔑 Clé OpenAI (début):', openaiApiKey ? openaiApiKey.substring(0, 10) + '...' : 'AUCUNE');
  
  if (!openaiApiKey) {
    console.error('Aucune clé API OpenAI configurée');
    throw new Error('API OpenAI non configurée');
  }

  const prompt = `Tu es un sommelier expert. Structure ces informations extraites d'une étiquette de vin en JSON.

Texte OCR: "${text}"

Instructions:
- Extrais le nom du vin, le producteur, l'année, les cépages, le type (Rouge/Blanc/Rosé/Effervescent), et la région
- Si une information n'est pas claire, utilise une chaîne vide
- Pour les cépages, retourne un tableau des cépages identifiés
- Sois précis et ne devine pas

Retourne UNIQUEMENT un JSON valide avec cette structure:
{
  "nom": "Nom du vin",
  "producteur": "Nom du producteur",
  "année": "2022",
  "cépages": ["Syrah", "Merlot"],
  "type": "Rouge",
  "région": "Bordeaux"
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Tu es un sommelier expert qui structure des données d\'étiquettes de vin. Réponds UNIQUEMENT en JSON valide.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur OpenAI API: ${response.status} - ${errorText}`);
      throw new Error(`Erreur OpenAI: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('Réponse OpenAI vide');
    }

    // Extraction du JSON de la réponse
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Aucun JSON trouvé dans la réponse OpenAI');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    console.log('Parsing IA résultat:', parsed);
    
    return {
      nom: parsed.nom || 'Vin non identifié',
      producteur: parsed.producteur || 'Domaine inconnu',
      année: parsed.année || '',
      cépages: Array.isArray(parsed.cépages) ? parsed.cépages : [],
      type: parsed.type || '',
      région: parsed.région || '',
      source: 'ai',
      confiance: 85 // Confiance élevée pour l'IA
    };

  } catch (error) {
    console.error('Erreur lors du parsing IA:', error);
    throw new Error(`Erreur parsing IA: ${error.message}`);
  }
}

// Fonction principale de traitement OCR avec fallback IA
async function processWineImages(images: string[]): Promise<ParsedWine[]> {
  console.log(`Traitement de ${images.length} images...`);
  
  // Appel à l'API Google Vision
  const googleVisionApiKey = Deno.env.get('GOOGLE_VISION_API_KEY');
  
  if (!googleVisionApiKey) {
    console.error('Aucune clé API Google Vision configurée');
    throw new Error('API Google Vision non configurée');
  }

  console.log('Clé API Google Vision trouvée, appel en cours...');
  const visionResponse = await callGoogleVisionAPI(images, googleVisionApiKey);
  
  if (!visionResponse) {
    console.error('Échec de l\'API Google Vision');
    throw new Error('Impossible de traiter les images avec Google Vision');
  }

  // Traitement des réponses
  const parsedWines: ParsedWine[] = [];
  
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

    const ocrText = response.fullTextAnnotation.text;
    console.log(`Texte OCR pour l'image ${i}:`, ocrText.substring(0, 200) + '...');
    
    const localParsed = parseWineOcrLocal(ocrText);
    const { confiance, nom, producteur } = localParsed;

    // Log DEBUG pour analyse fine
    console.log("[DEBUG] Résultat parsing local:", JSON.stringify(localParsed, null, 2));

    // Nouvelle logique stricte : fallback IA si nom ou producteur non identifié, ou confiance < 65
    const shouldUseAI =
      nom === "Vin non identifié" ||
      producteur === "Domaine inconnu" ||
      confiance < 65;

    console.log("[OCR] shouldUseAI =", shouldUseAI);

    if (shouldUseAI) {
      try {
        const aiResult = await parseWithGPT(ocrText);
        parsedWines.push(aiResult);
      } catch (err) {
        console.error("[OCR] Échec IA:", err.message);
        // fallback minimal
        parsedWines.push({
          nom: "Vin non identifié",
          producteur: "Domaine inconnu",
          confiance: 0,
          source: "fallback",
          année: '',
          cépages: [],
          type: '',
          région: ''
        });
      }
    } else {
      console.log(`Parsing local suffisant - Confiance: ${confiance}, Affichage direct`);
      parsedWines.push(localParsed);
    }
  }
  
  console.log(`${parsedWines.length} vins traités avec succès`);
  return parsedWines;
}

// Fonction principale de l'Edge Function
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log('📥 Corps de la requête reçu:', JSON.stringify(body, null, 2))
    
    // Vérifier si on reçoit des images ou du texte OCR
    const { imageText, images } = body
    
    console.log('🔍 Type de données reçues:')
    console.log('- imageText présent:', !!imageText)
    console.log('- images présent:', !!images)
    console.log('- Type imageText:', typeof imageText)
    console.log('- Type images:', typeof images)
    
    if (images && Array.isArray(images)) {
      console.log('📸 Traitement d\'images base64 détecté')
      console.log('📊 Nombre d\'images:', images.length)
      console.log('🔍 Premier caractères de la première image:', images[0]?.substring(0, 50))
      
      // Traiter les images avec Google Vision
      const parsedWines = await processWineImages(images)
      
      return new Response(
        JSON.stringify({
          success: true,
          wines: parsedWines
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    if (!imageText || typeof imageText !== "string") {
      console.error('❌ Texte OCR manquant ou invalide')
      return new Response(JSON.stringify({ error: "Texte OCR manquant" }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('🔍 Début du traitement OCR:', imageText.substring(0, 100) + '...')
    console.log('📏 Longueur du texte OCR:', imageText.length)

    // 1. Parsing local intelligent
    const localParsed = parseWineOcrLocal(imageText)
    console.log('📊 Résultat parsing local:', JSON.stringify(localParsed, null, 2))

    const { confiance, nom, producteur } = localParsed

    // 2. Validation structurelle et décision fallback IA
    const isNomOk = nom && nom.length > 3 && nom !== "Vin non identifié"
    const isProducteurOk = producteur && producteur !== "Domaine inconnu"
    const shouldUseAI = !isNomOk || !isProducteurOk || confiance < 65

    console.log('🤖 Décision IA:', { isNomOk, isProducteurOk, confiance, shouldUseAI })

    let finalResult = localParsed

    // 3. Fallback IA si nécessaire
    if (shouldUseAI) {
      console.log('📤 Appel enrichissement IA...')
      try {
        const enrichedResult = await callEnrichmentAI(imageText, localParsed)
        finalResult = enrichedResult
        console.log('✅ Enrichissement IA réussi:', JSON.stringify(finalResult, null, 2))
      } catch (aiError) {
        console.warn('⚠️ Erreur enrichissement IA, utilisation parsing local:', aiError)
        // Garder le parsing local en cas d'échec IA
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        wine: finalResult
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Erreur traitement OCR:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        wine: {
          nom: "Nom non identifié",
          producteur: "Domaine inconnu",
          année: "",
          cépages: [],
          type: "",
          région: "",
          source: "local",
          confiance: 0
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

// Appel à la fonction d'enrichissement IA
async function callEnrichmentAI(ocrText: string, localParsed: ParsedWine): Promise<ParsedWine> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const authHeader = Deno.env.get("SUPABASE_ANON_KEY")

  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL not configured")
  }

  // Déterminer les champs manquants
  const missingFields = []
  if (localParsed.nom === "Vin non identifié") missingFields.push("name")
  if (localParsed.producteur === "Domaine inconnu") missingFields.push("producer")
  if (!localParsed.année) missingFields.push("year")
  if (localParsed.cépages.length === 0) missingFields.push("grapeVariety")
  if (!localParsed.type) missingFields.push("wineType")
  if (!localParsed.région) missingFields.push("region")

  console.log('📋 Champs manquants détectés:', missingFields)

  const enrichResponse = await fetch(`${supabaseUrl}/functions/v1/ocr-enrich`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authHeader}`,
    },
    body: JSON.stringify({
      ocrText: ocrText,
      currentParsing: {
        name: localParsed.nom,
        producer: localParsed.producteur,
        year: localParsed.année ? parseInt(localParsed.année) : undefined,
        grapeVariety: localParsed.cépages,
        wineType: localParsed.type.toLowerCase() as any,
        region: localParsed.région,
      },
      missingFields: missingFields,
    }),
  })

  if (!enrichResponse.ok) {
    throw new Error(`Enrichment API error: ${enrichResponse.status}`)
  }

  const enrichData = await enrichResponse.json()
  
  if (!enrichData.success) {
    throw new Error(`Enrichment failed: ${enrichData.error}`)
  }

  // Convertir le format de réponse
  const enriched = enrichData.data
  return {
    nom: enriched.name || localParsed.nom,
    producteur: enriched.producer || localParsed.producteur,
    année: enriched.year?.toString() || localParsed.année,
    cépages: enriched.grapeVariety || localParsed.cépages,
    type: (enriched.wineType?.charAt(0).toUpperCase() + enriched.wineType?.slice(1)) as any || localParsed.type,
    région: enriched.region || localParsed.région,
    source: "ai",
    confiance: enriched.confidence === "high" ? 90 : enriched.confidence === "medium" ? 70 : 50,
  }
} 