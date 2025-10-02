import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { WineMemory } from '../types/memory';

interface UseWineMemoryResult {
  hasMemory: boolean;
  memory?: WineMemory;
  loading: boolean;
}

export function useWineMemory(wineId: string | null): UseWineMemoryResult {
  const [hasMemory, setHasMemory] = useState(false);
  const [memory, setMemory] = useState<WineMemory | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchMemory = async () => {
      try {
        setLoading(true);

        if (!wineId) {
          if (!cancelled) {
            setHasMemory(false);
            setMemory(undefined);
          }
          return;
        }

        const { data: auth } = await supabase.auth.getUser();
        const userId = auth?.user?.id;
        if (!userId) {
          if (!cancelled) {
            setHasMemory(false);
            setMemory(undefined);
          }
          return;
        }

        // Récupérer le dernier souvenir de l'utilisateur pour ce vin
        const { data: memories, error } = await supabase
          .from('wine_memories')
          .select('id, wine_id, user_id, text, photo_urls, friends_tagged, location_text, created_at, updated_at')
          .eq('wine_id', wineId)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Erreur récupération souvenir:', error);
          if (!cancelled) {
            setHasMemory(false);
            setMemory(undefined);
          }
          return;
        }

        const first = memories && memories.length > 0 ? memories[0] : undefined;
        if (!first) {
          if (!cancelled) {
            setHasMemory(false);
            setMemory(undefined);
          }
          return;
        }

        // Si amis tagués, récupérer les infos du premier ami pour l'affichage
        let tagged_friends: any[] = [];
        if (Array.isArray(first.friends_tagged) && first.friends_tagged.length > 0) {
          const firstFriendId = first.friends_tagged[0];
          const { data: friend } = await supabase
            .from('User')
            .select('id, first_name, avatar')
            .eq('id', firstFriendId)
            .single();
          if (friend) {
            tagged_friends = [friend];
          }
        }

        if (!cancelled) {
          setHasMemory(true);
          setMemory({ ...(first as WineMemory), tagged_friends });
        }
      } catch (e) {
        console.error('Erreur useWineMemory:', e);
        if (!cancelled) {
          setHasMemory(false);
          setMemory(undefined);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchMemory();
    return () => {
      cancelled = true;
    };
  }, [wineId]);

  return { hasMemory, memory, loading };
}


