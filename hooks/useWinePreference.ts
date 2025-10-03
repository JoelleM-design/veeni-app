import { useMemo } from 'react';
import { VeeniColors } from '../constants/Colors';

export interface WinePreference {
  preference: string | null;
  colorIcons: Record<string, { name: string; color: string }>;
  colorLabels: Record<string, string>;
}

export function useWinePreference(wines: any[] | null | undefined): WinePreference {
  // Icônes pour les couleurs de vin (utilise les couleurs de l'app)
  const colorIcons = {
    red: { name: 'wine', color: VeeniColors.wine.red },
    white: { name: 'wine', color: VeeniColors.wine.white },
    rose: { name: 'wine', color: VeeniColors.wine.rose },
    sparkling: { name: 'wine', color: VeeniColors.wine.sparkling },
  };

  // Labels pour les couleurs
  const colorLabels = {
    red: 'rouge',
    white: 'blanc',
    rose: 'rosé',
    sparkling: 'pétillant',
  };

  // Calculer la préférence basée sur les vins de cave
  const preference = useMemo(() => {
    if (!wines || wines.length === 0) return null;
    
    console.log('🍷 Debug préférence - tous les vins reçus:', wines.map(wine => ({
      origin: wine.origin,
      hasWine: !!wine.wine,
      wineType: wine.wine?.wine_type,
      amount: wine.amount,
      stock: wine.stock
    })));
    
    // Filtrer les vins de cave uniquement
    const cellarWines = wines.filter(wine => wine.origin === 'cellar');
    console.log('🍷 Debug préférence - vins de cave filtrés:', cellarWines.length);
    if (cellarWines.length === 0) return null;
    
    console.log('🍷 Debug préférence - vins de cave:', cellarWines.map(wine => ({
      color: wine.color || wine.wine?.wine_type,
      stock: wine.stock || wine.amount || 0,
      origin: wine.origin
    })));
    
    // Compter les vins par couleur en tenant compte du stock
    const colorCount = cellarWines.reduce((acc, wine) => {
      // Gérer les deux formats : wine.color (profil perso) et wine.wine.wine_type (profil visité)
      const color = wine.color || wine.wine?.wine_type;
      if (color) {
        acc[color] = (acc[color] || 0) + (wine.stock || wine.amount || 0);
      }
      return acc;
    }, {} as Record<string, number>);
    
    console.log('🍷 Debug préférence - comptage par couleur:', colorCount);
    
    // Trouver la couleur dominante
    const dominantColor = Object.entries(colorCount).reduce((a, b) => 
      (colorCount[a[0]] || 0) > (colorCount[b[0]] || 0) ? a : b
    )?.[0];

    console.log('🍷 Debug préférence - couleur dominante:', dominantColor);
    return dominantColor;
  }, [wines]);

  return {
    preference,
    colorIcons,
    colorLabels
  };
}
