import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types/user';

export const useAllFriends = () => {
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAllFriends = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer l'utilisateur actuel
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        throw new Error('User not authenticated');
      }
      const currentUserId = userData.user.id;

      // Récupérer tous les amis de l'utilisateur
      const { data, error: fetchError } = await supabase
        .from('friend')
        .select('friend_id')
        .eq('user_id', currentUserId)
        .eq('status', 'accepted');

      if (fetchError) {
        throw fetchError;
      }

      // Récupérer les informations des amis
      const friendIds = (data || []).map((item: any) => item.friend_id);
      
      if (friendIds.length === 0) {
        setFriends([]);
        return;
      }

      const { data: friendsData, error: friendsError } = await supabase
        .from('User')
        .select('id, first_name, avatar')
        .in('id', friendIds);

      if (friendsError) {
        throw friendsError;
      }

      const friendsList = friendsData || [];

      setFriends(friendsList);
    } catch (err) {
      console.error('Error fetching all friends:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred while fetching friends.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllFriends();
  }, []);

  return { friends, loading, error, refreshFriends: fetchAllFriends };
};
