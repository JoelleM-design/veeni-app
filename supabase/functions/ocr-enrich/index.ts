import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EnrichmentRequest {
  ocrText: string;
  currentParsing: {
    name?: string;
    producer?: string;
    year?: number;
    grapeVariety?: string[];
    wineType?: 'red' | 'white' | 'rosé' | 'sparkling';
    region?: string;
    appellation?: string;
  };
  missingFields: string[];
}

interface ParsedWine {
  name: string;
  producer?: string;
  year?: number;
  grapeVariety?: string[];
  wineType?: 'red' | 'white' | 'rosé' | 'sparkling';
  region?: string;
  appellation?: string;
  confidence: 'high' | 'medium' | 'low';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { ocrText, currentParsing, missingFields }: EnrichmentRequest = await req.json()

    if (!ocrText) {
      throw new Error('OCR text is required')
    }

    console.log('🔍 Enrichissement IA demandé:', { ocrText, missingFields })

    // Appel à OpenAI pour enrichir les données
    const enrichedData = await enrichWithOpenAI(ocrText, currentParsing, missingFields)

    return new Response(
      JSON.stringify({
        success: true,
        data: enrichedData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Erreur enrichissement:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function enrichWithOpenAI(
  ocrText: string,
  currentParsing: any,
  missingFields: string[]
): Promise<ParsedWine> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  // Correction des erreurs OCR courantes
  const correctedText = correctCommonOCRErrors(ocrText)
  
  const prompt = `
Tu es un expert en vins français et internationaux. Analyse ce texte extrait d'une étiquette de vin par OCR et corrige les erreurs de lecture.

TEXTE OCR (avec erreurs potentielles):
"${correctedText}"

PARSING ACTUEL:
${JSON.stringify(currentParsing, null, 2)}

CHAMPS MANQUANTS À DÉTECTER:
${missingFields.join(', ')}

INSTRUCTIONS:
1. Corrige les erreurs OCR courantes (ex: "10MAINE" → "DOMAINE", "gnes." → "", "DOMNE" → "DOMAINE")
2. Extrais les informations de vin suivantes:
   - name: nom du vin (obligatoire)
   - producer: producteur/domaine
   - year: millésime (année)
   - grapeVariety: cépages (tableau)
   - wineType: type (red/white/rosé/sparkling)
   - region: région/pays
   - appellation: appellation spécifique
3. Si une information n'est pas claire, laisse le champ vide
4. Évalue la confiance (high/medium/low) selon la clarté du texte

Réponds UNIQUEMENT avec un JSON valide:
{
  "name": "Nom du vin",
  "producer": "Producteur",
  "year": 2022,
  "grapeVariety": ["Syrah", "Grenache"],
  "wineType": "red",
  "region": "France",
  "appellation": "Côtes du Rhône",
  "confidence": "high"
}
`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Tu es un expert en vins. Réponds uniquement avec du JSON valide.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 500
    })
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content

  try {
    // Extraire le JSON de la réponse
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0])
    
    // Validation et nettoyage
    return {
      name: parsed.name || '',
      producer: parsed.producer || undefined,
      year: parsed.year || undefined,
      grapeVariety: Array.isArray(parsed.grapeVariety) ? parsed.grapeVariety : [],
      wineType: ['red', 'white', 'rosé', 'sparkling'].includes(parsed.wineType) ? parsed.wineType : undefined,
      region: parsed.region || undefined,
      appellation: parsed.appellation || undefined,
      confidence: ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'medium'
    }

  } catch (parseError) {
    console.error('❌ Erreur parsing JSON OpenAI:', parseError)
    console.log('📄 Réponse OpenAI:', content)
    
    // Fallback: retourner les données actuelles avec confiance faible
    return {
      name: currentParsing.name || '',
      producer: currentParsing.producer,
      year: currentParsing.year,
      grapeVariety: currentParsing.grapeVariety || [],
      wineType: currentParsing.wineType,
      region: currentParsing.region,
      appellation: currentParsing.appellation,
      confidence: 'low'
    }
  }
}

function correctCommonOCRErrors(text: string): string {
  return text
    // Corrections courantes
    .replace(/\b10MAINE\b/gi, 'DOMAINE')
    .replace(/\bDOMNE\b/gi, 'DOMAINE')
    .replace(/\bgnes\.\s*/gi, '')
    .replace(/\bOMAINE\b/gi, 'DOMAINE')
    .replace(/\bSERVICE\s+CARAFAGE\b/gi, '')
    .replace(/\bADEGUSTER\b/gi, '')
    .replace(/\bACCORD\s+PARFAIT\b/gi, '')
    .replace(/\bCote\s+fourchette\b/gi, '')
    .replace(/\bDET\s+VIANDES\b/gi, '')
    // Nettoyage
    .replace(/\s+/g, ' ')
    .trim()
} 