import OpenAI from 'npm:openai';

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') });

export async function parseWithGPT(text: string) {
  console.log("[GPT] Début du parsing IA pour:", text.substring(0, 100) + "...");
  
  const prompt = `Tu es un sommelier expert. Analyse ce texte d'étiquette de vin et renvoie UNIQUEMENT un JSON valide avec ces clés exactes :
{
  "nom": "Nom du vin (ex: Château Roquefort)",
  "producteur": "Nom du producteur (ex: Famille Bellanger)",
  "année": "Année du millésime (ex: 2024)",
  "type": "Rouge, Blanc, Rosé ou Effervescent",
  "région": "Région viticole",
  "cépages": ["cépage1", "cépage2"],
  "confiance": 85
}

Texte brut de l'étiquette : """${text}"""

IMPORTANT : Renvoie UNIQUEMENT le JSON, sans texte avant ou après.`;

  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 500
    });

    const content = res.choices[0].message.content;
    console.log("[GPT] Réponse brute:", content);

    // Nettoyer la réponse pour extraire le JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Aucun JSON trouvé dans la réponse");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log("[GPT] Parsing réussi:", parsed);
    
    return { 
      ...parsed, 
      source: 'ai',
      confiance: parsed.confiance || 80
    };
  } catch (error) {
    console.error("[GPT] Erreur parsing IA:", error);
    throw error;
  }
} 