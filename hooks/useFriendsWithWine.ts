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

      // 1. Récupérer les IDs des amis (bidirectionnel)
      const [friendsFromUser, friendsToUser] = await Promise.all([
        supabase
          .from('friend')
          .select('friend_id')
          .eq('user_id', user.id)
          .eq('status', 'accepted'),
        supabase
          .from('friend')
          .select('user_id')
          .eq('friend_id', user.id)
          .eq('status', 'accepted')
      ]);

      if (friendsFromUser.error) {
        console.error('Erreur lors de la récupération des amis (from):', friendsFromUser.error);
        return;
      }
      if (friendsToUser.error) {
        console.error('Erreur lors de la récupération des amis (to):', friendsToUser.error);
        return;
      }

      const friendIds = Array.from(new Set([
        ...((friendsFromUser.data || []).map((r: any) => r.friend_id)),
        ...((friendsToUser.data || []).map((r: any) => r.user_id)),
      ]));
      if (friendIds.length === 0) {
        setFriendsWithWine([]);
        return;
      }

      // 2. Récupérer les entrées user_wine des amis pour ce vin (cave OU wishlist)
      const { data: userWinesRows, error: winesError } = await supabase
        .from('user_wine')
        .select('user_id, origin')
        .in('user_id', friendIds)
        .eq('wine_id', wineId)
        .or('origin.eq.cellar,origin.eq.wishlist,origin.is.null');

      if (winesError) {
        console.error('Erreur lors de la récupération des vins des amis:', winesError);
        return;
      }

      const holderIds = Array.from(new Set((userWinesRows || []).map(r => String(r.user_id))));
      if (holderIds.length === 0) {
        setFriendsWithWine([]);
        return;
      }

      // 3. Récupérer les profils des amis détenteurs dans la table User
      const { data: usersData, error: usersError } = await supabase
        .from('User')
        .select('id, first_name, avatar')
        .in('id', holderIds);

      if (usersError) {
        console.error('Erreur lors de la récupération des profils amis:', usersError);
        setFriendsWithWine([]);
        return;
      }

      const friends: FriendWithWine[] = (usersData || []).map(u => ({
        id: String(u.id),
        firstName: String(u.first_name || 'Ami'),
        avatar: u.avatar || undefined,
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