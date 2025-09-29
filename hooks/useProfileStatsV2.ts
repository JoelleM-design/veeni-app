import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface ProfileStatsV2 {
  // Métriques principales selon les spécifications
  tasted: number;           // Nombre d'events wine_history.event_type = 'tasted'
  favorites: number;        // Nombre de user_wine.favorite = true
  memories: number;         // Nombre de souvenirs créés par l'utilisateur
  inspired: number;         // Vins ajoutés en wishlist par d'autres avec origin_user_id = moi
  
  // Métriques additionnelles
  cellar: number;           // Nombre de vins en cave
  wishlist: number;         // Nombre de vins en wishlist
  totalBottles: number;     // Nombre total de bouteilles en cave
}

export function useProfileStatsV2(userId: string | null) {
  const [stats, setStats] = useState<ProfileStatsV2>({
    tasted: 0,
    favorites: 0,
    memories: 0,
    inspired: 0,
    cellar: 0,
    wishlist: 0,
    totalBottles: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setStats({
        tasted: 0,
        favorites: 0,
        memories: 0,
        inspired: 0,
        cellar: 0,
        wishlist: 0,
        totalBottles: 0
      });
      return;
    }

    const calculateStats = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Dégustés = nombre d'events wine_history.event_type = 'tasted'
        const { data: tastedData, error: tastedError } = await supabase
          .from('wine_history')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)
          .eq('event_type', 'tasted');

        if (tastedError) throw tastedError;

        // 2. Favoris = nombre de user_wine.favorite = true
        const { data: favoritesData, error: favoritesError } = await supabase
          .from('user_wine')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)
          .eq('favorite', true);

        if (favoritesError) throw favoritesError;

        // 3. Récupérer les amis
        const { data: friendships, error: friendsError } = await supabase
          .from('friendship')
          .select('friend_id')
          .eq('user_id', userId)
          .eq('status', 'accepted');

        if (friendsError) throw friendsError;

        const friendIds = friendships?.map(f => f.friend_id) || [];

        // 4. Souvenirs = compter les souvenirs créés par l'utilisateur OU où il est mentionné
        const { data: allMemoriesData, error: memoriesError } = await supabase
          .from('wine_memories')
          .select('id, user_id, friends_tagged');

        if (memoriesError) throw memoriesError;

        // Filtrer pour compter :
        // 1. Souvenirs créés par l'utilisateur
        // 2. Souvenirs où l'utilisateur est mentionné dans friends_tagged
        const userMemories = allMemoriesData?.filter(memory => {
          // Créateur du souvenir
          if (memory.user_id === userId) return true;
          
          // Mentionné dans friends_tagged
          if (memory.friends_tagged && Array.isArray(memory.friends_tagged)) {
            return memory.friends_tagged.includes(userId);
          }
          
          return false;
        }) || [];
        
        const memoriesCount = userMemories.length;

        // 5. Inspirés = vins ajoutés en wishlist par d'autres avec source_user_id = moi
        const { data: inspiredData, error: inspiredError } = await supabase
          .from('user_wine')
          .select('id', { count: 'exact' })
          .eq('source_user_id', userId)
          .eq('origin', 'wishlist');

        if (inspiredError) throw inspiredError;

        // 6. Métriques additionnelles
        const { data: cellarData, error: cellarError } = await supabase
          .from('user_wine')
          .select('id, amount', { count: 'exact' })
          .eq('user_id', userId)
          .eq('origin', 'cellar');

        if (cellarError) throw cellarError;

        const { data: wishlistData, error: wishlistError } = await supabase
          .from('user_wine')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)
          .eq('origin', 'wishlist');

        if (wishlistError) throw wishlistError;

        // Calculer le total de bouteilles
        const totalBottles = cellarData?.reduce((sum, wine) => sum + (wine.amount || 0), 0) || 0;

        setStats({
          tasted: tastedData?.length || 0,
          favorites: favoritesData?.length || 0,
          memories: memoriesCount || 0,
          inspired: inspiredData?.length || 0,
          cellar: cellarData?.length || 0,
          wishlist: wishlistData?.length || 0,
          totalBottles
        });

      } catch (err) {
        console.error('Erreur lors du calcul des statistiques:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    calculateStats();
  }, [userId]);

  return {
    stats,
    loading,
    error,
    refetch: () => {
      if (userId) {
        setStats({
          tasted: 0,
          favorites: 0,
          memories: 0,
          inspired: 0,
          cellar: 0,
          wishlist: 0,
          totalBottles: 0
        });
        // Le useEffect se déclenchera automatiquement
      }
    }
  };
}

