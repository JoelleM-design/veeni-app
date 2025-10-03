import OpenAI from 'npm:openai';

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') });

export async function parseWithGPT(text: string) {
  const prompt = `Tu es un sommelier assistant. Analyse ce texte d'étiquette de vin et renvoie un JSON avec les clés :\n- nom\n- producteur\n- année\n- type (Rouge, Blanc, Rosé, Pétillant)\n- région\n- cépages (tableau)\n- confiance (score 0-100 selon fiabilité)\n\nTexte brut : """${text}"""`;

  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
  });

  const parsed = JSON.parse(res.choices[0].message.content);
  return { ...parsed, source: 'ai' };
} 