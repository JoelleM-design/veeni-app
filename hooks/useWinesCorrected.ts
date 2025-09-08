import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { uploadWineImage } from '../lib/uploadWineImage';
import { checkWineDuplicate, getDuplicateErrorMessage, getSimilarWineMessage } from '../lib/wineDuplicateDetection';
import { Wine } from '../types/wine';
import { useActiveCave } from './useActiveCave';

// Génère un UUID v4 vraiment aléatoire
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function useWinesCorrected() {
  const { caveMode, caveId, isShared, householdName } = useActiveCave();
  const [wines, setWines] = useState<Wine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [updateCallbacks, setUpdateCallbacks] = useState<(() => void)[]>([]);

  // Fonction pour s'abonner aux mises à jour
  const subscribeToUpdates = useCallback((callback: () => void) => {
    setUpdateCallbacks(prev => [...prev, callback]);
    return () => {
      setUpdateCallbacks(prev => prev.filter(cb => cb !== callback));
    };
  }, []);

  // Fonction pour notifier tous les abonnés
  const notifyUpdate = useCallback(() => {
    console.log('🔔 Notifying', updateCallbacks.length, 'subscribers of wine updates');
    updateCallbacks.forEach(callback => callback());
  }, [updateCallbacks]);

  // Subscription pour les changements en temps réel
  useEffect(() => {
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Subscription aux changements de user_wine selon le mode
      const subscription = supabase
        .channel('user_wine_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_wine',
            filter: caveMode === 'user' 
              ? `user_id=eq.${user.id}` 
              : `household_id=eq.${caveId}`
          },
          (payload) => {
            console.log('Changement détecté dans user_wine:', payload);
            fetchWines();
          }
        )
        .subscribe();

      return subscription;
    };

    let subscription: any;
    setupSubscription().then((sub) => {
      subscription = sub;
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [caveMode, caveId]);

  const addHistoryEvent = async (wineId: string, eventType: string, data?: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const validEventTypes = ['added', 'tasted', 'stock_change', 'removed', 'noted', 'favorited'];
      if (!validEventTypes.includes(eventType)) {
        console.warn('Type d\'événement non valide, ignoré:', eventType);
        return;
      }

      // Vérifier s'il n'y a pas déjà un événement similaire récent
      if (eventType !== 'tasted') {
        const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();
        const { data: recentEvents } = await supabase
          .from('wine_history')
          .select('id')
          .eq('user_id', user.id)
          .eq('wine_id', wineId)
          .eq('event_type', eventType)
          .gte('created_at', fiveSecondsAgo)
          .limit(1);

        if (recentEvents && recentEvents.length > 0) {
          console.log('Événement historique similaire déjà présent, ignoré:', eventType);
          return;
        }
      }

      const historyEvent = {
        user_id: caveMode === 'user' ? user.id : null,
        household_id: caveMode === 'household' ? caveId : null,
        wine_id: wineId,
        event_type: eventType,
        event_date: new Date().toISOString(),
        ...data
      };

      console.log('📝 Tentative d\'ajout d\'événement historique:', {
        eventType,
        wineId,
        caveMode,
        caveId,
        data
      });

      const { error: insertError } = await supabase
        .from('wine_history')
        .insert(historyEvent);

      if (insertError) {
        console.error('❌ Erreur lors de l\'ajout de l\'événement historique:', insertError);
      } else {
        console.log('✅ Événement historique ajouté avec succès:', eventType);
      }
    } catch (err) {
      console.error('Erreur lors de l\'ajout de l\'événement historique:', err);
    }
  };

  const fetchWines = async () => {
    try {
      if (!caveId) {
        console.log('Aucune cave active');
        setWines([]);
        setLoading(false);
        return;
      }

      console.log('Récupération des vins pour la cave:', { caveMode, caveId });

      // Construire la requête selon le mode
      let query = supabase
        .from('user_wine')
        .select(`
          *,
          wine (
            *,
            producer (*),
            country (*)
          )
        `);

      if (caveMode === 'user') {
        query = query.eq('user_id', caveId).is('household_id', null);
      } else {
        query = query.eq('household_id', caveId).is('user_id', null);
      }

      const { data: userWines, error: fetchError } = await query.order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Erreur Supabase lors de la récupération:', fetchError);
        throw new Error(`Erreur lors de la récupération: ${fetchError.message}`);
      }

      console.log('Vins récupérés:', userWines?.length || 0, 'vins');

      // Transformer les données
      const transformedWines: Wine[] = [];
      
      for (const userWine of userWines || []) {
        // Ignorer les vins avec stock = 0 SAUF s'ils sont dans la wishlist
        if (userWine.amount === 0 && userWine.origin !== 'wishlist') {
          continue;
        }
        const wine = userWine.wine;
        if (!wine) continue;

        // Déterminer le nom et le domaine
        const rawName = String(wine.name || '');
        const rawDomaine = typeof wine.producer === 'object' && wine.producer?.name ? String(wine.producer.name) : (typeof wine.producer === 'string' ? wine.producer : 'Domaine inconnu');
        
        const isGenericName = !rawName || 
          rawName === 'Vin sans nom' || 
          rawName === 'Vin non identifié' || 
          rawName === 'Nom inconnu' ||
          rawName.length < 3;
        
        const finalName = isGenericName && rawDomaine !== 'Domaine inconnu' ? rawDomaine : rawName;
        const finalDomaine = isGenericName && rawDomaine !== 'Domaine inconnu' ? '' : rawDomaine;

        const countryName = wine.country && typeof wine.country === 'object' && wine.country.name ? String(wine.country.name) : '';
        const priceRange = typeof wine.price_range === 'string' ? wine.price_range : '';

        const transformedWine: Wine = {
          id: String(wine.id || ''),
          name: finalName,
          vintage: wine.year ? parseInt(wine.year) : 0,
          domaine: finalDomaine,
          color: (typeof wine.wine_type === 'string' ? wine.wine_type : 'red') as 'red' | 'white' | 'rose' | 'sparkling',
          region: typeof wine.region === 'string' ? wine.region : '',
          country: countryName,
          priceRange: priceRange,
          appellation: typeof wine.appellation === 'string' ? wine.appellation : '',
          grapes: (() => {
            try {
              if (!wine.grapes) return [];
              if (Array.isArray(wine.grapes)) {
                return wine.grapes.map((g: any) => {
                  if (typeof g === 'string') return g;
                  if (g && typeof g === 'object' && g.name) return String(g.name);
                  return String(g || '');
                }).filter((g: any) => g && g.trim() !== '');
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
          note: userWine.rating || 0,
          origin: userWine.origin || ((userWine.amount || 0) > 0 ? 'cellar' : 'wishlist'),
          stock: (userWine.origin === 'wishlist' || (!userWine.origin && (userWine.amount || 0) === 0)) ? 0 : (userWine.amount || 0),
          personalComment: typeof userWine.personal_comment === 'string' ? userWine.personal_comment : '',
          tastingProfile: userWine.tasting_profile || {
            power: 0,
            tannin: 0,
            acidity: 0,
            sweetness: 0
          },
          history: [], // TODO: Récupérer l'historique
          favorite: userWine.favorite || false,
          createdAt: userWine.created_at,
          updatedAt: userWine.updated_at || userWine.created_at
        };
        
        transformedWines.push(transformedWine);
      }

      console.log('Vins transformés:', transformedWines.length, 'vins');
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
      console.log('🔄 updateWine appelé avec:', { wineId, updates, caveMode, caveId });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      // Mettre à jour dans user_wine (champs spécifiques à l'utilisateur)
      const userWineUpdates: any = {};
      
      if (updates.stock !== undefined) {
        const currentStock = wines.find(w => w.id === wineId)?.stock || 0;
        const newStock = updates.stock;
        
        if (newStock < currentStock) {
          console.log('🍷 Création d\'une dégustation:', {
            wineId,
            currentStock,
            newStock,
            reduction: currentStock - newStock
          });
          await addHistoryEvent(wineId, 'tasted', {
            previous_amount: currentStock,
            new_amount: newStock,
            notes: 'Dégustation via réduction de stock'
          });
        }
        
        userWineUpdates.amount = updates.stock;
      }
      if (updates.note !== undefined) userWineUpdates.rating = updates.note;
      if (updates.origin !== undefined) userWineUpdates.origin = updates.origin;
      if (updates.personalComment !== undefined) userWineUpdates.personal_comment = updates.personalComment;
      if (updates.favorite !== undefined) userWineUpdates.favorite = updates.favorite;

      if (Object.keys(userWineUpdates).length > 0) {
        let updateQuery = supabase
          .from('user_wine')
          .update(userWineUpdates)
          .eq('wine_id', wineId);

        if (caveMode === 'user') {
          updateQuery = updateQuery.eq('user_id', caveId).is('household_id', null);
        } else {
          updateQuery = updateQuery.eq('household_id', caveId).is('user_id', null);
        }

        const { error: userWineError } = await updateQuery;

        if (userWineError) {
          console.error('Erreur Supabase lors de la mise à jour user_wine:', userWineError);
          throw new Error(`Erreur lors de la mise à jour user_wine: ${userWineError.message}`);
        }
      }

      // Mettre à jour dans wine (champs généraux du vin)
      const wineUpdates: any = {};
      
      if (updates.description !== undefined) wineUpdates.description = updates.description;
      if (updates.name !== undefined) wineUpdates.name = updates.name;
      if (updates.domaine !== undefined) wineUpdates.domaine = updates.domaine;
      if (updates.vintage !== undefined) wineUpdates.year = updates.vintage?.toString();
      if (updates.region !== undefined) wineUpdates.region = updates.region;
      if (updates.color !== undefined) wineUpdates.wine_type = updates.color;
      if (updates.country !== undefined) {
        const { data: countryData } = await supabase
          .from('country')
          .select('id')
          .eq('name', updates.country)
          .single();
        
        if (countryData) {
          wineUpdates.country_id = countryData.id;
        }
      }
      if (updates.priceRange !== undefined) wineUpdates.price_range = updates.priceRange;
      if (updates.grapes !== undefined) wineUpdates.grapes = updates.grapes;

      if (Object.keys(wineUpdates).length > 0) {
        const { error: wineError } = await supabase
          .from('wine')
          .update(wineUpdates)
          .eq('id', wineId);

        if (wineError) {
          console.error('Erreur Supabase lors de la mise à jour wine:', wineError);
          throw new Error(`Erreur lors de la mise à jour wine: ${wineError.message}`);
        }
      }

      // Mettre à jour l'état local immédiatement
      setWines(prevWines => {
        const updatedWines = prevWines.map(wine => 
          wine.id === wineId 
            ? { 
                ...wine, 
                ...updates,
                stock: updates.stock !== undefined ? updates.stock : wine.stock,
                note: updates.note !== undefined ? updates.note : wine.note,
                origin: updates.origin !== undefined ? updates.origin : wine.origin,
                personalComment: updates.personalComment !== undefined ? updates.personalComment : wine.personalComment,
                tastingProfile: updates.tastingProfile !== undefined ? updates.tastingProfile : wine.tastingProfile,
                favorite: updates.favorite !== undefined ? updates.favorite : wine.favorite,
                description: updates.description !== undefined ? updates.description : wine.description
              }
            : wine
        );
        
        console.log('🍷 Vins mis à jour localement:', updatedWines.length, 'vins');
        return updatedWines;
      });
      
      notifyUpdate();
    } catch (err) {
      console.error('Erreur complète lors de la mise à jour:', err);
      setError(err instanceof Error ? err : new Error('Erreur lors de la mise à jour'));
    }
  };

  const addWineToCellar = async (wine: Wine) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      // Vérifier les doublons dans la cave
      const cellarWines = wines.filter(w => w.origin === 'cellar');
      const duplicateCheck = checkWineDuplicate(wine, cellarWines);
      
      if (duplicateCheck.isDuplicate) {
        const existingWine = duplicateCheck.existingWine;
        if (existingWine) {
          console.log('Vin existant trouvé, ajout d\'une bouteille supplémentaire');
          await updateWine(existingWine.id, { stock: (existingWine.stock || 0) + 1 });
          return;
        }
      }

      if (duplicateCheck.duplicateType === 'similar') {
        console.log('ℹ️', getSimilarWineMessage(duplicateCheck));
      }

      // 1. Vérifier si le vin existe déjà dans la table wine
      let wineId = wine.id;
      
      if (wineId.startsWith('ocr-') || wineId.length < 36) {
        console.log('Création d\'un nouveau vin dans la base de données');
        wineId = generateId();
      } else {
        const { data: existingWine } = await supabase
          .from('wine')
          .select('id')
          .eq('id', wineId)
          .single();
        
        if (existingWine) {
          console.log('Vin existe déjà, utilisation de l\'ID existant:', wineId);
          
          // Insérer dans user_wine avec le bon mode
          const wineData = {
            wine_id: wineId,
            amount: wine.stock || 1,
            rating: null,
            origin: wine.origin || 'cellar',
            ...(caveMode === 'user' 
              ? { user_id: caveId, household_id: null }
              : { user_id: null, household_id: caveId }
            )
          };

          const { error } = await supabase
            .from('user_wine')
            .insert(wineData);

          if (error) throw error;

          await addHistoryEvent(wineId, 'added', {
            new_amount: wine.stock || 1
          });

          console.log('Vin ajouté à la cave avec succès');
          await fetchWines();
          notifyUpdate();
          return;
        }
      }
        
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
          image_uri: await uploadWineImage(wineId, wine.imageUri || ''),
          grapes: wine.grapes
        });
      
      if (wineError) {
        console.error('Erreur création vin:', wineError);
        throw wineError;
      }
      
      console.log('Vin créé avec succès:', wineId);

      // 2. Insérer dans user_wine avec le bon mode
      const wineData = {
        wine_id: wineId,
        amount: wine.stock || 1,
        rating: wine.note || null,
        origin: 'cellar',
        ...(caveMode === 'user' 
          ? { user_id: caveId, household_id: null }
          : { user_id: null, household_id: caveId }
        )
      };

      const { error } = await supabase
        .from('user_wine')
        .insert(wineData);

      if (error) throw error;

      await addHistoryEvent(wineId, 'added', {
        new_amount: wine.stock || 1
      });

      console.log('Vin ajouté à la cave avec succès');
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

      // Vérifier les doublons dans la wishlist
      const wishlistWines = wines.filter(w => w.origin === 'wishlist');
      const duplicateCheck = checkWineDuplicate(wine, wishlistWines);
      
      if (duplicateCheck.isDuplicate) {
        const errorMessage = getDuplicateErrorMessage(duplicateCheck, 'wishlist');
        throw new Error(errorMessage);
      }

      if (duplicateCheck.duplicateType === 'similar') {
        console.log('ℹ️', getSimilarWineMessage(duplicateCheck));
      }

      // La wishlist reste toujours personnelle, même en mode household
      const wineData = {
        wine_id: wine.id,
        amount: 0,
        rating: null,
        origin: 'wishlist',
        user_id: user.id,
        household_id: null
      };

      const { error } = await supabase
        .from('user_wine')
        .insert(wineData);

      if (error) throw error;

      await addHistoryEvent(wine.id, 'added');

      console.log('Vin ajouté à la wishlist avec succès');
      await fetchWines();
    } catch (err) {
      console.error('Erreur ajout wishlist:', err);
      setError(err instanceof Error ? err : new Error('Erreur lors de l\'ajout'));
    }
  };

  useEffect(() => {
    fetchWines();
  }, [caveMode, caveId]);

  return {
    wines,
    loading,
    error,
    fetchWines,
    updateWine,
    addWineToCellar,
    addWineToWishlist,
    subscribeToUpdates,
    notifyUpdate,
    caveMode,
    isShared,
    householdName
  };
}
