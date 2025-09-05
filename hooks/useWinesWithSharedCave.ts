import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Wine } from '../types/wine';
import { useSharedCave } from './useSharedCave';
import { useUser } from './useUser';

export const useWinesWithSharedCave = () => {
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

      console.log('Récupération des vins pour les utilisateurs:', userIds);

      // Récupérer les vins de tous les utilisateurs concernés
      const { data: userWines, error: fetchError } = await supabase
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

      if (fetchError) {
        console.error('Erreur Supabase lors de la récupération:', fetchError);
        throw new Error(`Erreur lors de la récupération: ${fetchError.message}`);
      }

      console.log('Vins récupérés:', userWines);

      // Transformer les données
      const transformedWines: Wine[] = [];
      
      for (const userWine of userWines || []) {
        const wine = userWine.wine;
        if (!wine) continue;

        // Déterminer le nom et le domaine
        const rawName = String(wine.name || '');
        const rawDomaine = typeof wine.producer === 'object' && wine.producer?.name ? String(wine.producer.name) : (typeof wine.producer === 'string' ? wine.producer : 'Domaine inconnu');
        
        // Si le nom est vide ou générique, utiliser le domaine comme nom
        const isGenericName = !rawName || 
          rawName === 'Vin sans nom' || 
          rawName === 'Vin non identifié' || 
          rawName === 'Nom inconnu' ||
          rawName.length < 3;
        
        const finalName = isGenericName && rawDomaine !== 'Domaine inconnu' ? rawDomaine : rawName;
        const finalDomaine = isGenericName && rawDomaine !== 'Domaine inconnu' ? '' : rawDomaine;

        const transformedWine: Wine = {
          id: String(wine.id || ''),
          name: finalName,
          vintage: wine.year ? parseInt(wine.year) : 0,
          domaine: finalDomaine,
          color: (typeof wine.wine_type === 'string' ? wine.wine_type : 'red') as 'red' | 'white' | 'rose' | 'sparkling',
          region: typeof wine.region === 'string' ? wine.region : (wine.country && typeof wine.country === 'object' && wine.country.name ? String(wine.country.name) : ''),
          appellation: typeof wine.appellation === 'string' ? wine.appellation : '',
          grapes: (() => {
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
          })(),
          power: 0,
          tannin: 0,
          sweet: 0,
          acidity: 0,
          description: typeof wine.description === 'string' ? wine.description : '',
          imageUri: typeof wine.image_uri === 'string' ? wine.image_uri : undefined,
          note: userWine.rating || 0,
          stock: userWine.amount || 0,
          origin: userWine.origin || ((userWine.amount || 0) > 0 ? 'cellar' : 'wishlist'),
          history: [],
          createdAt: userWine.created_at,
          updatedAt: userWine.updated_at || userWine.created_at,
          // Ajouter des propriétés pour identifier le propriétaire
          ownerId: userWine.user_id,
          isOwnedByUser: userWine.user_id === user.id
        };
        
        console.log('Vin transformé:', transformedWine);
        transformedWines.push(transformedWine);
      }

      console.log('Vins transformés:', transformedWines);
      setWines(transformedWines);
    } catch (err) {
      console.error('Erreur complète lors de la récupération des vins:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setWines([]);
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