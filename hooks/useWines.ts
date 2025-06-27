import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Wine } from '../types/wine';

// Génère un UUID v4 conforme RFC4122, compatible Expo/JS sans dépendance crypto
function generateId(): string {
  const timestamp = Date.now();
  const random1 = Math.floor(Math.random() * 0x100000000);
  const random2 = Math.floor(Math.random() * 0x100000000);
  const random3 = Math.floor(Math.random() * 0x100000000);
  const random4 = Math.floor(Math.random() * 0x100000000);
  
  return [
    (timestamp & 0xffffffff).toString(16).padStart(8, '0'),
    (random1 & 0xffff).toString(16).padStart(4, '0'),
    '4' + (random2 & 0xfff).toString(16).padStart(3, '0'),
    '8' + (random3 & 0x3ff).toString(16).padStart(3, '0'),
    (random4 & 0xffffffffffff).toString(16).padStart(12, '0')
  ].join('-');
}

export function useWines() {
  const [wines, setWines] = useState<Wine[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchWines();
  }, []);

  const fetchWines = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Récupérer l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      console.log('Récupération des vins pour l\'utilisateur:', user.id);

      // Récupérer tous les vins de l'utilisateur avec les détails en une seule requête
      const { data: userWinesWithDetails, error: fetchError } = await supabase
        .from('user_wine')
        .select(`
          *,
          wine: wine_id (
            id,
            name,
            year,
            wine_type,
            region,
            image_uri,
            grapes,
            producer: producer_id (
              id,
              name
            ),
            country: country_id (
              id,
              name,
              flag_emoji
            )
          )
        `)
        .eq('user_id', user.id);

      if (fetchError) {
        console.error('Erreur lors de la récupération des vins:', fetchError);
        throw fetchError;
      }

      console.log('Vins récupérés avec détails:', userWinesWithDetails);

      if (!userWinesWithDetails || userWinesWithDetails.length === 0) {
        console.log('Aucun vin trouvé pour l\'utilisateur');
        setWines([]);
        return;
      }

      // Transformer les données
      const transformedWines: Wine[] = [];
      
      for (const userWine of userWinesWithDetails) {
        const wine = userWine.wine;
        if (!wine) {
          console.warn('Vin manquant pour user_wine:', userWine);
          continue;
        }
        
        const transformedWine: Wine = {
          id: wine.id,
          name: wine.name || 'Vin sans nom',
          domaine: wine.producer?.name || wine.name || 'Domaine inconnu',
          vintage: wine.year || 0,
          color: (wine.wine_type as 'red' | 'white' | 'rose' | 'sparkling') || 'red',
          region: wine.region || wine.country?.name || '',
          appellation: wine.region || wine.country?.name || '',
          grapes: Array.isArray(wine.grapes) ? wine.grapes : (wine.grapes ? [wine.grapes] : []),
          power: 0,
          tannin: 0,
          sweet: 0,
          acidity: 0,
          description: '',
          imageUri: wine.image_uri || undefined,
          favorite: userWine.liked || false,
          note: userWine.rating || 0,
          stock: userWine.amount || 0,
          origin: userWine.origin || ((userWine.amount || 0) > 0 ? 'cellar' : 'wishlist'),
          history: [], // Simplifié pour l'instant
          createdAt: userWine.created_at,
          updatedAt: userWine.updated_at || userWine.created_at
        };
        
        console.log('Vin transformé:', transformedWine);
        transformedWines.push(transformedWine);
      }

      console.log('Vins transformés:', transformedWines);
      setWines(transformedWines);
    } catch (err) {
      console.error('Erreur complète lors de la récupération des vins:', err);
      setError(err instanceof Error ? err : new Error('Erreur inconnue'));
      setWines([]);
    } finally {
      setLoading(false);
    }
  };

  const updateWine = async (wineId: string, updates: Partial<Wine>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      // Mettre à jour dans user_wine
      const updateData: any = {};
      
      if (updates.stock !== undefined) updateData.amount = updates.stock;
      if (updates.note !== undefined) updateData.rating = updates.note;
      if (updates.favorite !== undefined) updateData.liked = updates.favorite;
      if (updates.origin !== undefined) updateData.origin = updates.origin;

      const { error } = await supabase
        .from('user_wine')
        .update(updateData)
        .eq('user_id', user.id)
        .eq('wine_id', wineId);

      if (error) {
        console.error('Erreur Supabase lors de la mise à jour:', error);
        throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
      }

      // Recharger les vins
      await fetchWines();
    } catch (err) {
      console.error('Erreur complète lors de la mise à jour:', err);
      setError(err instanceof Error ? err : new Error('Erreur lors de la mise à jour'));
      // Ne pas faire planter l'app, juste afficher l'erreur
    }
  };

  const addWineToCellar = async (wine: Wine) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      // 1. Vérifier si le vin existe déjà dans la table wine
      let wineId = wine.id;
      
      // Si l'ID commence par "manual-" ou "owd-", c'est un vin temporaire, il faut le créer
      if (wineId.startsWith('manual-') || wineId.startsWith('owd-')) {
        console.log('Création d\'un nouveau vin dans la base de données');
        
        // Générer un nouvel ID UUID compatible Expo
        wineId = generateId();
        
        // Créer le producteur s'il n'existe pas
        let producerId = null;
        if (wine.domaine && wine.domaine !== 'Domaine inconnu') {
          const { data: existingProducer } = await supabase
            .from('producer')
            .select('id')
            .eq('name', wine.domaine)
            .single();
          
          if (existingProducer) {
            producerId = existingProducer.id;
          } else {
            const { data: newProducer } = await supabase
              .from('producer')
              .insert({ name: wine.domaine })
              .select('id')
              .single();
            producerId = newProducer?.id;
          }
        }
        
        // Créer le pays s'il n'existe pas
        let countryId = null;
        if (wine.region) {
          const { data: existingCountry } = await supabase
            .from('country')
            .select('id')
            .eq('name', wine.region)
            .single();
          
          if (existingCountry) {
            countryId = existingCountry.id;
          } else {
            const { data: newCountry } = await supabase
              .from('country')
              .insert({ name: wine.region, flag_emoji: '🏳️' })
              .select('id')
              .single();
            countryId = newCountry?.id;
          }
        }
        
        // Créer le vin dans la table wine
        const { error: wineError } = await supabase
          .from('wine')
          .insert({
            id: wineId,
            name: wine.name,
            year: wine.vintage?.toString() || null,
            wine_type: wine.color,
            region: wine.region,
            producer_id: producerId,
            country_id: countryId,
            image_uri: wine.imageUri,
            grapes: wine.grapes
          });
        
        if (wineError) {
          console.error('Erreur création vin:', wineError);
          throw wineError;
        }
        
        console.log('Vin créé avec succès:', wineId);
      }

      // 2. Insérer dans user_wine
      const { error } = await supabase
        .from('user_wine')
        .insert({
          user_id: user.id,
          wine_id: wineId,
          amount: wine.stock || 1,
          rating: wine.note || null,
          liked: wine.favorite || false,
          origin: 'cellar'
        });

      if (error) throw error;

      console.log('Vin ajouté à la cave avec succès');
      
      // Recharger les vins
      await fetchWines();
    } catch (err) {
      console.error('Erreur ajout cave:', err);
      setError(err instanceof Error ? err : new Error('Erreur lors de l\'ajout'));
    }
  };

  const addWineToWishlist = async (wine: Wine) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      // 1. Vérifier si le vin existe déjà dans la table wine
      let wineId = wine.id;
      
      // Si l'ID commence par "manual-" ou "owd-", c'est un vin temporaire, il faut le créer
      if (wineId.startsWith('manual-') || wineId.startsWith('owd-')) {
        console.log('Création d\'un nouveau vin dans la base de données');
        
        // Générer un nouvel ID UUID compatible Expo
        wineId = generateId();
        
        // Créer le producteur s'il n'existe pas
        let producerId = null;
        if (wine.domaine && wine.domaine !== 'Domaine inconnu') {
          const { data: existingProducer } = await supabase
            .from('producer')
            .select('id')
            .eq('name', wine.domaine)
            .single();
          
          if (existingProducer) {
            producerId = existingProducer.id;
          } else {
            const { data: newProducer } = await supabase
              .from('producer')
              .insert({ name: wine.domaine })
              .select('id')
              .single();
            producerId = newProducer?.id;
          }
        }
        
        // Créer le pays s'il n'existe pas
        let countryId = null;
        if (wine.region) {
          const { data: existingCountry } = await supabase
            .from('country')
            .select('id')
            .eq('name', wine.region)
            .single();
          
          if (existingCountry) {
            countryId = existingCountry.id;
          } else {
            const { data: newCountry } = await supabase
              .from('country')
              .insert({ name: wine.region, flag_emoji: '🏳️' })
              .select('id')
              .single();
            countryId = newCountry?.id;
          }
        }
        
        // Créer le vin dans la table wine
        const { error: wineError } = await supabase
          .from('wine')
          .insert({
            id: wineId,
            name: wine.name,
            year: wine.vintage?.toString() || null,
            wine_type: wine.color,
            region: wine.region,
            producer_id: producerId,
            country_id: countryId,
            image_uri: wine.imageUri,
            grapes: wine.grapes
          });
        
        if (wineError) {
          console.error('Erreur création vin:', wineError);
          throw wineError;
        }
        
        console.log('Vin créé avec succès:', wineId);
      }

      // 2. Insérer dans user_wine
      const { error } = await supabase
        .from('user_wine')
        .insert({
          user_id: user.id,
          wine_id: wineId,
          amount: 0,
          rating: wine.note || null,
          liked: wine.favorite || false,
          origin: 'wishlist'
        });

      if (error) throw error;

      console.log('Vin ajouté à la wishlist avec succès');
      
      // Recharger les vins
      await fetchWines();
    } catch (err) {
      console.error('Erreur ajout wishlist:', err);
      setError(err instanceof Error ? err : new Error('Erreur lors de l\'ajout'));
    }
  };

  const removeWineFromCellar = async (wineId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      // Supprimer de user_wine
      const { error } = await supabase
        .from('user_wine')
        .delete()
        .eq('user_id', user.id)
        .eq('wine_id', wineId);

      if (error) throw error;

      // Recharger les vins
      await fetchWines();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors de la suppression'));
    }
  };

  return {
    wines,
    loading,
    error,
    updateWine,
    addWineToCellar,
    addWineToWishlist,
    removeWineFromCellar,
    refetch: fetchWines
  };
} 