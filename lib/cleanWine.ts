import { Wine } from '../types/wine';

/**
 * Nettoie un objet wine pour éviter les erreurs de sérialisation
 * dans React Native 0.79+ avec React 19
 */
export function cleanWine(wine: any): Wine {
  // Déterminer le nom et le domaine
  const rawName = String(wine.name || '');
  const rawDomaine = typeof wine.producer === 'object' && wine.producer !== null 
    ? wine.producer.name || wine.producer.title || 'Domaine inconnu'
    : String(wine.domaine || wine.producer || 'Domaine inconnu');
  
  // Si le nom est vide ou générique, utiliser le domaine comme nom
  const isGenericName = !rawName || 
    rawName === 'Vin sans nom' || 
    rawName === 'Vin non identifié' || 
    rawName === 'Nom inconnu' ||
    rawName.length < 3;
  
      const finalName = isGenericName && rawDomaine !== 'Domaine inconnu' ? rawDomaine : rawName;
    const finalDomaine = isGenericName && rawDomaine !== 'Domaine inconnu' ? '' : rawDomaine;

  return {
    ...wine,
    // Force clean tous les champs à risque
    producer: typeof wine.producer === 'object' && wine.producer !== null 
      ? wine.producer.name || wine.producer.title || 'Domaine inconnu'
      : wine.producer,
    country: typeof wine.country === 'object' && wine.country !== null
      ? wine.country.name || wine.country.title || ''
      : wine.country,
    grapes: Array.isArray(wine.grapes)
      ? wine.grapes.map((g: any) => 
          typeof g === 'object' && g !== null 
            ? g.name || g.title || String(g)
            : String(g)
        )
      : [],
    // Supprime tous les champs inconnus ou dangereux
    raw: undefined,
    _internal: undefined,
    __typename: undefined,
    // Assure que tous les champs sont des types primitifs
    id: String(wine.id),
    name: finalName,
    domaine: finalDomaine,
    region: String(wine.region || ''),
    color: String(wine.color || wine.wine_type || 'red'),
    vintage: Number(wine.vintage || wine.year || 0),
    stock: Number(wine.stock || wine.amount || 0),
    note: Number(wine.note || wine.rating || 0),
    acidity: Number(wine.acidity || 0),
    power: Number(wine.power || wine.strength || 0),
    tannin: Number(wine.tannin || wine.tannins || 0),
    sweet: Number(wine.sweet || wine.sugar || 0),
    description: String(wine.description || ''),
    appellation: String(wine.appellation || ''),
    imageUri: String(wine.imageUri || wine.image_uri || ''),
    origin: String(wine.origin || 'cellar'),
    createdAt: String(wine.createdAt || wine.created_at || ''),
    updatedAt: String(wine.updatedAt || wine.updated_at || ''),
    history: Array.isArray(wine.history) ? wine.history : [],
  };
}

/**
 * Nettoie un tableau de vins
 */
export function cleanWines(wines: any[]): Wine[] {
  return wines.map(cleanWine);
} 