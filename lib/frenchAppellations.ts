// Base de données des appellations françaises pour l'OCR
export const frenchAppellations = {
  // Appellations du Rhône
  'SAINT-JOSEPH': { region: 'RHÔNE', country: 'France' },
  'CÔTE-RÔTIE': { region: 'RHÔNE', country: 'France' },
  'HERMITAGE': { region: 'RHÔNE', country: 'France' },
  'CROZES-HERMITAGE': { region: 'RHÔNE', country: 'France' },
  'CONDRIEU': { region: 'RHÔNE', country: 'France' },
  'CHÂTEAUNEUF-DU-PAPE': { region: 'RHÔNE', country: 'France' },
  'GIGONDAS': { region: 'RHÔNE', country: 'France' },
  'VACQUEYRAS': { region: 'RHÔNE', country: 'France' },
  'CÔTES DU RHÔNE': { region: 'RHÔNE', country: 'France' },
  
  // Appellations de Bourgogne
  'CHABLIS': { region: 'BOURGOGNE', country: 'France' },
  'CÔTE DE NUITS': { region: 'BOURGOGNE', country: 'France' },
  'CÔTE DE BEAUNE': { region: 'BOURGOGNE', country: 'France' },
  'GIVRY': { region: 'BOURGOGNE', country: 'France' },
  'MERCUREY': { region: 'BOURGOGNE', country: 'France' },
  'RULLY': { region: 'BOURGOGNE', country: 'France' },
  'POUILLY-FUISSÉ': { region: 'BOURGOGNE', country: 'France' },
  'MACON': { region: 'BOURGOGNE', country: 'France' },
  
  // Appellations de Bordeaux
  'MÉDOC': { region: 'BORDEAUX', country: 'France' },
  'SAINT-ÉMILION': { region: 'BORDEAUX', country: 'France' },
  'POMEROL': { region: 'BORDEAUX', country: 'France' },
  'GRAVES': { region: 'BORDEAUX', country: 'France' },
  'SAUTERNES': { region: 'BORDEAUX', country: 'France' },
  'PESSAC-LÉOGNAN': { region: 'BORDEAUX', country: 'France' },
  'MARGAUX': { region: 'BORDEAUX', country: 'France' },
  'PAUILLAC': { region: 'BORDEAUX', country: 'France' },
  'SAINT-JULIEN': { region: 'BORDEAUX', country: 'France' },
  
  // Appellations de la Loire
  'SAVENNIÈRES': { region: 'LOIRE', country: 'France' },
  'ANJOU': { region: 'LOIRE', country: 'France' },
  'SAUMUR': { region: 'LOIRE', country: 'France' },
  'CHINON': { region: 'LOIRE', country: 'France' },
  'BOURGUEIL': { region: 'LOIRE', country: 'France' },
  'VOUVRAY': { region: 'LOIRE', country: 'France' },
  'MONTLOUIS': { region: 'LOIRE', country: 'France' },
  'SANCERRE': { region: 'LOIRE', country: 'France' },
  'POUILLY-FUMÉ': { region: 'LOIRE', country: 'France' },
  'MUSCADET': { region: 'LOIRE', country: 'France' },
  
  // Appellations d'Alsace
  'ALSACE': { region: 'ALSACE', country: 'France' },
  'ALSACE GRAND CRU': { region: 'ALSACE', country: 'France' },
  'CRÉMANT D\'ALSACE': { region: 'ALSACE', country: 'France' },
  
  // Appellations de Champagne
  'CHAMPAGNE': { region: 'CHAMPAGNE', country: 'France' },
  'CRÉMANT': { region: 'CHAMPAGNE', country: 'France' },
  
  // Appellations du Languedoc
  'CORBIÈRES': { region: 'LANGUEDOC', country: 'France' },
  'MINERVOIS': { region: 'LANGUEDOC', country: 'France' },
  'FITOU': { region: 'LANGUEDOC', country: 'France' },
  'CABARDÈS': { region: 'LANGUEDOC', country: 'France' },
  'MALEPÈRE': { region: 'LANGUEDOC', country: 'France' },
  
  // Appellations de Provence
  'CÔTES DE PROVENCE': { region: 'PROVENCE', country: 'France' },
  'BANDOL': { region: 'PROVENCE', country: 'France' },
  'CASSIS': { region: 'PROVENCE', country: 'France' },
  'PALETTE': { region: 'PROVENCE', country: 'France' },
  
  // Appellations du Sud-Ouest
  'CAHORS': { region: 'SUD-OUEST', country: 'France' },
  'MADIRAN': { region: 'SUD-OUEST', country: 'France' },
  'JURANÇON': { region: 'SUD-OUEST', country: 'France' },
  'GAILLAC': { region: 'SUD-OUEST', country: 'France' },
  'FRONTON': { region: 'SUD-OUEST', country: 'France' }
};

// Mots-clés pour détecter les appellations
export const appellationKeywords = [
  'APPELLATION',
  'APPELLATION D\'ORIGINE',
  'APPELLATION D\'ORIGINE CONTRÔLÉE',
  'AOC',
  'AOP',
  'CONTRÔLÉE',
  'PROTÉGÉE'
];

// Fonction pour détecter une appellation dans le texte OCR
export function detectFrenchAppellation(text: string): { appellation: string; region: string; country: string } | null {
  const upperText = text.toUpperCase();
  
  // Chercher les mots-clés d'appellation
  const hasAppellationKeyword = appellationKeywords.some(keyword => 
    upperText.includes(keyword)
  );
  
  if (!hasAppellationKeyword) {
    return null;
  }
  
  // Chercher une appellation connue
  for (const [appellation, data] of Object.entries(frenchAppellations)) {
    if (upperText.includes(appellation)) {
      return {
        appellation: appellation,
        region: data.region,
        country: data.country
      };
    }
  }
  
  return null;
}
