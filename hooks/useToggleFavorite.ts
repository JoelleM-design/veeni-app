import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from './useUser';

export function useToggleFavorite(wineId: string, initialFavorite: boolean = false) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();

  // Synchroniser avec la valeur initiale quand elle change
  useEffect(() => {
    setIsFavorite(initialFavorite);
  }, [initialFavorite]);

  const toggleFavorite = useCallback(async () => {
    if (!user || !wineId) {
      console.error('User or wineId missing for toggleFavorite');
      return;
    }

    setIsLoading(true);
    const newFavoriteState = !isFavorite;

    try {
      // Mise à jour optimiste de l'état local
      setIsFavorite(newFavoriteState);
      
      // Vérifier si l'entrée existe déjà dans user_wine
      const { data: existingEntry } = await supabase
        .from('user_wine')
        .select('*')
        .eq('user_id', user.id)
        .eq('wine_id', wineId)
        .single();

      if (existingEntry) {
        // Mettre à jour l'entrée existante
        const { error } = await supabase
          .from('user_wine')
          .update({ favorite: newFavoriteState })
          .eq('user_id', user.id)
          .eq('wine_id', wineId);

        if (error) throw error;
      } else {
        // Créer une nouvelle entrée
        const { error } = await supabase
          .from('user_wine')
          .insert({
            user_id: user.id,
            wine_id: wineId,
            amount: 0,
            favorite: newFavoriteState,
            origin: 'history'
          });

        if (error) throw error;
      }

      console.log(`Vin ${wineId} ${newFavoriteState ? 'ajouté aux' : 'retiré des'} favoris`);

    } catch (error) {
      console.error('Erreur lors du toggle favorite:', error);
      // Revenir à l'état précédent en cas d'erreur
      setIsFavorite(!newFavoriteState);
    } finally {
      setIsLoading(false);
    }
  }, [user, wineId, isFavorite]);

  return {
    isFavorite,
    toggleFavorite,
    isLoading
  };
} 