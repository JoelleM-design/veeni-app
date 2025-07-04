import { useMemo } from 'react';
import { useWines } from '../../hooks/useWines';
import { Wine } from '../types/wine';

export type WineListTab = 'cellar' | 'wishlist' | 'tasted';

function useWineList(tab: WineListTab): Wine[] {
  const { wines } = useWines();

  return useMemo(() => {
    if (!wines) return [];
    if (tab === 'cellar') {
      return wines.filter(w => w.origin === 'cellar');
    }
    if (tab === 'wishlist') {
      return wines.filter(w => w.origin === 'wishlist');
    }
    if (tab === 'tasted') {
      // On considère qu'un vin dégusté a une propriété history non vide ou un flag spécifique (à adapter selon le modèle)
      return wines.filter(w => w.history && w.history.length > 0);
    }
    return [];
  }, [wines, tab]);
}

export default useWineList; 