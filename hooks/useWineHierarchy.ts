import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface WineCountry {
  id: string;
  name: string;
  flag_emoji: string;
}

export interface WineRegion {
  id: string;
  name: string;
}

export interface WineAppellation {
  id: string;
  name: string;
}

export interface WineGrape {
  id: string;
  name: string;
  color: string;
  is_primary: boolean;
}

export interface WineHierarchy {
  country_id: string;
  country_name: string;
  region_id: string;
  region_name: string;
  appellation_id: string;
  appellation_name: string;
  grapes: WineGrape[];
}

export function useWineHierarchy() {
  const [countries, setCountries] = useState<WineCountry[]>([]);
  const [regions, setRegions] = useState<WineRegion[]>([]);
  const [appellations, setAppellations] = useState<WineAppellation[]>([]);
  const [grapes, setGrapes] = useState<WineGrape[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Récupérer tous les pays
  const fetchCountries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('wine_countries')
        .select('id, name, flag_emoji')
        .order('name');
      
      if (error) throw error;
      setCountries(data || []);
    } catch (err) {
      console.error('Erreur récupération pays:', err);
      setError('Erreur lors du chargement des pays');
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les régions d'un pays
  const fetchRegionsByCountry = async (countryName: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_regions_by_country', {
        country_name: countryName
      });
      
      if (error) throw error;
      setRegions(data || []);
    } catch (err) {
      console.error('Erreur récupération régions:', err);
      setError('Erreur lors du chargement des régions');
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les appellations d'une région
  const fetchAppellationsByRegion = async (regionName: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_appellations_by_region', {
        region_name: regionName
      });
      
      if (error) throw error;
      setAppellations(data || []);
    } catch (err) {
      console.error('Erreur récupération appellations:', err);
      setError('Erreur lors du chargement des appellations');
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les cépages d'une appellation
  const fetchGrapesByAppellation = async (appellationName: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_grapes_by_appellation', {
        appellation_name: appellationName
      });
      
      if (error) throw error;
      setGrapes(data || []);
    } catch (err) {
      console.error('Erreur récupération cépages:', err);
      setError('Erreur lors du chargement des cépages');
    } finally {
      setLoading(false);
    }
  };

  // Récupérer la hiérarchie complète
  const fetchWineHierarchy = async (country: string, region: string, appellation: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_wine_hierarchy', {
        wine_country: country,
        wine_region: region,
        wine_appellation: appellation
      });
      
      if (error) throw error;
      return data?.[0] || null;
    } catch (err) {
      console.error('Erreur récupération hiérarchie:', err);
      setError('Erreur lors du chargement de la hiérarchie');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Réinitialiser les sélections
  const resetSelections = () => {
    setRegions([]);
    setAppellations([]);
    setGrapes([]);
  };

  // Charger les pays au montage
  useEffect(() => {
    fetchCountries();
  }, []);

  return {
    countries,
    regions,
    appellations,
    grapes,
    loading,
    error,
    fetchCountries,
    fetchRegionsByCountry,
    fetchAppellationsByRegion,
    fetchGrapesByAppellation,
    fetchWineHierarchy,
    resetSelections
  };
}
