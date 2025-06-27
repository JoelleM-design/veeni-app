import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface WineHistoryEvent {
  id: string;
  wineId: string;
  wineName: string;
  vintage: number;
  color: string;
  region: string;
  producerName: string;
  eventType: 'added' | 'tasted' | 'stock_change' | 'removed' | 'noted' | 'favorited';
  eventDate: string;
  previousAmount?: number;
  newAmount?: number;
  rating?: number;
  notes?: string;
}

export function useWineHistory() {
  const [history, setHistory] = useState<WineHistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      // Récupérer l'historique directement depuis la table wine_history
      const { data, error } = await supabase
        .from('wine_history')
        .select(`
          *,
          wine: wine_id (
            id,
            name,
            year,
            wine_type,
            region,
            producer: producer_id (name)
          )
        `)
        .eq('user_id', user.id)
        .order('event_date', { ascending: false });

      if (error) throw error;

      const transformedHistory: WineHistoryEvent[] = data?.map((item: any) => ({
        id: item.id,
        wineId: item.wine_id,
        wineName: item.wine?.name || 'Vin inconnu',
        vintage: item.wine?.year || 0,
        color: item.wine?.wine_type || 'red',
        region: item.wine?.region || '',
        producerName: item.wine?.producer?.name || '',
        eventType: item.event_type,
        eventDate: item.event_date,
        previousAmount: item.previous_amount,
        newAmount: item.new_amount,
        rating: item.rating
      })) || [];

      setHistory(transformedHistory);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors du chargement de l\'historique'));
    } finally {
      setLoading(false);
    }
  };

  const getTastedWines = () => {
    return history.filter(event => event.eventType === 'tasted');
  };

  const getRecentTastings = (limit = 10) => {
    return getTastedWines()
      .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
      .slice(0, limit);
  };

  const getWineHistory = (wineId: string) => {
    return history.filter(event => event.wineId === wineId);
  };

  const addTastingEvent = async (wineId: string, rating: number, notes?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      // Ajouter l'événement de dégustation
      const { error } = await supabase
        .from('wine_history')
        .insert({
          user_id: user.id,
          wine_id: wineId,
          event_type: 'tasted',
          rating,
          notes
        });

      if (error) throw error;

      // Recharger l'historique
      await fetchHistory();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors de l\'ajout de la dégustation'));
    }
  };

  return {
    history,
    loading,
    error,
    getTastedWines,
    getRecentTastings,
    getWineHistory,
    addTastingEvent,
    refetch: fetchHistory
  };
} 