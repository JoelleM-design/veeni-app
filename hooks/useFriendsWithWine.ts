import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from './useUser';

export interface FriendWithWine {
  id: string;
  firstName: string;
  avatar?: string;
}

export const useFriendsWithWine = (wineId: string) => {
  const { user } = useUser();
  const [friendsWithWine, setFriendsWithWine] = useState<FriendWithWine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFriendsWithWine = async () => {
    if (!user || !wineId) return;

    try {
      setLoading(true);
      setError(null);

      // 1. Récupérer les IDs des amis de l'utilisateur
      const { data: friendsData, error: friendsError } = await supabase
        .from('friend')
        .select('friend_id')
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      if (friendsError) {
        console.error('Erreur lors de la récupération des amis:', friendsError);
        return;
      }

      const friendIds = friendsData?.map(f => f.friend_id) || [];
      if (friendIds.length === 0) {
        setFriendsWithWine([]);
        return;
      }

      // 2. Récupérer les vins de ces amis qui correspondent au wineId
      const { data: userWinesData, error: winesError } = await supabase
        .from('user_wine')
        .select(`
          user_id,
          User!user_id (
            id,
            first_name,
            avatar
          )
        `)
        .in('user_id', friendIds)
        .eq('wine_id', wineId)
        .gt('amount', 0); // Seulement les vins en stock

      if (winesError) {
        console.error('Erreur lors de la récupération des vins des amis:', winesError);
        return;
      }

      // 3. Transformer les données
      const friends: FriendWithWine[] = (userWinesData || [])
        .filter(item => item.User && typeof item.User === 'object')
        .map(item => ({
          id: String((item.User as any)?.id || ''),
          firstName: String((item.User as any)?.first_name || 'Ami'),
          avatar: (item.User as any)?.avatar || undefined,
        }));

      setFriendsWithWine(friends);
    } catch (err) {
      console.error('Erreur lors de la récupération des amis avec ce vin:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriendsWithWine();
  }, [user, wineId]);

  return {
    friendsWithWine,
    loading,
    error,
    refresh: fetchFriendsWithWine,
  };
}; 