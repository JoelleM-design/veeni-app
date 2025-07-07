import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Wine } from '../types/wine';
import { useSharedCave } from './useSharedCave';
import { useUser } from './useUser';

export const useWinesWithHousehold = () => {
  const { user } = useUser();
  const { sharedCave, userRole, caveState } = useSharedCave();
  const [wines, setWines] = useState<Wine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWines = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      let userIds = [user.id];

      // Si l'utilisateur est dans une cave partagée, inclure les vins du partenaire
      if (caveState === 'shared' && sharedCave) {
        if (userRole === 'owner' && sharedCave.partner_id) {
          userIds.push(sharedCave.partner_id);
        } else if (userRole === 'partner' && sharedCave.owner_id) {
          userIds.push(sharedCave.owner_id);
        }
      }

      const { data, error: fetchError } = await supabase
        .from('user_wine')
        .select(`
          *,
          wine (
            *,
            producer (*),
            country (*)
          )
        `)
        .in('user_id', userIds)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Transformer les données
      const transformedWines = (data || []).map(item => {
        const wine = item.wine;
        const grapes = (() => {
          try {
            if (!wine.grapes) return [];
            if (Array.isArray(wine.grapes)) {
              return wine.grapes.map((g: any) => {
                if (typeof g === 'string') return g;
                if (g && typeof g === 'object' && g.name) return String(g.name);
                return String(g || '');
              }).filter(g => g && g.trim() !== '');
            }
            if (typeof wine.grapes === 'string') return [wine.grapes];
            if (wine.grapes && typeof wine.grapes === 'object' && wine.grapes.name) return [String(wine.grapes.name)];
            return [String(wine.grapes || '')];
          } catch (error) {
            console.warn('Erreur lors du traitement des grapes:', error);
            return [];
          }
        })();
        
        return {
          id: wine.id,
          name: wine.name,
          vintage: wine.year,
          color: wine.wine_type,
          domaine: wine.producer?.name || 'Domaine inconnu',
          region: wine.region || '',
          appellation: '',
          description: wine.description || '',
          imageUri: wine.image_uri,
          stock: item.amount,
          favorite: item.liked,
          note: item.rating || 0,
          acidity: wine.acidity || 0,
          tannin: wine.tannins || 0,
          power: wine.strength || 0,
          sweet: wine.sugar || 0,
          origin: item.origin,
          grapes,
          history: item.history || [],
          personalComment: item.personal_comment,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          // Ajouter l'information sur le propriétaire du vin
          ownerId: item.user_id,
          isOwnedByUser: item.user_id === user.id
        };
      });

      setWines(transformedWines);
    } catch (err) {
      console.error('Erreur lors de la récupération des vins:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWines();
  }, [user, sharedCave, userRole, caveState]);

  // Filtrer les vins par propriétaire
  const getWinesByOwner = (ownerId: string) => {
    return wines.filter(wine => wine.ownerId === ownerId);
  };

  // Obtenir les vins de l'utilisateur actuel
  const getUserWines = () => {
    return wines.filter(wine => wine.isOwnedByUser);
  };

  // Obtenir les vins du partenaire
  const getPartnerWines = () => {
    if (!sharedCave || caveState !== 'shared') return [];
    
    const partnerId = userRole === 'owner' ? sharedCave.partner_id : sharedCave.owner_id;
    if (!partnerId) return [];
    
    return wines.filter(wine => wine.ownerId === partnerId);
  };

  return {
    wines,
    loading,
    error,
    getUserWines,
    getPartnerWines,
    getWinesByOwner,
    refresh: fetchWines,
    isSharedCave: caveState === 'shared',
    userRole
  };
}; 