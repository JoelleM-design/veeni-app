import useSWR from 'swr';
import { supabase } from '../lib/supabase';
import { useActiveCave } from './useActiveCave';

const fetchStats = async (caveId: string, caveMode: 'user' | 'household') => {
  console.log('🔄 useStats: Appel de la fonction RPC get_user_wine_stats', { caveId, caveMode });
  const { data, error } = await supabase.rpc('get_user_wine_stats');
  if (error) {
    console.error('❌ useStats: Erreur RPC:', error);
    throw error;
  }
  console.log('✅ useStats: Données reçues:', data);
  // La fonction RPC retourne un tableau avec une seule ligne, on prend le premier élément
  return Array.isArray(data) && data.length > 0 ? data[0] : data;
};

export const useStats = () => {
  const { caveId, caveMode } = useActiveCave();
  
  const STATS_KEY = `user_wine_stats_${caveMode}_${caveId}`;
  
  const { data, error, mutate } = useSWR(
    caveId ? [STATS_KEY, caveId, caveMode] : null,
    ([, caveId, caveMode]) => fetchStats(caveId, caveMode)
  );

  // Optimistic local updater: permettre aux écrans d’appliquer un delta immédiat
  const applyLocalDelta = (delta: Partial<{ total_bottles_in_cellar: number; red_wines_count: number; white_wines_count: number; rose_wines_count: number; sparkling_wines_count: number }>) => {
    mutate((current: any) => {
      if (!current) return current;
      const next = { ...current } as any;
      for (const [k, v] of Object.entries(delta)) {
        const key = k as keyof typeof delta;
        if (typeof v === 'number') {
          next[key] = Math.max(0, (Number(next[key]) || 0) + v);
        }
      }
      return next;
    }, false);
  };

  return {
    stats: data,
    isLoading: !data && !error,
    error,
    refreshStats: () => mutate(),
    applyLocalDelta,
  };
}; 