import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useFriendWines } from '../hooks/useFriendWines';
import { useWineHasMemories } from '../hooks/useWineHasMemories';
import { useWineHistory } from '../hooks/useWineHistory';
import { useWineMemoriesOptimized } from '../hooks/useWineMemoriesOptimized';
import { useWines } from '../hooks/useWines';
import WineMemoriesScreenV2 from '../screens/WineMemoriesScreenV2';
import WineDetailsTabs from './WineDetailsTabs';

interface WineDetailsModalContentProps {
  wineId: string;
  viewerUserId?: string;
  contextOwnerUserId?: string;
  context?: 'user' | 'friend';
  wineData?: string;
  returnToOcr?: string;
  onBack?: () => void;
}

export default function WineDetailsModalContent({
  wineId,
  viewerUserId,
  contextOwnerUserId,
  context,
  wineData,
  returnToOcr,
  onBack,
}: WineDetailsModalContentProps) {
  const { wines, updateWine, addWineToWishlist, addWineToCellar, removeWineFromWishlist, removeWineFromCellar } = useWines();
  const { tastedWines, fetchTastedWines, fetchHistory, addTasting } = useWineHistory();
  
  // Mode lecture pour les profils visités
  const isReadOnlyMode = contextOwnerUserId !== viewerUserId;
  const friendId = isReadOnlyMode ? contextOwnerUserId : undefined;
  const isVisitedReadOnly = isReadOnlyMode && !!friendId;

  // Récupérer les vins de l'ami si on est en mode lecture seule
  const { wines: friendWines, tastedWines: friendTastedWines, loading: friendWinesLoading } = useFriendWines(isVisitedReadOnly ? friendId : null);
  
  // État pour la navigation par onglets
  const [activeTab, setActiveTab] = useState<'info' | 'memories'>('memories');
  
  // Récupérer les données du vin
  const allWines = [
    ...wines,
    ...tastedWines.map((entry) => ({
      ...entry.wine,
      lastTastedAt: entry.lastTastedAt,
      tastingCount: entry.tastingCount,
      origin: 'tasted',
    })),
  ];

  // Si on est en mode lecture seule, utiliser les vins de l'ami
  if (isVisitedReadOnly) {
    const friendWinesList = [
      ...friendWines,
      ...friendTastedWines.map((entry) => ({
        ...entry.wine,
        lastTastedAt: entry.lastTastedAt,
        tastingCount: entry.tastingCount,
        origin: 'tasted',
      })),
    ];

    // Si on accède via l'onglet souvenirs, ajouter aussi les vins du viewer (pour les souvenirs partagés)
    if (activeTab === 'memories') {
      allWines.push(...friendWinesList);
    }
  }

  // Trouver le vin
  const wine = allWines.find(w => w?.id === wineId);
  
  if (!wine) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Vin non trouvé</Text>
      </View>
    );
  }

  // Récupérer les données de mémoire
  const { memories, loading: memoriesLoading } = useWineMemoriesOptimized(wineId);
  const { hasMemories, memoriesCount } = useWineHasMemories(wineId);

  return (
    <View style={styles.container}>
      {/* Header avec bouton retour */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{wine.name}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Onglets */}
      <WineDetailsTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isReadOnlyMode={isReadOnlyMode}
        hasMemories={hasMemories}
      />

      {/* Contenu */}
      {activeTab === 'memories' ? (
        <WineMemoriesScreenV2
          wineId={wineId}
          wineName={wine.name}
          isReadOnlyMode={isReadOnlyMode}
          isEmbedded={true}
        />
      ) : (
        <ScrollView style={styles.content}>
          <Text style={styles.placeholderText}>Contenu de la fiche vin</Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 16,
    textAlign: 'center',
  },
  placeholderText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
});

