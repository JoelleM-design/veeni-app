export function parseWineOcrLocal(text: string) {
  const cleaned = text.replace(/\s+/g, ' ').trim();

  const matchNom = cleaned.match(/(Château|Domaine|Clos|Mas)\s+[A-Z][a-zA-Z\- ]{2,}/i);
  const matchProducteur = cleaned.match(/Famille\s+[A-Z][a-z]+|[A-Z]{3,}/i);
  const matchAnnée = cleaned.match(/(19|20)\d{2}/);

  const nom = matchNom?.[0] ?? 'Vin non identifié';
  const producteur = matchProducteur?.[0] ?? 'Domaine inconnu';
  const année = matchAnnée?.[0] ?? '';

  // Scoring UX
  let score = 0;
  if (nom !== 'Vin non identifié') score += 30;
  if (producteur !== 'Domaine inconnu') score += 25;
  if (année) score += 10;

  return {
    nom,
    producteur,
    année,
    confiance: score,
    type: '', // facultatif
    cépages: [],
    région: '',
    source: 'local',
  };
} 