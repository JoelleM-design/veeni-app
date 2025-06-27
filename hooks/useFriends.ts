import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types/user';

export const useFriends = (friendIds: string[]) => {
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFriends = async () => {
    if (friendIds.length === 0) {
      setFriends([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('User')
        .select('*')
        .in('id', friendIds);

      if (fetchError) throw fetchError;

      const friendsData = data?.map(user => ({
        id: user.id,
        name: user.name,
        first_name: user.first_name,
        email: user.email,
        avatar: user.avatar,
        friends: user.friends || [],
        online: user.online || false,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      })) || [];

      setFriends(friendsData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors du chargement des amis'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, [friendIds.join(',')]);

  return {
    friends,
    loading,
    error,
    refetch: fetchFriends,
  };
}; 