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

  useEffect(() => {
    if (params.wines) {
      try {
        const wines = JSON.parse(params.wines as string) as Wine[];
        setDetectedWines(wines);
      } catch (e) {
        setDetectedWines([]);
      }
    }
  }, [params.wines]);

  // Fonctions d'action
  const handleAddToCellar = async (wine: Wine) => {
    try {
      await addWineToCellar({ ...wine, origin: 'cellar' as const, stock: 1 });
      setDetectedWines(prev => prev.filter(w => w.id !== wine.id));
      if (detectedWines.length <= 1) router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ajouter le vin à la cave');
    }
  };

  const handleAddToWishlist = async (wine: Wine) => {
    try {
      await addWineToWishlist({ ...wine, origin: 'wishlist' as const, stock: 0 });
      setDetectedWines(prev => prev.filter(w => w.id !== wine.id));
      if (detectedWines.length <= 1) router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ajouter le vin à la wishlist');
    }
  };

  const handleEditWine = (wine: Wine) => {
    router.push({
      pathname: '/wine/[id]',
      params: { id: wine.id, isFromOcr: 'true' }
    });
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
          <Ionicons name="arrow-back" size={24} color={VeeniColors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Vins détectés</Text>
        <Text style={styles.counter}>{detectedWines.length}</Text>
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
                isIncomplete={missingFields.length > 0}
                missingFields={missingFields}
              />
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.cellarButton]} 
                  onPress={() => handleAddToCellar(wine)}
                >
                  <Ionicons name="wine" size={20} color={VeeniColors.background} />
                  <Text style={styles.actionButtonText}>Ajouter à ma cave</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.wishlistButton]} 
                  onPress={() => handleAddToWishlist(wine)}
                >
                  <Ionicons name="heart" size={20} color={VeeniColors.background} />
                  <Text style={styles.actionButtonText}>Ajouter à ma wishlist</Text>
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
}); 