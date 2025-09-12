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

      // 2. Récupérer les entrées user_wine des amis pour ce vin (stock > 0)
      const { data: userWinesRows, error: winesError } = await supabase
        .from('user_wine')
        .select('user_id')
        .in('user_id', friendIds)
        .eq('wine_id', wineId)
        .gt('amount', 0);

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