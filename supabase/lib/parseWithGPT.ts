import OpenAI from 'npm:openai';

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') });

export async function parseWithGPT(text: string, detectedLanguage?: string) {
  console.log("[GPT] Début du parsing IA pour:", text.substring(0, 100) + "...");
  console.log("[GPT] Langue détectée:", detectedLanguage);
  
  const languageHint = detectedLanguage ? `\n\nLANGUE DÉTECTÉE: ${detectedLanguage.toUpperCase()}` : '';
  
  const prompt = `Tu es un sommelier expert. Analyse ce texte d'étiquette de vin et renvoie UNIQUEMENT un JSON valide avec ces clés exactes :

{
  "nom": "Nom du vin (ex: Syrah, Château Roquefort, Merlot, ou le nom principal du vin)",
  "producteur": "Nom du producteur/domaine (ex: Dominio de Punctum, Famille Bellanger, Château Margaux)",
  "année": "Année du millésime (ex: 2024) ou chaîne vide si non trouvée",
  "type": "Rouge, Blanc, Rosé ou Pétillant",
  "région": "Région viticole (ex: Bordeaux, Bourgogne, Rioja, Jumilla)",
  "cépages": ["cépage1", "cépage2"] (liste des cépages identifiés)
}

RÈGLES IMPORTANTES :
- Si le texte contient "DOMINIO", "BODEGA", "VIÑA", "FINCA" → c'est le producteur
- Si le texte contient un nom de cépage (Syrah, Merlot, etc.) → c'est le nom du vin OU un cépage
- Pour les vins espagnols : "DOMINIO DE PUNCTUM Syrah" → nom: "Syrah", producteur: "Dominio de Punctum"
- Pour les vins français : "CHÂTEAU MARGAUX" → nom: "Château Margaux", producteur: "Château Margaux"
- Ne jamais retourner de nom vide, utilise le nom le plus logique

TEXTE À ANALYSER :${languageHint}
${text}

JSON :`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Tu es un expert en vins qui analyse des étiquettes. Réponds UNIQUEMENT avec un JSON valide, sans texte supplémentaire."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 500
    });

    const response = completion.choices[0]?.message?.content;
    console.log("[GPT] Réponse brute:", response);

    if (!response) {
      throw new Error("Aucune réponse de l'IA");
    }

    // Nettoyer la réponse pour extraire le JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Aucun JSON trouvé dans la réponse");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log("[GPT] Résultat parsé:", parsed);

    return parsed;
  } catch (error) {
    console.error("[GPT] Erreur:", error);
    throw error;
  }
} 