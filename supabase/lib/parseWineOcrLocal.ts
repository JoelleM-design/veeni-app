export function parseWineOcrLocal(text: string) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  console.log("[PARSING] Texte nettoyé:", cleaned);

  // Extraction du nom - plus robuste
  let nom = "Vin non identifié";
  
  // Patterns pour noms de châteaux/domaines
  const nomPatterns = [
    /(Château|Domaine|Clos|Mas)\s+[A-ZÉÈÊÀ][a-zA-Z\-' ]{2,}/i,
    /(Château|Domaine|Clos|Mas)\s+[A-ZÉÈÊÀ][a-zA-Z\-' ]{2,}\s+[A-ZÉÈÊÀ][a-zA-Z\-' ]{2,}/i,
    /[A-ZÉÈÊÀ][a-zA-Z\-' ]{2,}\s+(Château|Domaine|Clos|Mas)/i,
    /(Château|Domaine|Clos|Mas)\s+[A-ZÉÈÊÀ][a-zA-Z\-' ]{2,}\s+[A-ZÉÈÊÀ][a-zA-Z\-' ]{2,}\s+[A-ZÉÈÊÀ][a-zA-Z\-' ]{2,}/i
  ];

  for (const pattern of nomPatterns) {
    const match = cleaned.match(pattern);
    if (match) {
      nom = match[0].trim();
      console.log("[PARSING] Nom trouvé:", nom);
      break;
    }
  }

  // Extraction du producteur - plus robuste
  let producteur = "Domaine inconnu";
  
  const producteurPatterns = [
    /Famille\s+[A-ZÉÈÊÀ][a-zA-Z\-' ]{2,}/i,
    /[A-ZÉÈÊÀ][a-zA-Z\-' ]{2,}\s+[A-ZÉÈÊÀ][a-zA-Z\-' ]{2,}/i,
    /[A-ZÉÈÊÀ][a-zA-Z\-' ]{3,}/i
  ];

  for (const pattern of producteurPatterns) {
    const match = cleaned.match(pattern);
    if (match && match[0].trim() !== nom) {
      producteur = match[0].trim();
      console.log("[PARSING] Producteur trouvé:", producteur);
      break;
    }
  }

  // Extraction de l'année
  const matchAnnée = cleaned.match(/(19|20)\d{2}/);
  const année = matchAnnée?.[0] ?? "";
  console.log("[PARSING] Année trouvée:", année);

  // Scoring UX
  let score = 0;
  if (nom !== "Vin non identifié") score += 30;
  if (producteur !== "Domaine inconnu") score += 25;
  if (année) score += 10;

  console.log("[PARSING] Score final:", score);

  return {
    nom,
    producteur,
    année,
    confiance: score,
    type: "",
    cépages: [],
    région: "",
    source: "local",
  };
} 