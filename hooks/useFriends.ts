import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types/user';

export const useFriends = (friendIds: string[]) => {
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const lastFriendIds = useRef<string>('');
  const cacheTimeout = useRef<NodeJS.Timeout | null>(null);

  const fetchFriends = async () => {
    if (!friendIds || friendIds.length === 0) {
      setFriends([]);
      return;
    }

    // Éviter de recharger si les IDs n'ont pas changé
    const currentIds = friendIds.sort().join(',');
    if (currentIds === lastFriendIds.current && friends.length > 0) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      lastFriendIds.current = currentIds;

      const { data, error: fetchError } = await supabase
        .from('User')
        .select('id, first_name, email, avatar, created_at')
        .in('id', friendIds);

      if (fetchError) throw fetchError;

      const friendsData = data?.map(user => ({
        id: user.id,
        first_name: user.first_name,
        email: user.email,
        avatar: user.avatar,
        created_at: user.created_at,
      })) || [];

      setFriends(friendsData);

      // Mettre en cache les résultats pendant 60 secondes
      if (cacheTimeout.current) {
        clearTimeout(cacheTimeout.current);
      }
      
      cacheTimeout.current = setTimeout(() => {
        lastFriendIds.current = ''; // Invalider le cache après 60 secondes
      }, 60000);

    } catch (err) {
      setError(err as Error);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
    
    // Nettoyer le timeout au démontage
    return () => {
      if (cacheTimeout.current) {
        clearTimeout(cacheTimeout.current);
      }
    };
  }, [Array.isArray(friendIds) ? friendIds.join(',') : '']);

  return {
    friends,
    loading,
    error,
    refetch: fetchFriends,
  };
}; 