import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface ProfileStats {
  tastedCount: number;
  favoritesCount: number;
  wishlistCount: number;
  visitsCount: number;
}

export const useProfileStats = (userId?: string) => {
  const [stats, setStats] = useState<ProfileStats>({
    tastedCount: 0,
    favoritesCount: 0,
    wishlistCount: 0,
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

      // 1. Récupérer les vins de l'utilisateur pour calculer les stats
      const { data: userWines, error: winesError } = await supabase
        .from('user_wine')
        .select('liked, origin, amount')
        .eq('user_id', userId);

      if (winesError) throw winesError;

      // 2. Récupérer l'historique des dégustations
      const { data: historyData, error: historyError } = await supabase
        .from('wine_history')
        .select('event_type')
        .eq('user_id', userId)
        .eq('event_type', 'tasted');

      if (historyError) throw historyError;

      // 3. Calculer les statistiques
      
      // Dégustés : nombre de vins retirés pour dégustations (amount = 0)
      const tastedCount = userWines?.filter(wine => wine.amount === 0).length || 0;
      
      // Likes : nombre de vins likés dans ma cave et ma liste d'envie
      const favoritesCount = userWines?.filter(wine => wine.liked === true).length || 0;
      
      // Étoiles : nombre de vins dans ma liste d'envie
      const wishlistCount = userWines?.filter(wine => wine.origin === 'wishlist').length || 0;
      
      // Visites : pour l'instant 0, en attendant la création d'une table de visites
      const visitsCount = 0;

      console.log('📊 Stats calculées:', {
        tastedCount,
        favoritesCount,
        wishlistCount,
        visitsCount,
        totalWines: userWines?.length || 0
      });

      setStats({
        tastedCount,
        favoritesCount,
        wishlistCount,
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