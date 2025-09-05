import { Wine } from '../types/wine';
import { supabase } from './supabase';
import { checkWineDuplicate } from './wineDuplicateDetection';

/**
 * Nettoie les doublons dans la wishlist d'un utilisateur
 * @param userId ID de l'utilisateur
 * @returns Nombre de doublons supprimés
 */
export async function cleanupWishlistDuplicates(userId: string): Promise<number> {
  try {
    console.log('🧹 Nettoyage des doublons dans la wishlist...');
    
    // Récupérer tous les vins de la wishlist de l'utilisateur
    const { data: userWines, error: fetchError } = await supabase
      .from('user_wine')
      .select(`
        *,
        wine (
          *,
          producer (*),
          country (*)
        )
      `)
      .eq('user_id', userId)
      .eq('origin', 'wishlist');

    if (fetchError) {
      console.error('Erreur lors de la récupération des vins:', fetchError);
      return 0;
    }

    if (!userWines || userWines.length === 0) {
      console.log('Aucun vin dans la wishlist');
      return 0;
    }

    // Transformer les données en format Wine
    const wishlistWines: Wine[] = userWines.map(uw => {
      const wine = uw.wine;
      return {
        id: String(wine.id || ''),
        name: String(wine.name || ''),
        vintage: wine.year ? parseInt(wine.year) : 0,
        domaine: typeof wine.producer === 'object' && wine.producer?.name ? String(wine.producer.name) : 'Domaine inconnu',
        color: (typeof wine.wine_type === 'string' ? wine.wine_type : 'red') as 'red' | 'white' | 'rose' | 'sparkling',
        region: typeof wine.region === 'string' ? wine.region : (wine.country && typeof wine.country === 'object' && wine.country.name ? String(wine.country.name) : ''),
        appellation: typeof wine.appellation === 'string' ? wine.appellation : '',
        grapes: Array.isArray(wine.grapes) ? wine.grapes : (wine.grapes ? [wine.grapes] : []),
        power: 0,
        tannin: 0,
        sweet: 0,
        acidity: 0,
        description: typeof wine.description === 'string' ? wine.description : '',
        imageUri: typeof wine.image_uri === 'string' ? wine.image_uri : undefined,
        note: uw.rating || 0,
        origin: 'wishlist' as const,
        stock: 0,
        personalComment: typeof uw.personal_comment === 'string' ? uw.personal_comment : '',
        tastingProfile: uw.tasting_profile || {
          power: 0,
          tannin: 0,
          acidity: 0,
          sweetness: 0
        },
        history: [],
        favorite: uw.favorite || false,
        createdAt: uw.created_at,
        updatedAt: uw.updated_at || uw.created_at
      };
    });

    console.log(`🔍 Analyse de ${wishlistWines.length} vins dans la wishlist...`);

    // Trouver les doublons
    const duplicatesToRemove: string[] = [];
    const processedWines: Wine[] = [];

    for (const wine of wishlistWines) {
      const duplicateCheck = checkWineDuplicate(wine, processedWines);
      
      if (duplicateCheck.isDuplicate) {
        console.log(`🚫 Doublon trouvé: ${wine.name} (${wine.domaine}) - ID: ${wine.id}`);
        duplicatesToRemove.push(wine.id);
      } else {
        processedWines.push(wine);
      }
    }

    if (duplicatesToRemove.length === 0) {
      console.log('✅ Aucun doublon trouvé dans la wishlist');
      return 0;
    }

    console.log(`🗑️ Suppression de ${duplicatesToRemove.length} doublons...`);

    // Supprimer les doublons de la base de données
    const { error: deleteError } = await supabase
      .from('user_wine')
      .delete()
      .eq('user_id', userId)
      .in('wine_id', duplicatesToRemove);

    if (deleteError) {
      console.error('Erreur lors de la suppression des doublons:', deleteError);
      return 0;
    }

    console.log(`✅ ${duplicatesToRemove.length} doublons supprimés avec succès`);
    return duplicatesToRemove.length;

  } catch (error) {
    console.error('Erreur lors du nettoyage des doublons:', error);
    return 0;
  }
}

/**
 * Nettoie les doublons dans la cave d'un utilisateur
 * @param userId ID de l'utilisateur
 * @returns Nombre de doublons consolidés
 */
export async function cleanupCellarDuplicates(userId: string): Promise<number> {
  try {
    console.log('🧹 Nettoyage des doublons dans la cave...');
    
    // Récupérer tous les vins de la cave de l'utilisateur
    const { data: userWines, error: fetchError } = await supabase
      .from('user_wine')
      .select(`
        *,
        wine (
          *,
          producer (*),
          country (*)
        )
      `)
      .eq('user_id', userId)
      .eq('origin', 'cellar');

    if (fetchError) {
      console.error('Erreur lors de la récupération des vins:', fetchError);
      return 0;
    }

    if (!userWines || userWines.length === 0) {
      console.log('Aucun vin dans la cave');
      return 0;
    }

    // Transformer les données en format Wine
    const cellarWines: Wine[] = userWines.map(uw => {
      const wine = uw.wine;
      return {
        id: String(wine.id || ''),
        name: String(wine.name || ''),
        vintage: wine.year ? parseInt(wine.year) : 0,
        domaine: typeof wine.producer === 'object' && wine.producer?.name ? String(wine.producer.name) : 'Domaine inconnu',
        color: (typeof wine.wine_type === 'string' ? wine.wine_type : 'red') as 'red' | 'white' | 'rose' | 'sparkling',
        region: typeof wine.region === 'string' ? wine.region : (wine.country && typeof wine.country === 'object' && wine.country.name ? String(wine.country.name) : ''),
        appellation: typeof wine.appellation === 'string' ? wine.appellation : '',
        grapes: Array.isArray(wine.grapes) ? wine.grapes : (wine.grapes ? [wine.grapes] : []),
        power: 0,
        tannin: 0,
        sweet: 0,
        acidity: 0,
        description: typeof wine.description === 'string' ? wine.description : '',
        imageUri: typeof wine.image_uri === 'string' ? wine.image_uri : undefined,
        note: uw.rating || 0,
        origin: 'cellar' as const,
        stock: uw.amount || 0,
        personalComment: typeof uw.personal_comment === 'string' ? uw.personal_comment : '',
        tastingProfile: uw.tasting_profile || {
          power: 0,
          tannin: 0,
          acidity: 0,
          sweetness: 0
        },
        history: [],
        favorite: uw.favorite || false,
        createdAt: uw.created_at,
        updatedAt: uw.updated_at || uw.created_at
      };
    });

    console.log(`🔍 Analyse de ${cellarWines.length} vins dans la cave...`);

    // Grouper les vins par clé unique (nom + domaine + millésime + région + couleur)
    const wineGroups = new Map<string, { wines: Wine[], totalStock: number }>();

    for (const wine of cellarWines) {
      const key = `${wine.name}|${wine.domaine}|${wine.vintage}|${wine.region}|${wine.color}`;
      
      if (!wineGroups.has(key)) {
        wineGroups.set(key, { wines: [], totalStock: 0 });
      }
      
      const group = wineGroups.get(key)!;
      group.wines.push(wine);
      group.totalStock += wine.stock || 0;
    }

    let consolidatedCount = 0;

    // Consolider les groupes avec plusieurs vins
    for (const [key, group] of wineGroups) {
      if (group.wines.length > 1) {
        console.log(`🔄 Consolidation de ${group.wines.length} vins identiques: ${group.wines[0].name}`);
        
        // Garder le premier vin et supprimer les autres
        const keepWine = group.wines[0];
        const removeWines = group.wines.slice(1);
        
        // Mettre à jour le stock du vin conservé
        await supabase
          .from('user_wine')
          .update({ amount: group.totalStock })
          .eq('user_id', userId)
          .eq('wine_id', keepWine.id);

        // Supprimer les vins en doublon
        const removeIds = removeWines.map(w => w.id);
        await supabase
          .from('user_wine')
          .delete()
          .eq('user_id', userId)
          .in('wine_id', removeIds);

        consolidatedCount += removeWines.length;
      }
    }

    if (consolidatedCount === 0) {
      console.log('✅ Aucun doublon trouvé dans la cave');
    } else {
      console.log(`✅ ${consolidatedCount} doublons consolidés dans la cave`);
    }

    return consolidatedCount;

  } catch (error) {
    console.error('Erreur lors du nettoyage des doublons de la cave:', error);
    return 0;
  }
}
