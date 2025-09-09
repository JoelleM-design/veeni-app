import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from './useUser';

export interface SharedWine {
  id: string;
  name: string;
  domaine?: string;
  vintage?: number;
  color: string;
  imageUri?: string;
}

export function useSharedWines(friendId: string | null) {
  const { user } = useUser();
  const [sharedWines, setSharedWines] = useState<SharedWine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!friendId || !user) {
      setSharedWines([]);
      setIsLoading(false);
      return;
    }

    const fetchSharedWines = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log('🔄 useSharedWines: Récupération des vins en commun avec:', friendId);
        
        // Récupérer les vins de l'utilisateur connecté
        const { data: myWines, error: myWinesError } = await supabase
          .from('user_wine')
          .select('wine_id')
          .eq('user_id', user.id);

        if (myWinesError) {
          console.error('❌ Erreur récupération mes vins:', myWinesError);
          setError(myWinesError.message);
          return;
        }

        // Récupérer les vins de l'ami
        const { data: friendWines, error: friendWinesError } = await supabase
          .from('user_wine')
          .select('wine_id')
          .eq('user_id', friendId);

        if (friendWinesError) {
          console.error('❌ Erreur récupération vins ami:', friendWinesError);
          setError(friendWinesError.message);
          return;
        }

        // Trouver les vins en commun
        const myWineIds = new Set(myWines?.map(w => w.wine_id) || []);
        const friendWineIds = new Set(friendWines?.map(w => w.wine_id) || []);
        const commonWineIds = [...myWineIds].filter(id => friendWineIds.has(id));

        console.log('🍷 Vins en commun trouvés:', commonWineIds.length);

        if (commonWineIds.length === 0) {
          setSharedWines([]);
          return;
        }

        // Récupérer les détails des vins en commun
        const { data: wines, error: winesError } = await supabase
          .from('wine')
          .select('id, name, domaine, vintage, color, image_uri')
          .in('id', commonWineIds);

        if (winesError) {
          console.error('❌ Erreur récupération détails vins:', winesError);
          setError(winesError.message);
          return;
        }

        const sharedWinesData = wines?.map(wine => ({
          id: wine.id,
          name: wine.name,
          domaine: wine.domaine,
          vintage: wine.vintage,
          color: wine.color,
          imageUri: wine.image_uri
        })) || [];

        console.log('✅ Vins en commun récupérés:', sharedWinesData.length);
        setSharedWines(sharedWinesData);

      } catch (err) {
        console.error('❌ Erreur lors de la récupération des vins en commun:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedWines();
  }, [friendId, user]);

  return { sharedWines, isLoading, error };
}
