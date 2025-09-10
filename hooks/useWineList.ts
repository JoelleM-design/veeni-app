import { useMemo } from 'react';
import { Wine } from '../types/wine';
import { useWineHistory } from './useWineHistory';
import { useWines } from './useWines';

export type WineListTab = 'cellar' | 'wishlist' | 'tasted';

export function useWineList(tab: WineListTab, injectedWines?: Wine[]): Wine[] {
  const { wines } = useWines();
  const { tastedWines } = useWineHistory();

  return useMemo(() => {
    console.log('[useWineList] Debug:', { 
      tab, 
      totalWines: (injectedWines ?? wines)?.length || 0,
      totalTastedWines: tastedWines?.length || 0,
      wineOrigins: (injectedWines ?? wines)?.map(w => w.origin) || [],
      winesUpdated: (injectedWines ?? wines)?.map(w => ({ id: w.id, name: w.name, stock: w.stock, favorite: w.favorite, color: w.color })) || []
    });

    const sourceWines = injectedWines ?? wines;

    if (tab === 'tasted') {
      // Pour les vins dégustés, utiliser useWineHistory
      const result = tastedWines.map((entry) => ({
        ...entry.wine,
        lastTastedAt: entry.lastTastedAt,
        tastingCount: entry.tastingCount,
        origin: 'tasted' as const,
      }));
      console.log('[useWineList] Tasted wines:', result.length);
      return result;
    }
    
    if (!sourceWines) {
      console.log('[useWineList] No wines available');
      return [];
    }
    
    if (tab === 'cellar') {
      const cellarWines = sourceWines.filter(w => w.origin === 'cellar');
      console.log('[useWineList] Cellar wines:', cellarWines.length);
      return cellarWines;
    }
    if (tab === 'wishlist') {
      const wishlistWines = sourceWines.filter(w => w.origin === 'wishlist');
      console.log('[useWineList] Wishlist wines:', wishlistWines.length, wishlistWines.map(w => ({ id: w.id, name: w.name, origin: w.origin })));
      return wishlistWines;
    }
    
    console.log('[useWineList] No matching tab, returning empty array');
    return [];
  }, [injectedWines, wines, tastedWines, tab]);
} 