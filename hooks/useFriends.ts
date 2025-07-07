import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types/user';

export const useFriends = (friendIds: string[]) => {
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchFriends = async () => {
    if (friendIds.length === 0) {
      setFriends([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('User')
        .select('id, name, first_name, email, avatar')
        .in('id', friendIds);

      if (fetchError) throw fetchError;

      const friendsData = data?.map(user => ({
        id: user.id,
        name: user.name,
        first_name: user.first_name,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      })) || [];

      setFriends(friendsData);
    } catch (err) {
      setError(err as Error);
      setFriends([]);
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