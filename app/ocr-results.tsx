import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WineCard } from '../components/WineCard';
import { VeeniColors } from '../constants/Colors';
import { useWines } from '../hooks/useWines';
import type { Wine } from '../types/wine';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');


export default function OcrResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addWineToCellar, addWineToWishlist } = useWines();

  // Initialiser les vins détectés à partir des params (résultat OCR)
  const [detectedWines, setDetectedWines] = useState<Wine[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (params.wines) {
      try {
        const wines = JSON.parse(params.wines as string) as Wine[];
        // S'assurer que les vins OCR ont des IDs temporaires
        const processedWines = wines.map(wine => ({
          ...wine,
          id: wine.id.startsWith('ocr-') ? wine.id : `ocr-${wine.id}`
        }));
        setDetectedWines(processedWines);
      } catch (e) {
        console.error('Erreur parsing vins OCR:', e);
        setDetectedWines([]);
      }
    }
  }, [params.wines]);

  // Gérer les retours depuis l'écran de détails avec vin modifié
  useEffect(() => {
    if (params.updatedWineId && params.wines) {
      try {
        const updatedWines = JSON.parse(params.wines as string);
        const updatedWine = updatedWines[0]; // Le vin modifié
        if (updatedWine) {
          setDetectedWines(prev => prev.map(wine => 
            wine.id === updatedWine.id ? updatedWine : wine
          ));
          console.log('🍷 Vin OCR mis à jour:', updatedWine);
        }
      } catch (e) {
        console.error('Erreur parsing vin mis à jour:', e);
      }
    }
  }, [params.updatedWineId, params.wines]);

  // Fonction pour nettoyer les fichiers locaux
  const cleanupLocalFiles = async (wine: Wine) => {
    if (wine.imageUri && wine.imageUri.startsWith('file://')) {
      try {
        const { deleteAsync } = await import('expo-file-system');
        await deleteAsync(wine.imageUri, { idempotent: true });
        console.log('🗑️ Fichier OCR local supprimé:', wine.imageUri);
      } catch (err) {
        console.warn('⚠️ Impossible de supprimer le fichier OCR local:', err);
      }
    }
  };

  // Fonctions d'action
  const handleAddToCellar = async (wine: Wine) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      console.log('Ajout à la cave:', wine);
      
      await addWineToCellar({ ...wine, origin: 'cellar' as const, stock: 1 });
      
      // Nettoyer les fichiers locaux après ajout réussi
      await cleanupLocalFiles(wine);
      
      setDetectedWines(prev => prev.filter(w => w.id !== wine.id));
      
      // Si c'était le dernier vin, retourner à "Mes vins"
      if (detectedWines.length <= 1) {
        router.replace('/(tabs)/mes-vins');
      }
    } catch (error) {
      console.error('Erreur ajout cave:', error);
      const errorMessage = error instanceof Error ? error.message : 'Impossible d\'ajouter le vin à la cave';
      Alert.alert('Attention', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddToWishlist = async (wine: Wine) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      console.log('Ajout à la wishlist:', wine);
      
      await addWineToWishlist({ ...wine, origin: 'wishlist' as const, stock: 0 });
      
      // Nettoyer les fichiers locaux après ajout réussi
      await cleanupLocalFiles(wine);
      
      setDetectedWines(prev => prev.filter(w => w.id !== wine.id));
      
      // Si c'était le dernier vin, retourner à "Mes vins"
      if (detectedWines.length <= 1) {
        router.replace('/(tabs)/mes-vins');
      }
    } catch (error) {
      console.error('Erreur ajout wishlist:', error);
      const errorMessage = error instanceof Error ? error.message : 'Impossible d\'ajouter le vin à la wishlist';
      Alert.alert('Attention', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditWine = (wine: Wine) => {
    // Naviguer directement vers l'écran de détails du vin OCR
    // Le vin n'est pas encore ajouté à la cave, c'est juste pour vérifier/modifier les infos
    console.log('🍷 Navigation vers fiche détaillée:', wine);
    router.push({
      pathname: `/wine/${wine.id}`,
      params: { 
        isFromOcr: 'true',
        returnToOcr: 'true', // Indiquer qu'on doit revenir à l'écran OCR
        wineData: JSON.stringify(wine) // Passer les données du vin OCR
      }
    });
  };

  if (detectedWines.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Vins détectés</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Aucun vin détecté</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Vins détectés</Text>
        <Text style={styles.counter}>{detectedWines.length}</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.subtitle}>
          {detectedWines.length === 1 
            ? '1 vin détecté' 
            : `${detectedWines.length} vins détectés`
          }
        </Text>
      </View>
      
      <ScrollView style={styles.winesList} showsVerticalScrollIndicator={false}>
        {detectedWines.map((wine) => {
          return (
            <View key={wine.id} style={styles.wineCardContainer}>
              <WineCard 
                wine={wine} 
                onPress={() => handleEditWine(wine)}
                showStockButtons={false}
                readOnly={false}
              />
              
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[
                    styles.actionButton, 
                    styles.cellarButton,
                    isProcessing && styles.disabledButton
                  ]} 
                  onPress={() => handleAddToCellar(wine)}
                  disabled={isProcessing}
                >
                  <Ionicons name="wine" size={20} color="#000000" />
                  <Text style={styles.actionButtonText}>
                    {isProcessing ? 'Ajout...' : 'Ma cave'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.actionButton, 
                    styles.wishlistButton,
                    isProcessing && styles.disabledButton
                  ]} 
                  onPress={() => handleAddToWishlist(wine)}
                  disabled={isProcessing}
                >
                  <Ionicons name="heart" size={20} color="#000000" />
                  <Text style={styles.actionButtonText}>
                    {isProcessing ? 'Ajout...' : 'Mes envies'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  counter: {
    fontSize: 16,
    color: '#CCCCCC',
    fontWeight: '500',
  },
  winesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  wineCardContainer: {
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  cellarButton: {
    backgroundColor: '#FFFFFF',
  },
  wishlistButton: {
    backgroundColor: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: VeeniColors.accent.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: VeeniColors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 10,
  },
}); 