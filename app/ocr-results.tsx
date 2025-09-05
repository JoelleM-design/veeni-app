import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WineCard } from '../components/WineCard';
import { VeeniColors } from '../constants/Colors';
import { useWines } from '../hooks/useWines';
import type { Wine } from '../types/wine';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

function getMissingFields(wine: Wine) {
  const missing: string[] = [];
  if (!wine.name) missing.push('name');
  if (!wine.vintage) missing.push('vintage');
  if (!wine.region) missing.push('region');
  if (!wine.grapes || wine.grapes.length === 0) missing.push('grapes');
  return missing;
}

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
    // Pour les vins OCR, on ne peut pas les éditer directement car ils n'existent pas encore en DB
    // On va plutôt les ajouter à la cave avec stock 0 et naviguer vers l'édition
    Alert.alert(
      'Modifier le vin',
      'Pour modifier les informations du vin, ajoutez-le d\'abord à votre cave, puis vous pourrez l\'éditer.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Ajouter à ma cave', 
          onPress: () => handleAddToCellar({ ...wine, stock: 0 })
        }
      ]
    );
  };

  if (detectedWines.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={VeeniColors.text.primary} />
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
          <Ionicons name="arrow-back" size={24} color={VeeniColors.text.primary} />
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
        <Text style={styles.instructions}>
          Ajoutez directement le vin à votre cave ou vos envies. Vous pourrez modifier les informations après l'ajout.
        </Text>
      </View>
      
      <ScrollView style={styles.winesList} showsVerticalScrollIndicator={false}>
        {detectedWines.map((wine) => {
          const missingFields = getMissingFields(wine);
          return (
            <View key={wine.id} style={styles.wineCardContainer}>
              <WineCard 
                wine={wine} 
                onPress={() => handleEditWine(wine)}
                showStockButtons={false}
                readOnly={true}
              />
              
              {missingFields.length > 0 && (
                <View style={styles.missingFieldsWarning}>
                  <Ionicons name="warning-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.missingFieldsText}>
                    Informations manquantes : {missingFields.join(', ')}
                  </Text>
                </View>
              )}
              
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
                  <Ionicons name="wine" size={20} color={VeeniColors.background} />
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
                  <Ionicons name="heart" size={20} color={VeeniColors.background} />
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
    backgroundColor: VeeniColors.background,
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
    color: VeeniColors.text,
  },
  counter: {
    fontSize: 16,
    color: VeeniColors.textSecondary,
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
    backgroundColor: VeeniColors.accent.primary,
  },
  wishlistButton: {
    backgroundColor: VeeniColors.accent.secondary,
  },
  disabledButton: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: VeeniColors.background,
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
    color: VeeniColors.textSecondary,
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
    color: VeeniColors.textSecondary,
    marginBottom: 10,
  },
  instructions: {
    fontSize: 14,
    color: VeeniColors.textSecondary,
    lineHeight: 20,
  },
  missingFieldsWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0', // Light orange background
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 15,
    marginBottom: 15,
  },
  missingFieldsText: {
    fontSize: 13,
    color: '#FFFFFF', // Orange text
    marginLeft: 8,
  },
}); 