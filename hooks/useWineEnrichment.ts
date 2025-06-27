// import * as SQLite from 'expo-sqlite';
import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Wine } from '../types/wine';

// Temporairement désactivé pour éviter l'erreur SQLite
// const db = SQLite.openDatabase('wines.db');

// Types pour les données de vin
interface WineData {
  id: string;
  name: string;
  vintage?: number;
  type: 'red' | 'white' | 'rosé' | 'sparkling';
  country?: string;
  region?: string;
  appellation?: string;
  grapes?: string[];
  producer?: string;
  photo: string;
}

interface OpenWineDataWine {
  id: string;
  name: string;
  producer: {
    name: string;
  };
  region: {
    name: string;
  };
  country: {
    name: string;
  };
  wine_type: string;
  year: string;
  grapes?: string[];
}

export function useWineEnrichment() {
  // Fonction pour rechercher dans OpenWineData (fichier JSON local)
  const searchInOpenWineData = useCallback(async (wineName: string, vintage?: number): Promise<OpenWineDataWine | null> => {
    try {
      console.log('Searching in OpenWineData for:', wineName, vintage);
      
      // Charger le fichier JSON d'OpenWineData
      const wines: OpenWineDataWine[] = require('../assets/data/wines.json');
      
      // Recherche exacte d'abord
      const exactMatch = wines.find(wine => 
        wine.name.toLowerCase() === wineName.toLowerCase()
      );
      
      if (exactMatch) {
        console.log('OpenWineData exact match:', exactMatch);
        return exactMatch;
      }
      
      // Si pas de match exact, recherche partielle plus stricte
      // On cherche des mots-clés dans le nom, pas juste des lettres communes
      const searchWords = wineName.toLowerCase().split(' ').filter(word => word.length > 2);
      
      if (searchWords.length === 0) {
        return null;
      }
      
      // Score de similarité basé sur les mots communs
      let bestMatch: OpenWineDataWine | null = null;
      let bestScore = 0;
      
      for (const wine of wines) {
        const wineWords = wine.name.toLowerCase().split(' ').filter(word => word.length > 2);
        const commonWords = searchWords.filter(word => wineWords.includes(word));
        const score = commonWords.length / Math.max(searchWords.length, wineWords.length);
        
        if (score > bestScore && score >= 0.5) { // Au moins 50% de mots communs
          bestScore = score;
          bestMatch = wine;
        }
      }
      
      if (bestMatch) {
        console.log('OpenWineData partial match (score:', bestScore, '):', bestMatch);
        return bestMatch;
      }
      
      console.log('No OpenWineData match found for:', wineName);
      return null;
    } catch (error) {
      console.error('Error searching in OpenWineData:', error);
      return null;
    }
  }, []);

  // Fonction pour rechercher dans Supabase
  const searchInSupabase = useCallback(async (wineName: string, vintage?: number): Promise<any[]> => {
    try {
      console.log('Searching in Supabase for:', wineName, vintage);
      
      let query = supabase
        .from('wine')
        .select('*')
        .ilike('name', `%${wineName}%`)
        .limit(5);

      if (vintage) {
        query = query.eq('year', vintage.toString());
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Supabase search error:', error);
        return [];
      }

      console.log('Supabase matches:', data);
      return data || [];
    } catch (error) {
      console.error('Error searching in Supabase:', error);
      return [];
    }
  }, []);

  // Fonction pour enrichir les données d'un vin
  const enrichWine = useCallback(async (ocrData: any): Promise<Wine> => {
    console.log('Enriching wine data:', ocrData);
    
    let enrichedData: Wine = {
      ...ocrData,
      // Garder les données OCR originales
      name: ocrData.name,
      vintage: ocrData.vintage,
      domaine: ocrData.domaine || ocrData.producer || 'Domaine inconnu',
      region: ocrData.region || '',
      appellation: ocrData.appellation || '',
      grapes: ocrData.grapes || [],
      color: ocrData.color || ocrData.type || 'red',
      imageUri: ocrData.imageUri,
      stock: ocrData.stock || 0,
      note: ocrData.note || 0,
      favorite: ocrData.favorite || false,
      origin: ocrData.origin || 'cellar',
      acidity: ocrData.acidity || 0,
      tannin: ocrData.tannin || 0,
      power: ocrData.power || 0,
      sweet: ocrData.sweet || 0,
      description: ocrData.description || '',
      createdAt: ocrData.createdAt || new Date().toISOString(),
      updatedAt: ocrData.updatedAt || new Date().toISOString(),
      history: ocrData.history || []
    };

    try {
      // 1. Recherche dans OpenWineData pour COMPLÉTER (pas remplacer)
      const openWineMatch = await searchInOpenWineData(ocrData.name, ocrData.vintage);
      if (openWineMatch) {
        // Compléter seulement les champs manquants ou vides
        enrichedData = {
          ...enrichedData,
          // Ne JAMAIS remplacer le nom original
          name: ocrData.name,
          // Compléter seulement si vide
          region: enrichedData.region || openWineMatch.region?.name || '',
          appellation: enrichedData.appellation || openWineMatch.region?.name || '',
          grapes: enrichedData.grapes.length > 0 ? enrichedData.grapes : (openWineMatch.grapes || []),
          domaine: enrichedData.domaine !== 'Domaine inconnu' ? enrichedData.domaine : (openWineMatch.producer?.name || 'Domaine inconnu'),
          color: enrichedData.color || openWineMatch.wine_type || 'red'
        };
        console.log('Enriched with OpenWineData (complementary):', enrichedData);
      }
      
      // 2. Recherche dans Supabase pour COMPLÉTER (pas remplacer)
      const supabaseMatches = await searchInSupabase(ocrData.name, ocrData.vintage);
      if (supabaseMatches && supabaseMatches.length > 0) {
        const bestMatch = supabaseMatches[0];
        // Compléter seulement les champs manquants
        enrichedData = {
          ...enrichedData,
          // Ne JAMAIS remplacer le nom original
          name: ocrData.name,
          // Compléter seulement si vide
          region: enrichedData.region || bestMatch.region?.name || '',
          appellation: enrichedData.appellation || bestMatch.region?.name || '',
          grapes: enrichedData.grapes.length > 0 ? enrichedData.grapes : (bestMatch.grapes || []),
          domaine: enrichedData.domaine !== 'Domaine inconnu' ? enrichedData.domaine : (bestMatch.producer?.name || 'Domaine inconnu'),
          color: enrichedData.color || bestMatch.wine_type || 'red'
        };
        console.log('Enriched with Supabase (complementary):', enrichedData);
      }

      console.log('Final enriched wine data:', enrichedData);
      return enrichedData;
    } catch (error) {
      console.error('Error enriching wine data:', error);
      return enrichedData;
    }
  }, [searchInOpenWineData, searchInSupabase]);

  return { enrichWine };
} 