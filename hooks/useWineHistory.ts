import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useActiveCave } from './useActiveCave';
import { useUser } from './useUser';

export interface WineHistoryEntry {
  id: string;
  user_id: string;
  wine_id: string;
  notes?: string;
  created_at: string;
}

export interface TastedWine {
  wine: {
    id: string;
    name: string;
    year?: string;
    wine_type?: string;
    image_uri?: string;
    producer?: {
      name: string;
    };
  };
  tastings: {
    id: string;
    date: string;
    note?: string;
    rating?: number;
  }[];
  lastTastedAt: string;
  tastingCount: number;
  favorite?: boolean;
}

export function useWineHistory(userId?: string | null) {
  const { user } = useUser();
  const { caveId, caveMode, isShared } = useActiveCave();
  
  // Utiliser l'ID fourni ou l'utilisateur connecté
  const targetUserId = userId || user?.id;
  
  // Pour un ami, utiliser directement son ID comme caveId et forcer le mode 'user'
  const effectiveCaveId = userId ? userId : caveId;
  const effectiveCaveMode = userId ? 'user' : caveMode;
  const effectiveIsShared = userId ? false : isShared;
  const [history, setHistory] = useState<WineHistoryEntry[]>([]);
  const [tastedWines, setTastedWines] = useState<TastedWine[]>([]);
  const [loading, setLoading] = useState(false);
  const lastFetchHistoryRef = useRef(0);
  const lastFetchTastedRef = useRef(0);
  const isFetchingHistoryRef = useRef(false);
  const isFetchingTastedRef = useRef(false);

  // Récupérer l'historique des dégustations
  const fetchHistory = async () => {
    const now = Date.now();
    if (isFetchingHistoryRef.current) return;
    if (now - lastFetchHistoryRef.current < 1000) return;
    isFetchingHistoryRef.current = true;
    lastFetchHistoryRef.current = now;
    if (!targetUserId || !effectiveCaveId) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('wine_history')
        .select('*')
        .order('created_at', { ascending: false });

      // Filtrer selon le mode actif
      if (effectiveCaveMode === 'user') {
        query = query.eq('user_id', effectiveCaveId);
      } else {
        query = query.eq('household_id', caveId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
    } finally {
      setLoading(false);
      isFetchingHistoryRef.current = false;
    }
  };

  // Récupérer les vins dégustés (groupés par vin)
  const fetchTastedWines = async () => {
    const now = Date.now();
    if (isFetchingTastedRef.current) return;
    if (now - lastFetchTastedRef.current < 1000) return;
    isFetchingTastedRef.current = true;
    lastFetchTastedRef.current = now;
    if (!targetUserId || !effectiveCaveId) return;
    
    setLoading(true);
    try {
      // console.log('🔍 fetchTastedWines: Début de la récupération pour cave:', { caveId, caveMode });
      
      // Requête pour récupérer les vins dégustés
      let query = supabase
        .from('wine_history')
        .select(`
          id,
          wine_id,
          event_date,
          rating,
          notes,
          event_type,
          previous_amount,
          new_amount,
          wine: wine_id (
            id,
            name,
            year,
            wine_type,
            region,
            producer (name)
          )
        `)
        .eq('event_type', 'stock_change')
        .order('event_date', { ascending: false });

      // Filtrer selon le mode actif
      if (effectiveCaveMode === 'user') {
        query = query.eq('user_id', effectiveCaveId);
      } else {
        query = query.eq('household_id', caveId);
      }

      const { data: historyData, error: historyError } = await query;

      console.log('🔍 fetchTastedWines: Données récupérées:', { 
        count: historyData?.length || 0, 
        eventTypes: historyData?.map(h => h.event_type) || [],
        sample: historyData?.slice(0, 3) || []
      });

      if (historyError) throw historyError;

      if (!historyData || historyData.length === 0) {
        setTastedWines([]);
        return;
      }

      // Récupérer les détails des vins
      const wineIds = historyData.map(entry => entry.wine_id);
      const { data: winesData, error: winesError } = await supabase
        .from('wine')
        .select(`
          id,
          name,
          year,
          wine_type,
          image_uri,
          producer (
            name
          )
        `)
        .in('id', wineIds);

      if (winesError) {
        console.warn('Erreur lors de la récupération des vins:', winesError);
      }

      // Créer un map des vins par id
      const winesMap = new Map();
      if (winesData) {
        winesData.forEach(wine => {
          winesMap.set(wine.id, wine);
        });
      }

      // Récupérer les favoris depuis user_wine
      let userWinesQuery = supabase
        .from('user_wine')
        .select('wine_id, favorite')
        .in('wine_id', wineIds);

      // Filtrer selon le mode actif
      if (effectiveCaveMode === 'user') {
        userWinesQuery = userWinesQuery.eq('user_id', effectiveCaveId);
      } else {
        userWinesQuery = userWinesQuery.eq('household_id', caveId);
      }

      const { data: userWinesData, error: userWinesError } = await userWinesQuery;

      if (userWinesError) {
        console.warn('Erreur lors de la récupération des favoris:', userWinesError);
      }

      // Créer un map des favoris par wine_id
      const favoritesMap = new Map();
      if (userWinesData) {
        userWinesData.forEach(uw => {
          favoritesMap.set(uw.wine_id, uw.favorite);
        });
      }

      // Combiner les données d'historique avec les détails des vins
      const combinedData = historyData.map(entry => ({
        ...entry,
        wine: winesMap.get(entry.wine_id)
      }));

      // logs réduits

      if (!combinedData || combinedData.length === 0) {
        setTastedWines([]);
        return;
      }

      // Filtrer les entrées sans vin (orphelins)
      const cleaned = combinedData.filter(entry => entry.wine);
      // logs réduits

      const grouped = groupTastingsByWine(cleaned, favoritesMap);
      // Debug: résumé par couleur pour les dégustés
      try {
        const summary = grouped.reduce((acc: any, g: any) => {
          const color = g?.wine?.wine_type || 'unknown';
          acc[color] = (acc[color] || 0) + (g?.tastings?.length || 0);
          return acc;
        }, {} as Record<string, number>);
        const details = grouped.map((g: any) => ({ id: g?.wine?.id, name: g?.wine?.name, color: g?.wine?.wine_type, tastings: g?.tastings?.length }));
        console.log('🍷 Debug dégustés (grouped) summary:', summary);
        console.log('🍷 Debug dégustés (grouped) details:', details);
      } catch (_) {}

      setTastedWines(grouped);
    } catch (error) {
      console.error('Erreur lors de la récupération des vins dégustés:', error);
    } finally {
      setLoading(false);
      isFetchingTastedRef.current = false;
    }
  };

        // Fonction pour regrouper les dégustations par vin
      const groupTastingsByWine = (entries: any[], favoritesMap: Map<string, boolean>) => {
        const map = new Map();

        for (const entry of entries) {
          if (!entry.wine) continue; // sécurité

          const wineId = entry.wine.id;
          const isDecrease = entry.event_type === 'stock_change' && Number(entry.previous_amount) > Number(entry.new_amount);
          // Ne créer/compter le groupe que s'il y a bien une baisse de stock
          if (!isDecrease) {
            continue;
          }

          if (!map.has(wineId)) {
            map.set(wineId, {
              wine: { ...entry.wine, origin: 'tasted' },
              tastings: [],
              lastTastedAt: entry.event_date,
              tastingCount: 0,
              favorite: favoritesMap.get(wineId) || false
            });
          }

          const group = map.get(wineId);
          group.tastings.push({
            id: entry.id,
            date: entry.event_date,
            note: entry.notes,
            rating: entry.rating,
            eventType: 'stock_change',
            previousAmount: entry.previous_amount,
            newAmount: entry.new_amount
          });
          group.tastingCount += 1;

          // mettre à jour la date la plus récente (sur un événement valide)
          if (new Date(entry.event_date) > new Date(group.lastTastedAt)) {
            group.lastTastedAt = entry.event_date;
          }
        }

        return Array.from(map.values());
      };

  // Ajouter une dégustation
  const addTasting = async (wineId: string, rating?: number) => {
    if (!targetUserId || !effectiveCaveId) return;
    
    try {
      // 1. Décrémenter le stock dans user_wine
      let wineQuery = supabase
        .from('user_wine')
        .select('amount')
        .eq('wine_id', wineId);

      // Filtrer selon le mode actif
      if (effectiveCaveMode === 'user') {
        wineQuery = wineQuery.eq('user_id', effectiveCaveId);
      } else {
        wineQuery = wineQuery.eq('household_id', caveId);
      }

      const { data: wineData, error: wineError } = await wineQuery.limit(1).single();

      if (wineError) throw wineError;

      // Pas besoin de vérifier le stock ici, on décrémente simplement

      const newAmount = wineData.amount - 1;

      // Créer un événement stock_change dans l'historique (avec la note étoilée)
      const stockChangeData: any = {
        wine_id: wineId,
        event_type: 'stock_change',
        event_date: new Date().toISOString(),
        previous_amount: wineData.amount,
        new_amount: newAmount,
        rating: typeof rating === 'number' ? rating : null,
        notes: null,
      };

      // Utiliser le bon champ selon le mode
      if (effectiveCaveMode === 'user') {
        stockChangeData.user_id = effectiveCaveId;
      } else {
        stockChangeData.household_id = caveId;
      }

      const { error: stockChangeError } = await supabase
        .from('wine_history')
        .insert(stockChangeData);

      if (stockChangeError) throw stockChangeError;

      if (newAmount === 0) {
        // Si stock = 0, supprimer de user_wine
        let deleteQuery = supabase
          .from('user_wine')
          .delete()
          .eq('wine_id', wineId);

        // Filtrer selon le mode actif
        if (effectiveCaveMode === 'user') {
          deleteQuery = deleteQuery.eq('user_id', effectiveCaveId);
        } else {
          deleteQuery = deleteQuery.eq('household_id', caveId);
        }

        const { error: deleteError } = await deleteQuery;

        if (deleteError) throw deleteError;
      } else {
        // Sinon, mettre à jour le stock
        let updateQuery = supabase
          .from('user_wine')
          .update({ amount: newAmount })
          .eq('wine_id', wineId);

        // Filtrer selon le mode actif
        if (effectiveCaveMode === 'user') {
          updateQuery = updateQuery.eq('user_id', effectiveCaveId);
        } else {
          updateQuery = updateQuery.eq('household_id', caveId);
        }

        const { error: updateError } = await updateQuery;

        if (updateError) throw updateError;
      }

      // 2. Rafraîchir les données
      await fetchHistory();
      await fetchTastedWines();

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la dégustation:', error);
      return { success: false, error };
    }
  };

  // Réajouter un vin à la cave
  const reAddToCellar = async (wineId: string) => {
    if (!targetUserId || !effectiveCaveId) return;
    
    try {
      // Vérifier si le vin existe déjà dans la cave
      let existingQuery = supabase
        .from('user_wine')
        .select('amount')
        .eq('wine_id', wineId);

      // Filtrer selon le mode actif
      if (effectiveCaveMode === 'user') {
        existingQuery = existingQuery.eq('user_id', effectiveCaveId);
      } else {
        existingQuery = existingQuery.eq('household_id', caveId);
      }

      const { data: existingWine } = await existingQuery.limit(1).single();

      if (existingWine) {
        // Incrémenter le stock existant
        let updateQuery = supabase
          .from('user_wine')
          .update({ amount: existingWine.amount + 1 })
          .eq('wine_id', wineId);

        // Filtrer selon le mode actif
        if (effectiveCaveMode === 'user') {
          updateQuery = updateQuery.eq('user_id', effectiveCaveId);
        } else {
          updateQuery = updateQuery.eq('household_id', caveId);
        }

        const { error } = await updateQuery;

        if (error) throw error;
      } else {
        // Créer une nouvelle entrée
        const wineData: any = {
          wine_id: wineId,
          amount: 1,
          origin: 'cellar'
        };

        // Utiliser le bon champ selon le mode
        if (effectiveCaveMode === 'user') {
          wineData.user_id = effectiveCaveId;
        } else {
          wineData.household_id = caveId;
        }

        const { error } = await supabase
          .from('user_wine')
          .insert(wineData);

        if (error) throw error;
      }

      // Rafraîchir les données
      await fetchTastedWines();

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de l\'ajout à la cave:', error);
      return { success: false, error };
    }
  };

  // Récupérer l'historique complet d'un vin
  const getWineHistory = (wineId: string): WineHistoryEntry[] => {
    return history.filter(entry => entry.wine_id === wineId);
  };

  // Récupérer les dégustations récentes
  const getRecentTastings = (limit: number = 20) => {
    return history
      .filter(entry => entry.notes) // Seulement les dégustations avec notes
      .slice(0, limit)
      .map(entry => ({
        wineId: entry.wine_id,
        eventDate: entry.created_at,
        eventType: 'tasted' as const,
        rating: 0, // À adapter selon votre structure
        previousAmount: 1 // À adapter selon votre structure
      }));
  };

  useEffect(() => {
    if (targetUserId && effectiveCaveId) {
      // Délaisser un micro délai pour laisser retomber les re-render en cascade
      const t = setTimeout(() => {
        fetchHistory();
        fetchTastedWines();
      }, 100);
      return () => clearTimeout(t);
    }
  }, [targetUserId, effectiveCaveId, effectiveCaveMode]);

  return {
    history,
    tastedWines,
    loading,
    addTasting,
    reAddToCellar,
    getWineHistory,
    getRecentTastings,
    fetchHistory,
    fetchTastedWines
  };
} 