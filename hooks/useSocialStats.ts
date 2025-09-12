import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface SocialStats {
  tasted: number;
  favorites: number;
  commonWithFriends: number;
  inspiredFriends: number;
}

export function useSocialStats(userId: string | null) {
  const [stats, setStats] = useState<SocialStats>({ tasted: 0, favorites: 0, commonWithFriends: 0, inspiredFriends: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setStats({ tasted: 0, favorites: 0, commonWithFriends: 0, inspiredFriends: 0 });
      setLoading(false);
      return;
    }

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1) Dégustés (logique étendue):
        // - vins de user_wine avec amount = 0 (ex-cave)
        // - OU vins en wishlist avec rating ou tasting_profile rempli ou commentaire perso
        // - + événements wine_history.tasted (distincts)
        const [uwZeroRes, uwWishRes, histRes] = await Promise.all([
          supabase.from('user_wine')
            .select('wine_id, amount, origin')
            .eq('user_id', userId)
            .eq('origin', 'cellar')
            .eq('amount', 0),
          supabase.from('user_wine')
            .select('wine_id, origin, rating, tasting_profile, personal_comment')
            .eq('user_id', userId)
            .eq('origin', 'wishlist'),
          supabase.from('wine_history')
            .select('wine_id')
            .eq('user_id', userId)
            .eq('event_type', 'tasted')
        ]);

        if (uwZeroRes.error) throw uwZeroRes.error;
        if (uwWishRes.error) throw uwWishRes.error;
        if (histRes.error) throw histRes.error;

        const tastedSet = new Set<string>();
        (uwZeroRes.data || []).forEach(r => tastedSet.add(String(r.wine_id)));
        (uwWishRes.data || []).forEach(r => {
          const hasRating = r.rating != null && r.rating > 0;
          const tp = r.tasting_profile as any;
          const hasTP = !!tp && ((tp.power || 0) + (tp.tannin || 0) + (tp.acidity || 0) + (tp.sweetness || 0) > 0);
          const hasComment = typeof r.personal_comment === 'string' && r.personal_comment.trim().length > 0;
          if (hasRating || hasTP || hasComment) tastedSet.add(String(r.wine_id));
        });
        (histRes.data || []).forEach(r => tastedSet.add(String(r.wine_id)));
        const tasted = tastedSet.size;

        // 2) Favoris: vins likés dans user_wine (wishlist ou cave)
        const { data: favRows, error: favErr } = await supabase
          .from('user_wine')
          .select('wine_id')
          .eq('user_id', userId)
          .eq('favorite', true);
        if (favErr) throw favErr;
        const favorites = new Set((favRows || []).map(r => String(r.wine_id))).size;

        // Récupérer la liste des amis (IDs)
        const { data: friendLinks, error: friendErr } = await supabase
          .from('friend')
          .select('friend_id')
          .eq('user_id', userId)
          .eq('status', 'accepted');
        if (friendErr) throw friendErr;
        const friendIds = Array.from(new Set((friendLinks || []).map(f => String(f.friend_id))));

        let commonWithFriends = 0;
        let inspiredFriends = 0;

        if (friendIds.length > 0) {
          // Mes vins (cave + wishlist)
          const { data: myWines, error: myWinesErr } = await supabase
            .from('user_wine')
            .select('wine_id')
            .eq('user_id', userId);
          if (myWinesErr) throw myWinesErr;
          const myWineIds = new Set((myWines || []).map(w => String(w.wine_id)));

          // Vins des amis (cave + wishlist)
          const { data: friendWines, error: fwErr } = await supabase
            .from('user_wine')
            .select('wine_id, user_id, source_user_id')
            .in('user_id', friendIds);
          if (fwErr) throw fwErr;

          const friendWineIds = new Set((friendWines || []).map(w => String(w.wine_id)));
          commonWithFriends = Array.from(myWineIds).filter(id => friendWineIds.has(id)).length;

          // Vins qui ont inspiré vos amis: entrées user_wine des amis où source_user_id = userId
          const inspiredSet = new Set(
            (friendWines || [])
              .filter(row => String(row.source_user_id || '') === String(userId))
              .map(row => String(row.wine_id))
          );
          inspiredFriends = inspiredSet.size;
        }

        setStats({ tasted, favorites, commonWithFriends, inspiredFriends });
      } catch (e: any) {
        setError(e?.message || 'Erreur inconnue');
        setStats({ tasted: 0, favorites: 0, commonWithFriends: 0, inspiredFriends: 0 });
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [userId]);

  return { stats, loading, error };
}


