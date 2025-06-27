import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface ProfileStats {
  tastedCount: number;
  favoritesCount: number;
  visitsCount: number;
}

export const useProfileStats = (userId?: string) => {
  const [stats, setStats] = useState<ProfileStats>({
    tastedCount: 0,
    favoritesCount: 0,
    visitsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Récupérer les statistiques depuis wine_history
      const { data: historyData, error: historyError } = await supabase
        .from('wine_history')
        .select('event_type')
        .eq('user_id', userId);

      if (historyError) throw historyError;

      // Compter les différents types d'événements
      const tastedCount = historyData?.filter(event => event.event_type === 'tasted').length || 0;
      const favoritesCount = historyData?.filter(event => event.event_type === 'favorited').length || 0;
      
      // Pour l'instant, on met 0 pour les visites en attendant la création de la table
      const visitsCount = 0;

      setStats({
        tastedCount,
        favoritesCount,
        visitsCount,
      });
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
      setError(err instanceof Error ? err : new Error('Erreur lors du chargement des statistiques'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [userId]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}; 