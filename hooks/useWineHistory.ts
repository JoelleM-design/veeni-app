import { useEffect, useState } from 'react';
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

export function useWineHistory() {
  const { user } = useUser();
  const { caveId, caveMode, isShared } = useActiveCave();
  const [history, setHistory] = useState<WineHistoryEntry[]>([]);
  const [tastedWines, setTastedWines] = useState<TastedWine[]>([]);
  const [loading, setLoading] = useState(false);

  // Récupérer l'historique des dégustations
  const fetchHistory = async () => {
    if (!user?.id || !caveId) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('wine_history')
        .select('*')
        .order('created_at', { ascending: false });

      // Filtrer selon le mode actif
      if (caveMode === 'user') {
        query = query.eq('user_id', caveId);
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
    }
  };

  // Récupérer les vins dégustés (groupés par vin)
  const fetchTastedWines = async () => {
    if (!user?.id || !caveId) return;
    
    setLoading(true);
    try {
      console.log('🔍 fetchTastedWines: Début de la récupération pour cave:', { caveId, caveMode });
      
      // Requête pour récupérer les vins dégustés
      let query = supabase
        .from('wine_history')
        .select(`
          id,
          wine_id,
          event_date,
          rating,
          notes
        `)
        .eq('event_type', 'tasted')
        .order('event_date', { ascending: false });

      // Filtrer selon le mode actif
      if (caveMode === 'user') {
        query = query.eq('user_id', caveId);
      } else {
        query = query.eq('household_id', caveId);
      }

      const { data: historyData, error: historyError } = await query;

      console.log('📊 fetchTastedWines: Données récupérées:', {
        count: historyData?.length || 0,
        data: historyData?.slice(0, 2), // Afficher les 2 premiers
        error: historyError
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
      if (caveMode === 'user') {
        userWinesQuery = userWinesQuery.eq('user_id', caveId);
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

      console.log('🔗 fetchTastedWines: Données combinées:', {
        count: combinedData?.length || 0,
        data: combinedData?.slice(0, 2) // Afficher les 2 premiers
      });

      if (!combinedData || combinedData.length === 0) {
        setTastedWines([]);
        return;
      }

      // Filtrer les entrées sans vin (orphelins)
      const cleaned = combinedData.filter(entry => entry.wine);
      console.log('🧹 fetchTastedWines: Données nettoyées:', {
        count: cleaned?.length || 0,
        data: cleaned?.slice(0, 2) // Afficher les 2 premiers
      });

      const grouped = groupTastingsByWine(cleaned, favoritesMap);
      console.log('📋 fetchTastedWines: Données groupées:', {
        count: grouped?.length || 0,
        data: grouped?.slice(0, 2) // Afficher les 2 premiers
      });
      
      setTastedWines(grouped);
    } catch (error) {
      console.error('Erreur lors de la récupération des vins dégustés:', error);
    } finally {
      setLoading(false);
    }
  };

        // Fonction pour regrouper les dégustations par vin
      const groupTastingsByWine = (entries: any[], favoritesMap: Map<string, boolean>) => {
        const map = new Map();

        for (const entry of entries) {
          if (!entry.wine) continue; // sécurité

          const wineId = entry.wine.id;
          if (!map.has(wineId)) {
            map.set(wineId, {
              wine: entry.wine,
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
      });

      group.tastingCount += 1;

      // mettre à jour la date la plus récente
      if (new Date(entry.event_date) > new Date(group.lastTastedAt)) {
        group.lastTastedAt = entry.event_date;
      }
    }

    return Array.from(map.values());
  };

  // Ajouter une dégustation
  const addTasting = async (wineId: string, note?: string) => {
    if (!user?.id || !caveId) return;
    
    try {
      // 1. Ajouter l'entrée dans wine_history
      const historyData: any = {
        wine_id: wineId,
        event_type: 'tasted',
        event_date: new Date().toISOString(),
        notes: note || null
      };

      // Utiliser le bon champ selon le mode
      if (caveMode === 'user') {
        historyData.user_id = caveId;
      } else {
        historyData.household_id = caveId;
      }

      const { data: historyEntry, error: historyError } = await supabase
        .from('wine_history')
        .insert(historyData)
        .select()
        .single();

      if (historyError) throw historyError;

      // 2. Décrémenter le stock dans user_wine
      let wineQuery = supabase
        .from('user_wine')
        .select('amount')
        .eq('wine_id', wineId);

      // Filtrer selon le mode actif
      if (caveMode === 'user') {
        wineQuery = wineQuery.eq('user_id', caveId);
      } else {
        wineQuery = wineQuery.eq('household_id', caveId);
      }

      const { data: wineData, error: wineError } = await wineQuery.single();

      if (wineError) throw wineError;

      const newAmount = wineData.amount - 1;

      if (newAmount === 0) {
        // Si stock = 0, supprimer de user_wine
        let deleteQuery = supabase
          .from('user_wine')
          .delete()
          .eq('wine_id', wineId);

        // Filtrer selon le mode actif
        if (caveMode === 'user') {
          deleteQuery = deleteQuery.eq('user_id', caveId);
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
        if (caveMode === 'user') {
          updateQuery = updateQuery.eq('user_id', caveId);
        } else {
          updateQuery = updateQuery.eq('household_id', caveId);
        }

        const { error: updateError } = await updateQuery;

        if (updateError) throw updateError;
      }

      // 3. Rafraîchir les données
      await fetchHistory();
      await fetchTastedWines();

      return { success: true, historyEntry };
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la dégustation:', error);
      return { success: false, error };
    }
  };

  // Réajouter un vin à la cave
  const reAddToCellar = async (wineId: string) => {
    if (!user?.id || !caveId) return;
    
    try {
      // Vérifier si le vin existe déjà dans la cave
      let existingQuery = supabase
        .from('user_wine')
        .select('amount')
        .eq('wine_id', wineId);

      // Filtrer selon le mode actif
      if (caveMode === 'user') {
        existingQuery = existingQuery.eq('user_id', caveId);
      } else {
        existingQuery = existingQuery.eq('household_id', caveId);
      }

      const { data: existingWine } = await existingQuery.single();

      if (existingWine) {
        // Incrémenter le stock existant
        let updateQuery = supabase
          .from('user_wine')
          .update({ amount: existingWine.amount + 1 })
          .eq('wine_id', wineId);

        // Filtrer selon le mode actif
        if (caveMode === 'user') {
          updateQuery = updateQuery.eq('user_id', caveId);
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
        if (caveMode === 'user') {
          wineData.user_id = caveId;
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
    if (user?.id && caveId) {
      fetchHistory();
      fetchTastedWines();
    }
  }, [user?.id, caveId, caveMode]);

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