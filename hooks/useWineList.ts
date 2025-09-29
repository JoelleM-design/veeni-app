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
      // Pour les vins dégustés, utiliser useWineHistory et mapper vers le format Wine
      console.log('[useWineList] Raw tastedWines structure:', JSON.stringify(tastedWines[0], null, 2));
      
      const result = tastedWines.map((entry) => {
        const wine = entry.wine;
        const latestTasting = entry.tastings && entry.tastings.length > 0 ? entry.tastings[0] : null;
        
        return {
          id: String(wine?.id || ''),
          name: String(wine?.name || 'Nom inconnu'),
          vintage: wine?.year ? parseInt(wine.year) : null,
          color: (wine?.wine_type || 'red') as 'red' | 'white' | 'rose' | 'sparkling',
          domaine: String(wine?.producer?.name || 'Domaine inconnu'),
          region: wine?.region || '',
          country: wine?.country?.name || '',
          grapes: wine?.grapes || [],
          imageUri: wine?.image_uri || null,
          stock: 0, // Les vins dégustés n'ont pas de stock
          origin: 'tasted' as const,
          note: latestTasting?.rating || null,
          personalComment: latestTasting?.note || null,
          favorite: entry.favorite || false,
          lastTastedAt: entry.lastTastedAt,
          tastingCount: entry.tastingCount,
        };
      });
      
      console.log('[useWineList] Mapped tasted wines:', result.map(w => ({ 
        id: w.id, 
        name: w.name, 
        color: w.color, 
        origin: w.origin,
        lastTastedAt: w.lastTastedAt,
        tastingCount: w.tastingCount
      })));
      
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