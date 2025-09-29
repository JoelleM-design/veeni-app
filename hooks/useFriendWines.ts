import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Wine } from '../types/wine';

export function useFriendWines(friendId: string | null) {
  const [wines, setWines] = useState<Wine[]>([]);
  const [tastedWines, setTastedWines] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchFriendWines = useCallback(async () => {
    if (!friendId) {
      setWines([]);
      setTastedWines([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Récupération des vins de l\'ami:', friendId);

      // Récupérer les vins de cave et wishlist de l'ami
      const { data: userWines, error: userWinesError } = await supabase
        .from('user_wine')
        .select(`
          id,
          amount,
          favorite,
          rating,
          personal_comment,
          tasting_profile,
          wine_id,
          origin,
          created_at,
          updated_at,
          wine (
            id,
            name,
            year,
            wine_type,
            price_range,
            region,
            description,
            strength,
            tannins,
            sugar,
            acidity,
            optimal_conso_date,
            image_uri,
            producer_id,
            country_id,
            designation_id,
            grapes,
            producer (
              id,
              name
            ),
            country (
              id,
              name,
              flag_emoji
            ),
            designation (
              id,
              name
            )
          )
        `)
        .eq('user_id', friendId)
        .in('origin', ['cellar', 'wishlist']);

      if (userWinesError) {
        throw userWinesError;
      }

      // Transformer les données
      const transformedWines = (userWines || []).map(uw => ({
        ...uw.wine,
        amount: uw.amount,
        favorite: uw.favorite,
        rating: uw.rating,
        personal_comment: uw.personal_comment,
        tasting_profile: uw.tasting_profile,
        origin: uw.origin,
        created_at: uw.created_at,
        updated_at: uw.updated_at,
        // Ajouter les propriétés calculées
        domaine: uw.wine.producer?.name || '',
        country: uw.wine.country?.name || '',
        countryName: uw.wine.country?.name || '',
        flag_emoji: uw.wine.country?.flag_emoji || '',
        appellation: uw.wine.designation?.name || '',
        vintage: uw.wine.year || '',
        color: uw.wine.wine_type || '',
        priceRange: uw.wine.price_range || '',
        imageUri: uw.wine.image_uri, // ✅ Ajouter l'imageUri manquante
      }));

      setWines(transformedWines);

      // Récupérer l'historique des dégustations
      const wineIds = transformedWines.map(w => w.id);
      if (wineIds.length > 0) {
        const { data: historyData, error: historyError } = await supabase
          .from('wine_history')
          .select('id, wine_id, event_type, event_date, rating, notes')
          .eq('user_id', friendId)
          .in('wine_id', wineIds)
          .order('event_date', { ascending: false });

        if (!historyError) {
          // Grouper par vin et compter les dégustations
          const groupedHistory = (historyData || []).reduce((acc: any, entry) => {
            // Vérifier que entry existe et a un wine_id valide
            if (!entry || !entry.wine_id || typeof entry.wine_id !== 'string') {
              console.warn('⚠️ Entry invalide ou sans wine_id:', entry);
              return acc;
            }
            
            if (!acc[entry.wine_id]) {
              acc[entry.wine_id] = {
                wine: transformedWines.find(w => w.id === entry.wine_id),
                tastings: [],
                lastTastedAt: null,
                tastingCount: 0
              };
            }
            
            if (entry.event_type === 'tasted') {
              acc[entry.wine_id].tastings.push(entry);
              acc[entry.wine_id].lastTastedAt = entry.event_date;
              acc[entry.wine_id].tastingCount++;
            }
            return acc; // Ensure accumulator is returned
          }, {});

          const tastedWinesArray = Object.values(groupedHistory).filter((item: any) => item.tastingCount > 0);
          setTastedWines(tastedWinesArray);
        }
      }

      console.log('✅ Vins de l\'ami récupérés:', transformedWines.length);
    } catch (err) {
      console.error('❌ Erreur lors de la récupération des vins de l\'ami:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [friendId]);

  useEffect(() => {
    fetchFriendWines();
  }, [fetchFriendWines]);

  return {
    wines,
    tastedWines,
    loading,
    error,
    refetch: fetchFriendWines
  };
}
