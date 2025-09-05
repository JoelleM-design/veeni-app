import useSWR from 'swr';
import { supabase } from '../lib/supabase';

const STATS_KEY = 'user_wine_stats';

const fetchStats = async () => {
  console.log('🔄 useStats: Appel de la fonction RPC get_user_wine_stats');
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
  const { data, error, mutate } = useSWR(STATS_KEY, fetchStats);

  return {
    stats: data,
    isLoading: !data && !error,
    error,
    refreshStats: () => mutate(),
  };
}; 