import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { uploadWineImage } from '../lib/uploadWineImage';
import { checkWineDuplicate, getDuplicateErrorMessage, getSimilarWineMessage } from '../lib/wineDuplicateDetection';
import { getWinesStore, setWinesStore, subscribeWines } from '../lib/winesStore';
import { Wine } from '../types/wine';

// Génère un UUID v4 vraiment aléatoire
function generateId(): string {
  // Utiliser crypto.randomUUID() si disponible (plus fiable)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback avec génération vraiment aléatoire
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function useWines() {
  const DEBUG = false;
  const [wines, setWines] = useState<Wine[]>(getWinesStore());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [updateCallbacks, setUpdateCallbacks] = useState<(() => void)[]>([]);
  const lastFetchRef = useRef(0);
  const isFetchingRef = useRef(false);

  // Fonction pour s'abonner aux mises à jour
  const subscribeToUpdates = useCallback((callback: () => void) => {
    setUpdateCallbacks(prev => [...prev, callback]);
    return () => {
      setUpdateCallbacks(prev => prev.filter(cb => cb !== callback));
    };
  }, []);

  // Fonction pour notifier tous les abonnés
  const notifyUpdate = useCallback(() => {
    if (DEBUG) console.log('🔔 Notifying', updateCallbacks.length, 'subscribers of wine updates');
    updateCallbacks.forEach(callback => callback());
  }, [updateCallbacks]);

  // Sync local state with global store
  useEffect(() => {
    const unsub = subscribeWines((next) => {
      setWines(next);
    });
    return () => { unsub(); };
  }, []);

  // Subscription pour les changements en temps réel
  useEffect(() => {
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Subscription aux changements de user_wine
      const subscription = supabase
        .channel('user_wine_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_wine',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            if (DEBUG) console.log('Changement détecté dans user_wine:', payload);
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
  }, []);

  const addHistoryEvent = async (wineId: string, eventType: string, data?: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Valider le type d'événement selon les contraintes de la base
      const validEventTypes = ['added', 'tasted', 'stock_change', 'removed', 'noted', 'favorited'];
      if (!validEventTypes.includes(eventType)) {
        console.warn('Type d\'événement non valide, ignoré:', eventType);
        return;
      }

      // Vérifier s'il n'y a pas déjà un événement similaire récent (dans les 5 dernières secondes)
      // SAUF pour les dégustations qui peuvent être multiples
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

        // Si un événement similaire existe déjà récemment, ne pas en ajouter un nouveau
        if (recentEvents && recentEvents.length > 0) {
          console.log('Événement historique similaire déjà présent, ignoré:', eventType);
          return;
        }
      }

      const historyEvent = {
        user_id: user.id,
        wine_id: wineId,
        event_type: eventType,
        event_date: new Date().toISOString(),
        ...data
      };

      console.log('📝 Tentative d\'ajout d\'événement historique:', {
        eventType,
        wineId,
        userId: user.id,
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
    const now = Date.now();
    if (isFetchingRef.current) return;
    if (now - lastFetchRef.current < 3000) return; // throttle 3s pour éviter les boucles
    isFetchingRef.current = true;
    lastFetchRef.current = now;
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

      // Récupérer l'historique pour tous les vins
      const wineIds = userWines?.map(uw => uw.wine_id) || [];
      let wineHistory: any[] = [];
      
      if (wineIds.length > 0) {
        const { data: historyData, error: historyError } = await supabase
          .from('wine_history')
          .select('id, wine_id, event_type, event_date, rating, notes')
          .eq('user_id', user.id)
          .in('wine_id', wineIds)
          .order('event_date', { ascending: false });

        if (!historyError) {
          wineHistory = historyData || [];
        } else {
          console.warn('Erreur lors de la récupération de l\'historique:', historyError);
        }
      }

      // Résoudre les utilisateurs source (amis) sans jointure PostgREST
      let sourceUserMap: Record<string, { id: string; first_name?: string; avatar?: string }> = {};
      try {
        const sourceIds = (userWines || [])
          .map((uw: any) => uw?.source_user_id)
          .filter((v: any) => !!v);
        const uniqueSourceIds = Array.from(new Set(sourceIds));
        if (uniqueSourceIds.length > 0) {
          const { data: sourceUsers, error: sourceErr } = await supabase
            .from('User')
            .select('id, first_name, avatar')
            .in('id', uniqueSourceIds as string[]);
          if (!sourceErr && Array.isArray(sourceUsers)) {
            sourceUserMap = Object.fromEntries(
              sourceUsers.map((u: any) => [String(u.id), { id: String(u.id), first_name: u.first_name || undefined, avatar: u.avatar || undefined }])
            );
          }
        }
      } catch (e) {
        console.warn('Impossible de résoudre les utilisateurs source:', e);
      }

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
        
        // Si le nom est vide ou générique, utiliser le domaine comme nom
        const isGenericName = !rawName || 
          rawName === 'Vin sans nom' || 
          rawName === 'Vin non identifié' || 
          rawName === 'Nom inconnu' ||
          rawName.length < 3;
        
        const finalName = isGenericName && rawDomaine !== 'Domaine inconnu' ? rawDomaine : rawName;
        const finalDomaine = isGenericName && rawDomaine !== 'Domaine inconnu' ? '' : rawDomaine;

        const countryName = wine.country && typeof wine.country === 'object' && wine.country.name ? String(wine.country.name) : '';
        const priceRange = typeof wine.price_range === 'string' ? wine.price_range : '';
        
        console.log('🍷 Mapping vin:', finalName, {
          country: wine.country,
          countryName,
          priceRange,
          region: wine.region
        });

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
          history: wineHistory.filter(h => h.wine_id === wine.id).map(h => ({
            id: h.id,
            event_type: h.event_type,
            previous_amount: h.previous_amount,
            new_amount: h.new_amount,
            rating: h.rating,
            notes: h.notes,
            event_date: h.event_date,
            created_at: h.created_at
          })).sort((a, b) => new Date(b.event_date || b.created_at).getTime() - new Date(a.event_date || a.created_at).getTime()),
          favorite: userWine.favorite || false,
          sourceUser: (() => {
            const sid = (userWine as any).source_user_id;
            if (sid && sourceUserMap[sid]) {
              return sourceUserMap[sid];
            }
            return undefined;
          })(),
          createdAt: userWine.created_at,
          updatedAt: userWine.updated_at || userWine.created_at
        };
        
        transformedWines.push(transformedWine);
      }

      // Ne mettre à jour le store que si un changement réel est détecté
      const prev = getWinesStore();
      const prevSig = prev.map(w => `${w.id}:${w.updatedAt || ''}:${w.stock || 0}:${w.favorite ? 1 : 0}`).join('|');
      const nextSig = transformedWines.map(w => `${w.id}:${w.updatedAt || ''}:${w.stock || 0}:${w.favorite ? 1 : 0}`).join('|');
      if (prevSig !== nextSig || prev.length !== transformedWines.length) {
        console.log('Vins transformés:', transformedWines.length, 'vins');
        setWinesStore(transformedWines);
      } else {
        // Pas de changement significatif
      }
    } catch (err) {
      console.error('Erreur complète lors de la récupération des vins:', err);
      setError(err instanceof Error ? err : new Error('Erreur inconnue'));
      setWines([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const updateWine = async (wineId: string, updates: Partial<Wine>) => {
    try {
      console.log('🔄 updateWine appelé avec:', { wineId, updates });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      // Mettre à jour dans user_wine (champs spécifiques à l'utilisateur)
      const userWineUpdates: any = {};
      
      if (updates.stock !== undefined) {
        // Récupérer le stock actuel pour détecter une réduction
        const { data: currentWine } = await supabase
          .from('user_wine')
          .select('amount')
          .eq('user_id', user.id)
          .eq('wine_id', wineId)
          .single();
        
        const currentStock = currentWine?.amount || 0;
        const newStock = updates.stock;
        
        // Si le stock diminue, créer une entrée de dégustation
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
          
          // Rafraîchir les vins pour mettre à jour l'UI
          await fetchWines();
        }
        
        userWineUpdates.amount = updates.stock;
      }
      if (updates.note !== undefined) userWineUpdates.rating = updates.note;
      if (updates.origin !== undefined) userWineUpdates.origin = updates.origin;
      if (updates.personalComment !== undefined) userWineUpdates.personal_comment = updates.personalComment;
      // Enregistrer le profil de dégustation côté user_wine
      if (updates.tastingProfile !== undefined) userWineUpdates.tasting_profile = updates.tastingProfile;
      if (updates.favorite !== undefined) userWineUpdates.favorite = updates.favorite;

      if (Object.keys(userWineUpdates).length > 0) {
        const { error: userWineError } = await supabase
          .from('user_wine')
          .update(userWineUpdates)
          .eq('user_id', user.id)
          .eq('wine_id', wineId);

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
      // Pays: utiliser la table legacy "country" (FK wine.country_id -> country.id)
      if (updates.country !== undefined) {
        let countryId: string | null = null;
        const { data: countryRow } = await supabase
          .from('country')
          .select('id')
          .eq('name', updates.country)
          .single();
        if (countryRow?.id) {
          countryId = countryRow.id as string;
        } else {
          // Créer l'entrée si absente (pas de flag ici, la table country n'en a pas)
          const { data: newCountry, error: insertCountryError } = await supabase
            .from('country')
            .insert({ name: updates.country })
            .select('id')
            .single();
          if (!insertCountryError && newCountry?.id) {
            countryId = newCountry.id as string;
          }
        }
        if (countryId) {
          wineUpdates.country_id = countryId;
        }
      }
      if (updates.priceRange !== undefined) wineUpdates.price_range = updates.priceRange;
      if (updates.grapes !== undefined) wineUpdates.grapes = updates.grapes;

      console.log('📝 Mise à jour wine avec:', wineUpdates);

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

      // Ajouter des événements d'historique pour les modifications importantes
      const currentWine = wines.find(w => w.id === wineId);
      if (currentWine) {
        // Ajouter un événement pour le changement de stock
        if (updates.stock !== undefined && updates.stock !== (currentWine.stock || 0)) {
          await addHistoryEvent(wineId, 'stock_change', {
            previous_amount: currentWine.stock || 0,
            new_amount: updates.stock
          });
        }
        
        // Ajouter un événement pour le changement de note
        if (updates.note !== undefined && updates.note !== currentWine.note) {
          await addHistoryEvent(wineId, 'rating_change', {
            rating: updates.note
          });
        }
        
        // Ajouter un événement pour le changement d'origine
        if (updates.origin !== undefined && updates.origin !== currentWine.origin) {
          await addHistoryEvent(wineId, 'origin_change', {
            notes: `Déplacé vers ${updates.origin === 'cellar' ? 'la cave' : 'la wishlist'}`
          });
        }
      }

      // Mettre à jour l'état local immédiatement avec les nouvelles données
      setWines(prevWines => {
        const base = prevWines.length ? prevWines : getWinesStore();
        const updatedWines = base.map(wine => 
          wine.id === wineId 
            ? { 
                ...wine, 
                ...updates,
                // Mettre à jour les champs spécifiques
                stock: updates.stock !== undefined ? updates.stock : wine.stock,
                note: updates.note !== undefined ? updates.note : wine.note,
                origin: updates.origin !== undefined ? updates.origin : wine.origin,
                personalComment: updates.personalComment !== undefined ? updates.personalComment : wine.personalComment,
                tastingProfile: updates.tastingProfile !== undefined ? updates.tastingProfile : wine.tastingProfile,
                favorite: updates.favorite !== undefined ? updates.favorite : wine.favorite,
                description: updates.description !== undefined ? updates.description : wine.description,
                name: updates.name !== undefined ? updates.name : wine.name,
                domaine: updates.domaine !== undefined ? updates.domaine : wine.domaine,
                vintage: updates.vintage !== undefined ? updates.vintage : wine.vintage,
                region: updates.region !== undefined ? updates.region : wine.region,
                country: updates.country !== undefined ? updates.country : wine.country,
                color: updates.color !== undefined ? updates.color : wine.color,
                priceRange: updates.priceRange !== undefined ? updates.priceRange : wine.priceRange,
                grapes: updates.grapes !== undefined ? updates.grapes : wine.grapes,
                // Propager éventuellement le sourceUser si on déplace/ajoute depuis un ami
                sourceUser: (updates as any).sourceUser !== undefined ? (updates as any).sourceUser : wine.sourceUser
              }
            : wine
        );
        
        console.log('🍷 Vins mis à jour localement:', updatedWines.length, 'vins');
        if (updates.favorite !== undefined) {
          console.log('❤️ Mise à jour favorite:', { wineId, newFavorite: updates.favorite });
        }
        setWinesStore(updatedWines);
        return updatedWines;
      });
      
      // Notifier tous les abonnés de la mise à jour
      notifyUpdate();
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

      // Vérifier les doublons dans la cave
      const cellarWines = wines.filter(w => w.origin === 'cellar');
      const duplicateCheck = checkWineDuplicate(wine, cellarWines);
      
      if (duplicateCheck.isDuplicate) {
        // Pour la cave, on peut ajouter une bouteille supplémentaire
        const existingWine = duplicateCheck.existingWine;
        if (existingWine) {
          console.log('Vin existant trouvé, ajout d\'une bouteille supplémentaire');
          await updateWine(existingWine.id, { stock: (existingWine.stock || 0) + 1 });
          return;
        }
      }

      // Afficher un message d'information pour les vins similaires
      if (duplicateCheck.duplicateType === 'similar') {
        console.log('ℹ️', getSimilarWineMessage(duplicateCheck));
      }

      // 1. Vérifier si le vin existe déjà dans la table wine
      let wineId = wine.id;
      
      // Si l'ID commence par "ocr-" ou est un ID temporaire, c'est un vin temporaire de l'OCR, il faut le créer
      if (wineId.startsWith('ocr-') || wineId.length < 36) {
        console.log('Création d\'un nouveau vin dans la base de données');
        
        // Générer un nouvel ID UUID compatible Expo
        wineId = generateId();
      } else {
        // Vérifier si le vin existe déjà dans la base
        const { data: existingWine } = await supabase
          .from('wine')
          .select('id')
          .eq('id', wineId)
          .single();
        
        if (existingWine) {
          console.log('Vin existe déjà, utilisation de l\'ID existant:', wineId);
          // Passer directement à l'insertion dans user_wine
          const { error } = await supabase
            .from('user_wine')
            .insert({
              user_id: user.id,
              wine_id: wineId,
              amount: wine.stock || 1,
              rating: null,
              origin: wine.origin || 'cellar'
            });

          if (error) throw error;

          // Ajouter un événement d'historique pour l'ajout
          await addHistoryEvent(wineId, 'added');

          console.log('Vin ajouté à la cave avec succès');
          
          // Recharger les vins
          await fetchWines();
          notifyUpdate();
          return;
        } else {
          console.log('Vin n\'existe pas, création nécessaire');
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
      if (wine.country) {
        const { data: existingCountry } = await supabase
          .from('wine_countries')
          .select('id')
          .eq('name', wine.country)
          .single();
        
        if (existingCountry) {
          countryId = existingCountry.id;
        } else {
          const { data: newCountry } = await supabase
            .from('wine_countries')
            .insert({ name: wine.country, flag_emoji: '🏳️' })
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

      // 2. Insérer dans user_wine
      const { error } = await supabase
        .from('user_wine')
        .insert({
          user_id: user.id,
          wine_id: wineId,
          amount: wine.stock || 1,
          rating: wine.note || null,
          origin: 'cellar'
        });

      if (error) throw error;

      // Ajouter un événement d'historique pour l'ajout
      await addHistoryEvent(wineId, 'added', {
        new_amount: wine.stock || 1
      });

      console.log('Vin ajouté à la cave avec succès');
      
      // Recharger les vins
      await fetchWines();
    } catch (err) {
      console.error('Erreur ajout cave:', err);
      setError(err instanceof Error ? err : new Error('Erreur lors de l\'ajout'));
    }
  };

  const addWineToWishlist = async (wine: Wine & { friendId?: string }) => {
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

      // Afficher un message d'information pour les vins similaires
      if (duplicateCheck.duplicateType === 'similar') {
        console.log('ℹ️', getSimilarWineMessage(duplicateCheck));
      }

      // 1. Vérifier si le vin existe déjà dans la table wine
      let wineId = wine.id;
      
      // Si l'ID commence par "ocr-" ou est un ID temporaire, c'est un vin temporaire de l'OCR, il faut le créer
      if (wineId.startsWith('ocr-') || wineId.length < 36) {
        console.log('Création d\'un nouveau vin dans la base de données');
        
        // Générer un nouvel ID UUID compatible Expo
        wineId = generateId();
      } else {
        // Vérifier si le vin existe déjà dans la base
        const { data: existingWine } = await supabase
          .from('wine')
          .select('id')
          .eq('id', wineId)
          .single();
        
        if (existingWine) {
          console.log('Vin existe déjà, utilisation de l\'ID existant:', wineId);
          
          // Mettre à jour l'image si nécessaire
          if (wine.imageUri && wine.imageUri.startsWith('file://')) {
            const updatedImageUri = await uploadWineImage(wineId, wine.imageUri);
            if (updatedImageUri) {
              await supabase
                .from('wine')
                .update({ image_uri: updatedImageUri })
                .eq('id', wineId);
            }
          }
          
          // Passer directement à l'insertion dans user_wine
          const payload: any = {
            user_id: user.id,
            wine_id: wineId,
            amount: 0,
            rating: null,
            origin: 'wishlist'
          };
          if (wine.friendId) payload.source_user_id = wine.friendId;
          let insertErrorPrimary = null as any;
          let res = await supabase
            .from('user_wine')
            .insert(payload);
          if (res.error) {
            insertErrorPrimary = res.error;
            // Fallback: certains environnements n'ont pas encore la colonne source_user_id
            const msg = String(res.error.message || '');
            if (msg.includes('source_user_id') || String(res.error.code).includes('PGRST')) {
              const { source_user_id, ...fallbackPayload } = payload as any;
              const retry = await supabase.from('user_wine').insert(fallbackPayload);
              if (retry.error) throw retry.error;
            } else {
              throw res.error;
            }
          }

          // Ajouter un événement d'historique pour l'ajout (avec origine sociale si ami)
          try {
            if (wine.friendId) {
              // Récupérer prénom/avatar
              const { data: friendUser } = await supabase
                .from('User')
                .select('first_name, avatar')
                .eq('id', wine.friendId)
                .single();
              // Récupérer l'origine chez l'ami
              const { data: friendUW } = await supabase
                .from('user_wine')
                .select('origin')
                .eq('user_id', wine.friendId)
                .eq('wine_id', wineId)
                .single();
              const originText = friendUW?.origin === 'wishlist' ? "liste d'envie" : 'cave';
              const friendName = friendUser?.first_name || 'un ami';
              await supabase.from('wine_history').insert({
                user_id: user.id,
                wine_id: wineId,
                event_type: 'added_to_wishlist',
                event_date: new Date().toISOString(),
                notes: `Ajouté depuis la ${originText} de ${friendName}`
              });
            } else {
              await addHistoryEvent(wineId, 'added_to_wishlist');
            }
          } catch (e) {
            console.warn('Impossible d\'ajouter l\'historique social:', e);
          }

          console.log('Vin ajouté à la wishlist avec succès');
          
          // Recharger les vins
          await fetchWines();
          notifyUpdate();
          return;
        } else {
          console.log('Vin n\'existe pas, création nécessaire');
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
        if (wine.country) {
          const { data: existingCountry } = await supabase
            .from('wine_countries')
            .select('id')
            .eq('name', wine.country)
            .single();
          
          if (existingCountry) {
            countryId = existingCountry.id;
          } else {
            const { data: newCountry } = await supabase
              .from('wine_countries')
              .insert({ name: wine.country, flag_emoji: '🏳️' })
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

      // 2. Insérer dans user_wine
      const payload2: any = {
        user_id: user.id,
        wine_id: wineId,
        amount: 0,
        rating: null,
        origin: 'wishlist'
      };
      if (wine.friendId) payload2.source_user_id = wine.friendId;
      let res2 = await supabase
        .from('user_wine')
        .insert(payload2);
      if (res2.error) {
        const msg = String(res2.error.message || '');
        if (msg.includes('source_user_id') || String(res2.error.code).includes('PGRST')) {
          const { source_user_id, ...fallbackPayload2 } = payload2 as any;
          const retry2 = await supabase.from('user_wine').insert(fallbackPayload2);
          if (retry2.error) throw retry2.error;
        } else {
          throw res2.error;
        }
      }

      // Ajouter un événement d'historique pour l'ajout (avec origine sociale si ami)
      try {
        if (wine.friendId) {
          const { data: friendUser } = await supabase
            .from('User')
            .select('first_name, avatar')
            .eq('id', wine.friendId)
            .single();
          const { data: friendUW } = await supabase
            .from('user_wine')
            .select('origin')
            .eq('user_id', wine.friendId)
            .eq('wine_id', wineId)
            .single();
          const originText = friendUW?.origin === 'wishlist' ? "liste d'envie" : 'cave';
          const friendName = friendUser?.first_name || 'un ami';
          await supabase.from('wine_history').insert({
            user_id: user.id,
            wine_id: wineId,
            event_type: 'added_to_wishlist',
            event_date: new Date().toISOString(),
            notes: `Ajouté depuis la ${originText} de ${friendName}`
          });
        } else {
          await addHistoryEvent(wineId, 'added_to_wishlist');
        }
      } catch (e) {
        console.warn('Impossible d\'ajouter l\'historique social:', e);
      }

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

  const cleanupDuplicates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      console.log('🧹 Nettoyage des doublons...');
      
      // Nettoyer les doublons de la wishlist
      const wishlistWines = wines.filter(w => w.origin === 'wishlist');
      const duplicatesToRemove: string[] = [];
      const processedWines: Wine[] = [];

      for (const wine of wishlistWines) {
        const duplicateCheck = checkWineDuplicate(wine, processedWines);
        
        if (duplicateCheck.isDuplicate) {
          console.log(`🚫 Doublon trouvé: ${wine.name} (${wine.domaine})`);
          duplicatesToRemove.push(wine.id);
        } else {
          processedWines.push(wine);
        }
      }

      if (duplicatesToRemove.length > 0) {
        const { error } = await supabase
          .from('user_wine')
          .delete()
          .eq('user_id', user.id)
          .in('wine_id', duplicatesToRemove);

        if (error) throw error;
        
        console.log(`✅ ${duplicatesToRemove.length} doublons supprimés`);
        await fetchWines();
      }

      return duplicatesToRemove.length;
    } catch (err) {
      console.error('Erreur nettoyage doublons:', err);
      throw err;
    }
  };

  return {
    wines,
    loading,
    error,
    fetchWines,
    updateWine,
    addWineToCellar,
    addWineToWishlist,
    removeWineFromCellar,
    removeWineFromWishlist,
    subscribeToUpdates,
    notifyUpdate,
    cleanupDuplicates
  };
} 