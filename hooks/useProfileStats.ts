import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface ProfileStats {
  tastedCount: number;      // wine_history avec event_type = 'tasted'
  favoritesCount: number;   // user_wine avec favorite = true
  wishlistCount: number;    // user_wine avec origin = 'wishlist' (même si amount = 0)
  cellarCount: number;      // user_wine avec origin = 'cellar' (même si amount = 0)
  memoriesCount: number;    // souvenirs créés par l'utilisateur
  inspiredCount: number;    // user_wine avec source_user_id (pour plus tard)
}

export function useProfileStats(userId: string | null, viewerId?: string) {
  const [stats, setStats] = useState<ProfileStats>({
    tastedCount: 0,
    favoritesCount: 0,
    wishlistCount: 0,
    cellarCount: 0,
    memoriesCount: 0,
    inspiredCount: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setStats({
        tastedCount: 0,
        favoritesCount: 0,
        wishlistCount: 0,
        cellarCount: 0,
        memoriesCount: 0,
        inspiredCount: 0
      });
      return;
    }

    const calculateStats = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('🔄 useProfileStats: Calcul des stats pour', userId, 'viewer:', viewerId);
        
        // Vérifier l'utilisateur authentifié
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        console.log('🔍 Utilisateur authentifié:', currentUser?.id);

        // 1. Dégustés = uniquement les stock_change qui réduisent le stock
        const { data: stockChangeData, error: stockChangeError } = await supabase
          .from('wine_history')
          .select('previous_amount, new_amount')
          .eq('user_id', userId)
          .eq('event_type', 'stock_change');

        if (stockChangeError) {
          console.error('❌ Erreur stock_change:', stockChangeError);
          throw stockChangeError;
        }

        const tastedCount = (stockChangeData || []).filter((event: any) => {
          return Number(event.previous_amount) > Number(event.new_amount);
        }).length;

        console.log('✅ Dégustés (stock_change réductions):', tastedCount);

        // 2. Favoris - user_wine avec favorite = true
        const { data: favoritesData, error: favoritesError } = await supabase
          .from('user_wine')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)
          .eq('favorite', true);

        if (favoritesError) {
          console.error('❌ Erreur favorites:', favoritesError);
          throw favoritesError;
        }

        const favoritesCount = favoritesData?.length || 0;
        console.log('✅ Favoris:', favoritesCount);

        // 3. Wishlist - user_wine avec origin = 'wishlist' (même si amount = 0)
        const { data: wishlistData, error: wishlistError } = await supabase
          .from('user_wine')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)
          .eq('origin', 'wishlist');

        if (wishlistError) {
          console.error('❌ Erreur wishlist:', wishlistError);
          throw wishlistError;
        }

        const wishlistCount = wishlistData?.length || 0;
        console.log('✅ Wishlist:', wishlistCount);

        // 4. Cave - user_wine avec origin = 'cellar' (même si amount = 0)
        const { data: cellarData, error: cellarError } = await supabase
          .from('user_wine')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)
          .eq('origin', 'cellar');

        if (cellarError) {
          console.error('❌ Erreur cellar:', cellarError);
          throw cellarError;
        }

        const cellarCount = cellarData?.length || 0;
        console.log('✅ Cave:', cellarCount);

        // 5. Inspirés - user_wine avec source_user_id (pour plus tard)
        const { data: inspiredData, error: inspiredError } = await supabase
          .from('user_wine')
          .select('id', { count: 'exact' })
          .eq('origin', 'wishlist')
          .eq('source_user_id', userId);

        if (inspiredError) {
          console.error('❌ Erreur inspired:', inspiredError);
          // Ne pas throw car la colonne peut ne pas exister sur d'anciens enregistrements
          console.log('⚠️ Colonne source_user_id manquante ou erreur, inspirés = 0');
        }

        const inspiredCount = inspiredData?.length || 0;
        console.log('✅ Inspirés:', inspiredCount);

        // 6. Souvenirs - compter les souvenirs créés par l'utilisateur OU où il est mentionné
        console.log('🔍 Calcul souvenirs pour user_id:', userId);
        
        // Récupérer tous les souvenirs visibles (les miens + ceux de mes amis)
        const { data: allMemoriesData, error: memoriesError } = await supabase
          .from('wine_memories')
          .select('id, user_id, friends_tagged');

        if (memoriesError) {
          console.error('❌ Erreur souvenirs:', memoriesError);
          throw memoriesError;
        }

        // Filtrer pour compter :
        // 1. Souvenirs créés par l'utilisateur
        // 2. Souvenirs où l'utilisateur est mentionné dans friends_tagged
        const userMemories = allMemoriesData?.filter(memory => {
          // Créateur du souvenir
          if (memory.user_id === userId) return true;
          
          // Mentionné dans friends_tagged
          if (memory.friends_tagged && Array.isArray(memory.friends_tagged)) {
            return memory.friends_tagged.includes(userId);
          }
          
          return false;
        }) || [];
        
        const memoriesCount = userMemories.length;
        
        console.log('🔍 Total souvenirs visibles:', allMemoriesData?.length || 0);
        console.log('✅ Souvenirs de l\'utilisateur (créés + mentionnés):', memoriesCount);

        // Mettre à jour les stats
        setStats({
          tastedCount,
          favoritesCount,
          wishlistCount,
          cellarCount,
          memoriesCount: memoriesCount || 0,
          inspiredCount
        });

        console.log('📊 Stats finales:', {
          tastedCount,
          favoritesCount,
          wishlistCount,
          cellarCount,
          memoriesCount: memoriesCount || 0,
          inspiredCount
        });

      } catch (err) {
        console.error('❌ Erreur générale useProfileStats:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    calculateStats();
  }, [userId, viewerId]);

  return {
    stats,
    loading,
    error,
    refetch: () => {
      if (userId) {
        setStats({
          tastedCount: 0,
          favoritesCount: 0,
          wishlistCount: 0,
          cellarCount: 0,
          memoriesCount: 0,
          inspiredCount: 0
        });
        // Le useEffect se déclenchera automatiquement
      }
    }
  };
}