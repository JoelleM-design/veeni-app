
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useFriends } from './useFriends';
import { useUser } from './useUser';
import { useWineHistory } from './useWineHistory';
import { useWines } from './useWines';
import { useWinesWithHousehold } from './useWinesWithHousehold';

export interface ProfileStats {
  // Nouvelles métriques principales
  totalTastedWines: number;        // Nombre total de vins dégustés
  sharedWinesWithFriends: number;  // Nombre de vins en commun avec amis
  sharedWinesCount: number;        // Nombre de vins ajoutés via un ami
  totalBottlesInCellar: number;    // Nombre de bouteilles en cave
  favoriteWinesCount: number;      // Nombre de vins "coup de cœur"
  
  // Métriques existantes (gardées pour compatibilité)
  totalWines: number;
  cellarCount: number;
  wishlistCount: number;
  favoritesCount: number;
  redWinesCount: number;
  whiteWinesCount: number;
  roseWinesCount: number;
  sparklingWinesCount: number;
}

export function useProfileStats() {
  const { wines = [], subscribeToUpdates } = useWines();
  const { tastedWines = [] } = useWineHistory();
  const { friends = [] } = useFriends();
  const { user } = useUser();
  const [sharedWinesCount, setSharedWinesCount] = useState(0);
  const [sharedWinesViaFriendsCount, setSharedWinesViaFriendsCount] = useState(0);
  const [forceUpdate, setForceUpdate] = useState(0);

  // S'abonner aux mises à jour de useWines
  useEffect(() => {
    const unsubscribe = subscribeToUpdates(() => {
      console.log('🔄 useProfileStats: Notification reçue de useWines, forcer mise à jour');
      setForceUpdate(prev => prev + 1);
    });
    return unsubscribe;
  }, [subscribeToUpdates]);

  // Calculer les vins en commun avec les amis
  useEffect(() => {
    const calculateSharedWines = async () => {
      if (!user || friends.length === 0) {
        setSharedWinesCount(0);
        setSharedWinesViaFriendsCount(0);
        return;
      }

      try {
        // Récupérer les wine_ids de l'utilisateur actuel
        const { data: userWines, error: userError } = await supabase
          .from('user_wine')
          .select('wine_id')
          .eq('user_id', user.id)
          .gt('amount', 0);

        if (userError) throw userError;

        const userWineIds = userWines?.map(w => w.wine_id) || [];

        if (userWineIds.length === 0) {
          setSharedWinesCount(0);
          setSharedWinesViaFriendsCount(0);
          return;
        }

        // Récupérer les wine_ids des amis
        const friendIds = friends.map(f => f.id);
        const { data: friendWines, error: friendError } = await supabase
          .from('user_wine')
          .select('wine_id')
          .in('user_id', friendIds)
          .gt('amount', 0);

        if (friendError) throw friendError;

        const friendWineIds = friendWines?.map(w => w.wine_id) || [];

        // Calculer l'intersection (vins en commun)
        const sharedWineIds = userWineIds.filter(id => friendWineIds.includes(id));
        setSharedWinesCount(sharedWineIds.length);

        // Pour l'instant, on utilise une logique simple : 
        // vins ajoutés via un ami = vins en commun (à affiner plus tard)
        setSharedWinesViaFriendsCount(sharedWineIds.length);

      } catch (error) {
        console.error('Erreur lors du calcul des vins partagés:', error);
        setSharedWinesCount(0);
        setSharedWinesViaFriendsCount(0);
      }
    };

    calculateSharedWines();
  }, [user, friends]);

  // Détecter les changements de vins pour forcer la mise à jour
  useEffect(() => {
    console.log('🔄 useProfileStats: Changement détecté dans wines:', wines.length, 'vins');
    const cellarWines = wines.filter(wine => wine.origin === 'cellar');
    const totalBottles = cellarWines.reduce((sum, wine) => sum + (wine.stock || 0), 0);
    console.log('📊 Total bouteilles en cave:', totalBottles);
  }, [wines]);

  // Calculer les stats directement à partir des vins actuels (synchronisation immédiate)
  const stats = useMemo(() => {
    console.log('🔄 useProfileStats: Recalcul des stats avec', wines.length, 'vins');
    
    // Métriques existantes
    const cellarWines = wines.filter(wine => wine.origin === 'cellar');
    const wishlistWines = wines.filter(wine => wine.origin === 'wishlist');
    const favoriteWines = wines.filter(wine => wine.favorite === true);
    
    const redWines = wines.filter(wine => wine.color === 'red');
    const whiteWines = wines.filter(wine => wine.color === 'white');
    const roseWines = wines.filter(wine => wine.color === 'rose');
    const sparklingWines = wines.filter(wine => wine.color === 'sparkling');

    // Nombre total de vins dégustés (source: wine_history)
    const totalTastedWines = tastedWines.length;

    // Nombre de vins en commun avec amis (calculé dynamiquement)
    const sharedWinesWithFriends = sharedWinesCount;

    // Nombre de vins ajoutés via un ami (pour l'instant = vins en commun)
    const sharedWinesViaFriends = sharedWinesViaFriendsCount;

    // Nombre total de bouteilles en cave (SUM des stocks) - CALCUL IMMÉDIAT
    const totalBottlesInCellar = cellarWines.reduce((sum, wine) => sum + (wine.stock || 0), 0);

    // Nombre de vins "coup de cœur" (favorite = true)
    const favoriteWinesCount = favoriteWines.length;

    console.log('📊 Stats calculées:', {
      totalTastedWines,
      sharedWinesWithFriends,
      sharedWinesCount: sharedWinesViaFriends,
      totalBottlesInCellar,
      favoriteWinesCount,
      cellarWinesCount: cellarWines.length
    });

    return {
      // Nouvelles métriques principales
      totalTastedWines,
      sharedWinesWithFriends,
      sharedWinesCount: sharedWinesViaFriends,
      totalBottlesInCellar,
      favoriteWinesCount,
      
      // Métriques existantes
      totalWines: wines.length,
      cellarCount: cellarWines.length,
      wishlistCount: wishlistWines.length,
      favoritesCount: favoriteWines.length,
      redWinesCount: redWines.length,
      whiteWinesCount: whiteWines.length,
      roseWinesCount: roseWines.length,
      sparklingWinesCount: sparklingWines.length,
    };
  }, [wines, tastedWines, sharedWinesCount, sharedWinesViaFriendsCount, forceUpdate]);

  return stats;
}

export function useProfileStatsWithHousehold() {
  const { userWines = [] } = useWinesWithHousehold();
  const { tastedWines = [] } = useWineHistory();
  const { friends = [] } = useFriends();
  const { user } = useUser();
  const [sharedWinesCount, setSharedWinesCount] = useState(0);
  const [sharedWinesViaFriendsCount, setSharedWinesViaFriendsCount] = useState(0);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Calculer les vins en commun avec les amis
  useEffect(() => {
    const calculateSharedWines = async () => {
      if (!user || friends.length === 0) {
        setSharedWinesCount(0);
        setSharedWinesViaFriendsCount(0);
        return;
      }

      try {
        // Récupérer les wine_ids de l'utilisateur actuel
        const { data: userWines, error: userError } = await supabase
          .from('user_wine')
          .select('wine_id')
          .eq('user_id', user.id)
          .gt('amount', 0);

        if (userError) throw userError;

        const userWineIds = userWines?.map(w => w.wine_id) || [];

        if (userWineIds.length === 0) {
          setSharedWinesCount(0);
          setSharedWinesViaFriendsCount(0);
          return;
        }

        // Récupérer les wine_ids des amis
        const friendIds = friends.map(f => f.id);
        const { data: friendWines, error: friendError } = await supabase
          .from('user_wine')
          .select('wine_id')
          .in('user_id', friendIds)
          .gt('amount', 0);

        if (friendError) throw friendError;

        const friendWineIds = friendWines?.map(w => w.wine_id) || [];

        // Calculer l'intersection (vins en commun)
        const sharedWineIds = userWineIds.filter(id => friendWineIds.includes(id));
        setSharedWinesCount(sharedWineIds.length);

        // Pour l'instant, on utilise une logique simple : 
        // vins ajoutés via un ami = vins en commun (à affiner plus tard)
        setSharedWinesViaFriendsCount(sharedWineIds.length);

      } catch (error) {
        console.error('Erreur lors du calcul des vins partagés:', error);
        setSharedWinesCount(0);
        setSharedWinesViaFriendsCount(0);
      }
    };

    calculateSharedWines();
  }, [user, friends]);

  // Forcer la mise à jour quand les vins changent
  useEffect(() => {
    console.log('🔄 useProfileStatsWithHousehold: Vins mis à jour, recalcul des stats');
    setForceUpdate(prev => prev + 1);
  }, [userWines]);

  const stats = useMemo(() => {
    // Métriques existantes
    const cellarWines = userWines.filter(wine => wine.origin === 'cellar');
    const wishlistWines = userWines.filter(wine => wine.origin === 'wishlist');
    const favoriteWines = userWines.filter(wine => wine.favorite === true);
    
    const redWines = userWines.filter(wine => wine.color === 'red');
    const whiteWines = userWines.filter(wine => wine.color === 'white');
    const roseWines = userWines.filter(wine => wine.color === 'rose');
    const sparklingWines = userWines.filter(wine => wine.color === 'sparkling');

    // Nombre total de vins dégustés (source: wine_history)
    const totalTastedWines = tastedWines.length;

    // Nombre de vins en commun avec amis (calculé dynamiquement)
    const sharedWinesWithFriends = sharedWinesCount;

    // Nombre de vins ajoutés via un ami (pour l'instant = vins en commun)
    const sharedWinesViaFriends = sharedWinesViaFriendsCount;

    // Nombre total de bouteilles en cave (SUM des stocks)
    const totalBottlesInCellar = cellarWines.reduce((sum, wine) => sum + (wine.stock || 0), 0);

    // Nombre de vins "coup de cœur" (favorite = true)
    const favoriteWinesCount = favoriteWines.length;

    return {
      // Nouvelles métriques principales
      totalTastedWines,
      sharedWinesWithFriends,
      sharedWinesCount: sharedWinesViaFriends,
      totalBottlesInCellar,
      favoriteWinesCount,
      
      // Métriques existantes
      totalWines: userWines.length,
      cellarCount: cellarWines.length,
      wishlistCount: wishlistWines.length,
      favoritesCount: favoriteWines.length,
      redWinesCount: redWines.length,
      whiteWinesCount: whiteWines.length,
      roseWinesCount: roseWines.length,
      sparklingWinesCount: sparklingWines.length,
    };
  }, [userWines, tastedWines, sharedWinesCount, sharedWinesViaFriendsCount, forceUpdate]);

  return stats;
} 