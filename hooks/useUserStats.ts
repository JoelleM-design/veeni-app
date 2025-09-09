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
        
        // Récupérer les vins de l'utilisateur
        const { data: userWines, error: winesError } = await supabase
          .from('user_wine')
          .select(`
            id,
            origin,
            favorite,
            amount,
            wine_id,
            wine (
              id,
              wine_type
            )
          `)
          .eq('user_id', userId);

        if (winesError) {
          console.error('❌ Erreur récupération vins utilisateur:', winesError);
          setError(winesError.message);
          return;
        }

        // Récupérer les dégustations
        const { data: tastedWines, error: tastedError } = await supabase
          .from('wine_history')
          .select('wine_id')
          .eq('user_id', userId);

        if (tastedError) {
          console.error('❌ Erreur récupération dégustations:', tastedError);
          setError(tastedError.message);
          return;
        }

        // Calculer les statistiques
        const wines = userWines || [];
        const cellarWines = wines.filter(w => w.origin === 'cellar');
        const wishlistWines = wines.filter(w => w.origin === 'wishlist');
        const favoriteWines = wines.filter(w => w.favorite === true);
        
        const redWines = cellarWines.filter(w => w.wine?.wine_type === 'red');
        const whiteWines = cellarWines.filter(w => w.wine?.wine_type === 'white');
        const roseWines = cellarWines.filter(w => w.wine?.wine_type === 'rose');
        const sparklingWines = cellarWines.filter(w => w.wine?.wine_type === 'sparkling');

        const totalBottles = cellarWines.reduce((sum, w) => sum + (w.amount || 0), 0);
        const redBottles = redWines.reduce((sum, w) => sum + (w.amount || 0), 0);
        const whiteBottles = whiteWines.reduce((sum, w) => sum + (w.amount || 0), 0);
        const roseBottles = roseWines.reduce((sum, w) => sum + (w.amount || 0), 0);
        const sparklingBottles = sparklingWines.reduce((sum, w) => sum + (w.amount || 0), 0);

        const uniqueTastedWines = new Set(tastedWines?.map(t => t.wine_id) || []).size;

        const stats: UserStats = {
          total_wines: wines.length,
          cellar_count: cellarWines.length,
          wishlist_count: wishlistWines.length,
          favorite_wines_count: favoriteWines.length,
          total_bottles_in_cellar: totalBottles,
          red_wines_count: redBottles,
          white_wines_count: whiteBottles,
          rose_wines_count: roseBottles,
          sparkling_wines_count: sparklingBottles,
          total_tasted_wines: uniqueTastedWines,
          shared_wines_count: 0,
          shared_wines_with_friends: 0
        };

        console.log('✅ Stats utilisateur calculées:', stats);
        setStats(stats);

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
