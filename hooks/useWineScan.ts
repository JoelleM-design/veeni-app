import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Wine } from '../types/wine';
import { useWineEnrichment } from './useWineEnrichment';

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
  name: string;
  vintage?: number;
  type: string;
  country?: string;
  region?: string;
  appellation?: string;
  grapes?: string[];
  producer?: string;
}

export interface WineScanResult {
  wines: Wine[];
  loading: boolean;
  error: string | null;
  fallbackMode: boolean;
}

export interface PhotoItem {
  id: string;
  uri: string;
  ocr?: WineScanResult;
  isScanning: boolean;
}

export interface WineScanState {
  photos: PhotoItem[];
  error: string | null;
}

export function useWineScan() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [scannedWines, setScannedWines] = useState<Wine[]>([]);
  const { enrichWine } = useWineEnrichment();

  const scanWineImages = useCallback(async (imageUris: string[]) => {
    setLoading(true);
    setError(null);
    setFallbackMode(false);

    try {
      console.log('Début du scan OCR pour', imageUris.length, 'images');

      // 1. Conversion des images en base64
      const base64Images = await Promise.all(
        imageUris.map(async (uri) => {
          try {
            const response = await fetch(uri);
            const blob = await response.blob();
            return new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const base64 = reader.result as string;
                // Enlever le préfixe "data:image/jpeg;base64,"
                const base64Data = base64.split(',')[1];
                resolve(base64Data);
              };
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          } catch (err) {
            console.error('Erreur conversion image:', err);
            throw new Error('Impossible de convertir l\'image');
          }
        })
      );

      // 2. Appel à la fonction OCR Supabase
      const { data: session } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      
      if (session.session) {
        headers.Authorization = `Bearer ${session.session.access_token}`;
      }

      const { data, error: ocrError } = await supabase.functions.invoke('ocr-scan', {
        body: { image: base64Images },
        headers
      });

      if (ocrError) {
        console.error('Erreur OCR:', ocrError);
        // Au lieu de faire échouer, on active le mode fallback
        setFallbackMode(true);
        setError('L\'analyse automatique n\'a pas fonctionné. Veuillez saisir les informations manuellement.');
        return;
      }

      if (!data || !data.success) {
        console.error('Réponse OCR invalide:', data);
        setFallbackMode(true);
        setError('L\'analyse automatique n\'a pas fonctionné. Veuillez saisir les informations manuellement.');
        return;
      }

      console.log('Résultat OCR reçu:', data);

      // 3. Traitement des vins trouvés
      const enrichedWines: Wine[] = [];
      
      // Si on a moins de vins que d'images, créer des vins manuels pour les images restantes
      const winesToProcess = data.wines || [];
      const totalWines = Math.max(winesToProcess.length, imageUris.length);
      
      for (let i = 0; i < totalWines; i++) {
        try {
          const wineData = winesToProcess[i];
          const imageUri = imageUris[i];
          
          // Si pas de vin trouvé pour cette image, créer un vin manuel
          if (!wineData) {
            const manualWine: Wine = {
              id: `manual-${Date.now()}-${i}`,
              name: `Vin ${i + 1}`,
              domaine: 'Domaine inconnu',
              vintage: new Date().getFullYear(),
              color: 'red',
              region: '',
              appellation: '',
              grapes: [],
              power: 0,
              tannin: 0,
              sweet: 0,
              acidity: 0,
              favorite: false,
              note: 0,
              stock: 0,
              origin: 'cellar',
              history: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              imageUri: imageUri
            };
            enrichedWines.push(manualWine);
            continue;
          }

          // Créer un vin basique avec les données OCR
          const basicWine: Partial<Wine> = {
            id: wineData.id,
            name: wineData.name,
            domaine: wineData.appellation || 'Domaine inconnu',
            vintage: wineData.vintage || new Date().getFullYear(),
            color: wineData.type || 'red',
            region: wineData.region || '',
            appellation: wineData.appellation || '',
            grapes: wineData.grapes || [],
            power: 0,
            tannin: 0,
            sweet: 0,
            acidity: 0,
            favorite: false,
            note: 0,
            stock: 0,
            origin: 'cellar',
            history: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            imageUri: imageUri // Associer l'image correspondante
          };

          // Enrichissement avec les données OpenWineData
          const enrichedData = await enrichWine(basicWine);
          const enrichedWine: Wine = {
            id: enrichedData.id,
            name: enrichedData.name,
            domaine: typeof enrichedData.domaine === 'string' ? enrichedData.domaine : 'Domaine inconnu',
            vintage: enrichedData.vintage,
            color: enrichedData.color,
            region: typeof enrichedData.region === 'string' ? enrichedData.region : '',
            appellation: typeof enrichedData.appellation === 'string' ? enrichedData.appellation : '',
            grapes: Array.isArray(enrichedData.grapes) ? enrichedData.grapes : [],
            power: enrichedData.power || 0,
            tannin: enrichedData.tannin || 0,
            sweet: enrichedData.sweet || 0,
            acidity: enrichedData.acidity || 0,
            description: typeof enrichedData.description === 'string' ? enrichedData.description : '',
            imageUri: typeof enrichedData.imageUri === 'string' ? enrichedData.imageUri : undefined,
            favorite: enrichedData.favorite || false,
            note: enrichedData.note || 0,
            stock: enrichedData.stock || 0,
            origin: enrichedData.origin || 'cellar',
            history: Array.isArray(enrichedData.history) ? enrichedData.history : [],
            createdAt: typeof enrichedData.createdAt === 'string' ? enrichedData.createdAt : new Date().toISOString(),
            updatedAt: typeof enrichedData.updatedAt === 'string' ? enrichedData.updatedAt : new Date().toISOString()
          };
          enrichedWines.push(enrichedWine);

        } catch (enrichError) {
          console.error('Erreur enrichissement vin:', enrichError);
          // Créer un vin basique si l'enrichissement échoue
          const fallbackWine: Wine = {
            id: `fallback-${Date.now()}-${i}`,
            name: `Vin ${i + 1}`,
            domaine: 'Domaine inconnu',
            vintage: new Date().getFullYear(),
            color: 'red',
            region: '',
            appellation: '',
            grapes: [],
            power: 0,
            tannin: 0,
            sweet: 0,
            acidity: 0,
            favorite: false,
            note: 0,
            stock: 0,
            origin: 'cellar',
            history: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            imageUri: imageUris[i]
          };
          enrichedWines.push(fallbackWine);
        }
      }

      setScannedWines(enrichedWines);
      console.log('Scan OCR terminé avec succès:', enrichedWines.length, 'vins trouvés');

    } catch (err) {
      console.error('Erreur lors du scan OCR:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setFallbackMode(true);
    } finally {
      setLoading(false);
    }
  }, [enrichWine]);

  const createManualWine = useCallback(async (wineData: Partial<Wine>) => {
    setLoading(true);
    setError(null);

    try {
      const basicWine: Partial<Wine> = {
        id: `manual-${Date.now()}`,
        name: wineData.name || 'Vin manuel',
        domaine: wineData.domaine || 'Domaine inconnu',
        vintage: wineData.vintage || new Date().getFullYear(),
        color: wineData.color || 'red',
        region: wineData.region || '',
        appellation: wineData.appellation || '',
        grapes: wineData.grapes || [],
        power: wineData.power || 0,
        tannin: wineData.tannin || 0,
        sweet: wineData.sweet || 0,
        acidity: wineData.acidity || 0,
        favorite: wineData.favorite || false,
        note: wineData.note || 0,
        stock: wineData.stock || 0,
        origin: wineData.origin || 'cellar',
        history: wineData.history || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        imageUri: wineData.imageUri || undefined
      };

      const enrichedData = await enrichWine(basicWine);
      const enrichedWine: Wine = {
        id: enrichedData.id,
        name: enrichedData.name,
        domaine: typeof enrichedData.domaine === 'string' ? enrichedData.domaine : 'Domaine inconnu',
        vintage: enrichedData.vintage,
        color: enrichedData.color,
        region: typeof enrichedData.region === 'string' ? enrichedData.region : '',
        appellation: typeof enrichedData.appellation === 'string' ? enrichedData.appellation : '',
        grapes: Array.isArray(enrichedData.grapes) ? enrichedData.grapes : [],
        power: enrichedData.power || 0,
        tannin: enrichedData.tannin || 0,
        sweet: enrichedData.sweet || 0,
        acidity: enrichedData.acidity || 0,
        description: typeof enrichedData.description === 'string' ? enrichedData.description : '',
        imageUri: typeof enrichedData.imageUri === 'string' ? enrichedData.imageUri : undefined,
        favorite: enrichedData.favorite || false,
        note: enrichedData.note || 0,
        stock: enrichedData.stock || 0,
        origin: enrichedData.origin || 'cellar',
        history: Array.isArray(enrichedData.history) ? enrichedData.history : [],
        createdAt: typeof enrichedData.createdAt === 'string' ? enrichedData.createdAt : new Date().toISOString(),
        updatedAt: typeof enrichedData.updatedAt === 'string' ? enrichedData.updatedAt : new Date().toISOString()
      };
      setScannedWines([enrichedWine]);
      setFallbackMode(false);

      console.log('Vin manuel créé avec succès');

    } catch (err) {
      console.error('Erreur création vin manuel:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du vin');
    } finally {
      setLoading(false);
    }
  }, [enrichWine]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setFallbackMode(false);
    setScannedWines([]);
  }, []);

  return {
    wines: scannedWines,
    loading,
    error,
    fallbackMode,
    scanWineImages,
    createManualWine,
    reset
  };
} 