import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useWineHasMemories(wineId: string | null) {
  const [hasMemories, setHasMemories] = useState(false);
  const [memoriesCount, setMemoriesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wineId) {
      setHasMemories(false);
      setMemoriesCount(0);
      setLoading(false);
      return;
    }

    const checkMemories = async () => {
      try {
        setLoading(true);
        
        const { count, error } = await supabase
          .from('wine_memories')
          .select('*', { count: 'exact', head: true })
          .eq('wine_id', wineId);

        if (error) {
          console.error('Erreur lors de la vérification des souvenirs:', error);
          setHasMemories(false);
          setMemoriesCount(0);
        } else {
          setHasMemories((count || 0) > 0);
          setMemoriesCount(count || 0);
        }
      } catch (err) {
        console.error('Erreur lors de la vérification des souvenirs:', err);
        setHasMemories(false);
        setMemoriesCount(0);
      } finally {
        setLoading(false);
      }
    };

    checkMemories();
  }, [wineId]);

  return {
    hasMemories,
    memoriesCount,
    loading
  };
}






