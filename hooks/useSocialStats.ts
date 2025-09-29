import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface SocialStats {
  tasted: number;
  favorites: number;
  commonWithFriends: number;
  inspiredFriends: number;
}

export function useSocialStats(userId: string | null, refreshKey: number = 0, disableFallback: boolean = false) {
  const [stats, setStats] = useState<SocialStats>({ tasted: 0, favorites: 0, commonWithFriends: 0, inspiredFriends: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const computeClientFallback = async (): Promise<SocialStats> => {
      try {
        // 1) User + household
        const { data: me } = await supabase.from('User').select('id, household_id').eq('id', userId).single();
        const myHouseholdId = me?.household_id || null;

        // 2) My cellar (via household or user) and wishlist
        const [myCellarHhRes, myCellarUserRes, myWishlistRes, myHistoryRes, myHistoryHhRes] = await Promise.all([
          myHouseholdId
            ? supabase
                .from('user_wine')
                .select('wine_id, favorite, amount, origin, household_id, user_id')
                .eq('household_id', myHouseholdId)
                .or('origin.eq.cellar,origin.is.null')
            : Promise.resolve({ data: [] as any[] }),
          supabase
            .from('user_wine')
            .select('wine_id, favorite, amount, origin, household_id, user_id')
            .eq('user_id', userId as any)
            .or('origin.eq.cellar,origin.is.null'),
          supabase
            .from('user_wine')
            .select('wine_id, favorite, rating, personal_comment, tasting_profile')
            .eq('user_id', userId as any)
            .eq('origin', 'wishlist'),
          supabase
            .from('wine_history')
            .select('wine_id')
            .eq('user_id', userId as any)
            .eq('event_type', 'tasted'),
          myHouseholdId
            ? supabase
                .from('wine_history')
                .select('wine_id, household_id')
                .eq('household_id', myHouseholdId)
                .eq('event_type', 'tasted')
            : Promise.resolve({ data: [] as any[] }),
        ]);
        const myCellar = [
          ...((myCellarHhRes?.data || []) as any[]),
          ...((myCellarUserRes?.data || []) as any[]),
        ];
        const myWishlist = (myWishlistRes?.data || []);
        const myIds = new Set<string>([
          ...myCellar.map((r: any) => String(r.wine_id)),
          ...myWishlist.map((r: any) => String(r.wine_id)),
        ]);

        // tasted = nombre d'événements (pas DISTINCT des vins)
        const historyRows = [
          ...(((myHistoryRes as any)?.data || []) as any[]),
          ...(((myHistoryHhRes as any)?.data || []) as any[]),
        ];

        const historyWineIds = new Set<string>(historyRows.map((r: any) => String(r.wine_id)));
        const zeroStockIds = new Set<string>(
          myCellar.filter((r: any) => (r.amount || 0) === 0).map((r: any) => String(r.wine_id))
        );
        const wishlistQualifiedIds = new Set<string>(myWishlist.filter((r: any) => {
          const tp = r.tasting_profile as any;
          const hasTP = !!tp && ((tp.power || 0) + (tp.tannin || 0) + (tp.acidity || 0) + (tp.sweetness || 0) > 0);
          const hasRating = (r.rating || 0) > 0;
          const hasComment = (r.personal_comment || '').trim().length > 0;
          return hasTP || hasRating || hasComment;
        }).map((r: any) => String(r.wine_id)));
        // Comptage distinct par vin: union de (historique, stock=0, wishlist qualifiée)
        const unionIds = new Set<string>();
        historyWineIds.forEach(id => unionIds.add(id));
        zeroStockIds.forEach(id => unionIds.add(id));
        wishlistQualifiedIds.forEach(id => unionIds.add(id));
        const tasted = unionIds.size;

        // favorites
        const favorites = new Set<string>([
          ...myCellar.filter((r: any) => !!r.favorite).map((r: any) => String(r.wine_id)),
          ...myWishlist.filter((r: any) => !!r.favorite).map((r: any) => String(r.wine_id)),
        ]).size;

        // friends bidirectional
        const [fromRes, toRes] = await Promise.all([
          supabase.from('friend').select('friend_id').eq('user_id', userId as any).eq('status', 'accepted'),
          supabase.from('friend').select('user_id').eq('friend_id', userId as any).eq('status', 'accepted'),
        ]);
        const friendIds = Array.from(new Set<string>([
          ...((fromRes?.data || []).map((r: any) => String(r.friend_id))),
          ...((toRes?.data || []).map((r: any) => String(r.user_id))),
        ]));

        let commonWithFriends = 0;
        let inspiredFriends = 0; // sans source_user_id fiable côté client

        if (friendIds.length > 0) {
          const { data: friendsUsers } = await supabase.from('User').select('id, household_id').in('id', friendIds);
          const householdMap = new Map<string, string | null>();
          (friendsUsers || []).forEach((u: any) => householdMap.set(String(u.id), u.household_id || null));

          // friends cellar via household ids
          const fhids = Array.from(new Set<string>(((friendsUsers || []).map((u: any) => u.household_id)).filter(Boolean)));
          const fNoHh = (friendsUsers || []).filter((u: any) => !u.household_id).map((u: any) => String(u.id));

          const [fCellarHhRes, fCellarUserRes, fWishlistRes] = await Promise.all([
            fhids.length ? supabase.from('user_wine').select('wine_id, household_id').or('origin.eq.cellar,origin.is.null').in('household_id', fhids) : Promise.resolve({ data: [] as any[] }),
            fNoHh.length ? supabase.from('user_wine').select('wine_id, user_id').or('origin.eq.cellar,origin.is.null').in('user_id', fNoHh) : Promise.resolve({ data: [] as any[] }),
            supabase.from('user_wine').select('wine_id, user_id').eq('origin', 'wishlist').in('user_id', friendIds),
          ]);

          const friendWineIds = new Set<string>([
            ...((fCellarHhRes?.data || []).map((r: any) => String(r.wine_id))),
            ...((fCellarUserRes?.data || []).map((r: any) => String(r.wine_id))),
            ...((fWishlistRes?.data || []).map((r: any) => String(r.wine_id))),
          ]);

          // Intersection by id + fallback (name+producer), en évitant double comptage
          const idCommonSet = new Set(Array.from(myIds).filter(id => friendWineIds.has(id)));

          const myIdsArr = Array.from(myIds);
          const fIdsArr = Array.from(friendWineIds);
          const [myW, frW] = await Promise.all([
            myIdsArr.length ? supabase.from('wine').select('id, name, producer_id').in('id', myIdsArr) : Promise.resolve({ data: [] as any[] }),
            fIdsArr.length ? supabase.from('wine').select('id, name, producer_id').in('id', fIdsArr) : Promise.resolve({ data: [] as any[] }),
          ]);
          const norm = (s: string) => (s || '').toLowerCase().trim();
          const myPairs = new Set((myW?.data || []).map((w: any) => `${norm(w.name)}|${w.producer_id || ''}`));
          const frPairs = new Set((frW?.data || []).map((w: any) => `${norm(w.name)}|${w.producer_id || ''}`));
          let nmCommon = 0;
          myPairs.forEach(p => { if (frPairs.has(p)) nmCommon += 1; });

          commonWithFriends = Math.max(idCommonSet.size, nmCommon);
        }

        return { tasted, favorites, commonWithFriends, inspiredFriends };
      } catch (_) {
        return { tasted: 0, favorites: 0, commonWithFriends: 0, inspiredFriends: 0 };
      }
    };

    const run = async () => {
      if (!userId) {
        if (isActive) {
          setStats({ tasted: 0, favorites: 0, commonWithFriends: 0, inspiredFriends: 0 });
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase.rpc('get_user_social_stats', { target_user_id: userId });
        const row = Array.isArray(data) ? data[0] : data;
        let serverStats: SocialStats = {
          tasted: row?.tasted ?? 0,
          favorites: row?.favorites ?? 0,
          commonWithFriends: row?.common_with_friends ?? 0,
          inspiredFriends: row?.inspired_friends ?? 0,
        };

        // Always use client-side calculation for now since RPC function doesn't exist
        if (!disableFallback) {
          const clientStats = await computeClientFallback();
          serverStats = clientStats;
        }

        if (isActive) setStats(serverStats);
      } catch (e: any) {
        if (isActive) {
          setError(e?.message || 'Erreur inconnue');
          if (!disableFallback) {
            const fb = await computeClientFallback();
            setStats(fb);
          } else {
            setStats({ tasted: 0, favorites: 0, commonWithFriends: 0, inspiredFriends: 0 });
          }
        }
      } finally {
        if (isActive) setLoading(false);
      }
    };

    run();
    return () => { isActive = false; };
  }, [userId, refreshKey]);

  return { stats, loading, error };
}


