import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Wine } from '../types/wine';

// Génère un UUID v4 simple et compatible
function generateId(): string {
  const timestamp = Date.now();
  const random = Math.random();
  
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (timestamp + random * 16) % 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

export function useWines() {
  const [wines, setWines] = useState<Wine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchWines = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('Utilisateur non connecté');
        setWines([]);
        setLoading(false);
        return;
      }

      console.log('Récupération des vins pour l\'utilisateur:', user.id);

      // Récupérer les vins de l'utilisateur avec les détails des vins
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
        .eq('user_id', user.id);

      if (fetchError) {
        console.error('Erreur Supabase lors de la récupération:', fetchError);
        throw new Error(`Erreur lors de la récupération: ${fetchError.message}`);
      }

      console.log('Vins récupérés:', userWines);

      // Transformer les données
      const transformedWines: Wine[] = [];
      
      for (const userWine of userWines || []) {
        const wine = userWine.wine;
        if (!wine) continue;

        const transformedWine: Wine = {
          id: String(wine.id || ''),
          name: String(wine.name || 'Vin sans nom'),
          vintage: wine.year ? parseInt(wine.year) : 0,
          domaine: typeof wine.producer === 'object' && wine.producer?.name ? String(wine.producer.name) : (typeof wine.producer === 'string' ? wine.producer : 'Domaine inconnu'),
          color: (typeof wine.wine_type === 'string' ? wine.wine_type : 'red') as 'red' | 'white' | 'rose' | 'sparkling',
          region: typeof wine.region === 'string' ? wine.region : (wine.country && typeof wine.country === 'object' && wine.country.name ? String(wine.country.name) : ''),
          appellation: typeof wine.appellation === 'string' ? wine.appellation : '',
          grapes: (() => {
            try {
              if (!wine.grapes) return [];
              if (Array.isArray(wine.grapes)) {
                return wine.grapes.map((g: any) => {
                  if (typeof g === 'string') return g;
                  if (g && typeof g === 'object' && g.name) return String(g.name);
                  return String(g || '');
                }).filter(g => g && g.trim() !== '');
              }
              if (typeof wine.grapes === 'string') return [wine.grapes];
              if (wine.grapes && typeof wine.grapes === 'object' && wine.grapes.name) return [String(wine.grapes.name)];
              return [String(wine.grapes || '')];
            } catch (error) {
              console.warn('Erreur lors du traitement des grapes:', error);
              return [];
            }
          })(),
          power: 0,
          tannin: 0,
          sweet: 0,
          acidity: 0,
          description: typeof wine.description === 'string' ? wine.description : '',
          imageUri: typeof wine.image_uri === 'string' ? wine.image_uri : undefined,
          favorite: userWine.liked || false,
          note: userWine.rating || 0,
          stock: userWine.amount || 0,
          origin: userWine.origin || ((userWine.amount || 0) > 0 ? 'cellar' : 'wishlist'),
          history: [],
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
      
      // Si l'ID commence par "ocr-", c'est un vin temporaire de l'OCR, il faut le créer
      if (wineId.startsWith('ocr-')) {
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
      
      // Si l'ID commence par "ocr-", c'est un vin temporaire de l'OCR, il faut le créer
      if (wineId.startsWith('ocr-')) {
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
          rating: null,
          liked: false,
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

      const { error } = await supabase
        .from('user_wine')
        .delete()
        .eq('user_id', user.id)
        .eq('wine_id', wineId);

      if (error) throw error;

      console.log('Vin supprimé de la cave avec succès');
      
      // Recharger les vins
      await fetchWines();
    } catch (err) {
      console.error('Erreur suppression cave:', err);
      setError(err instanceof Error ? err : new Error('Erreur lors de la suppression'));
    }
  };

  const removeWineFromWishlist = async (wineId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const { error } = await supabase
        .from('user_wine')
        .delete()
        .eq('user_id', user.id)
        .eq('wine_id', wineId);

      if (error) throw error;

      console.log('Vin supprimé de la wishlist avec succès');
      
      // Recharger les vins
      await fetchWines();
    } catch (err) {
      console.error('Erreur suppression wishlist:', err);
      setError(err instanceof Error ? err : new Error('Erreur lors de la suppression'));
    }
  };

  useEffect(() => {
    fetchWines();
  }, []);

  return {
    wines,
    loading,
    error,
    fetchWines,
    updateWine,
    addWineToCellar,
    addWineToWishlist,
    removeWineFromCellar,
    removeWineFromWishlist
  };
} 