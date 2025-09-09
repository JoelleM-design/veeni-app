import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface UserStats {
  cellar_count: number;
  favorite_wines_count: number;
  red_wines_count: number;
  rose_wines_count: number;
  shared_wines_count: number;
  shared_wines_with_friends: number;
  sparkling_wines_count: number;
  total_bottles_in_cellar: number;
  total_tasted_wines: number;
  total_wines: number;
  white_wines_count: number;
  wishlist_count: number;
}

export function useUserStats(userId: string | null) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setStats(null);
      setIsLoading(false);
      return;
    }

    const fetchUserStats = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log('🔄 useUserStats: Récupération des stats pour utilisateur:', userId);
        
        const { data, error } = await supabase.rpc('get_user_wine_stats', {
          cave_id: userId,
          cave_mode: 'user'
        });

        if (error) {
          console.error('❌ Erreur récupération stats utilisateur:', error);
          setError(error.message);
        } else if (data && data.length > 0) {
          console.log('✅ Stats utilisateur récupérées:', data[0]);
          setStats(data[0]);
        } else {
          console.log('⚠️ Aucune donnée stats pour utilisateur:', userId);
          setStats(null);
        }
      } catch (err) {
        console.error('❌ Erreur lors de la récupération des stats:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserStats();
  }, [userId]);

  return { stats, isLoading, error };
}
