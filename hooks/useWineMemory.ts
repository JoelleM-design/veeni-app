import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { WineMemory } from '../types/memory';

interface UseWineMemoryResult {
  hasMemory: boolean;
  memory?: WineMemory & { tagged_friends?: Array<{ id: string; first_name?: string; avatar?: string }> };
  count: number;
  loading: boolean;
}

export function useWineMemory(wineId: string | null): UseWineMemoryResult {
  const [hasMemory, setHasMemory] = useState(false);
  const [memory, setMemory] = useState<WineMemory | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);

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

        // Récupérer le dernier souvenir de l'utilisateur pour ce vin + compter
        const listQuery = supabase
          .from('wine_memories')
          .select('id, wine_id, user_id, text, photo_urls, friends_tagged, location_text, created_at, updated_at')
          .eq('wine_id', wineId)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1);
        const countQuery = supabase
          .from('wine_memories')
          .select('*', { count: 'exact', head: true })
          .eq('wine_id', wineId)
          .eq('user_id', userId);

        const [{ data: memories, error }, { count: totalCount, error: countError }] = await Promise.all([
          listQuery,
          countQuery
        ]);

        if (error) {
          console.error('Erreur récupération souvenir:', error);
          if (!cancelled) {
            setHasMemory(false);
            setMemory(undefined);
          }
          return;
        }
        if (countError) {
          console.error('Erreur comptage souvenirs:', countError);
        }

        const first = memories && memories.length > 0 ? memories[0] : undefined;
        if (!first) {
          if (!cancelled) {
            setHasMemory(false);
            setMemory(undefined);
            setCount(totalCount || 0);
          }
          return;
        }

        // Si amis tagués, récupérer les infos du premier ami pour l'affichage
        let tagged_friends: any[] = [];
        if (Array.isArray(first.friends_tagged) && first.friends_tagged.length > 0) {
          const { data: friendsData } = await supabase
            .from('User')
            .select('id, first_name, avatar')
            .in('id', first.friends_tagged as string[]);
          tagged_friends = friendsData || [];
        }

        if (!cancelled) {
          setHasMemory(true);
          setMemory({ ...(first as WineMemory), tagged_friends });
          setCount(totalCount || 0);
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

  return { hasMemory, memory, count, loading };
}


