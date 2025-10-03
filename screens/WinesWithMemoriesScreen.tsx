import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WineCard } from '../components/WineCard';
import WineDetailsModal from '../components/WineDetailsModal';
import { useUser } from '../hooks/useUser';
import { useWinesWithMemories } from '../hooks/useWinesWithMemories';
import { WineWithMemory } from '../types/memory';

interface WinesWithMemoriesScreenProps {
  userId: string;
  viewerId?: string;
}

export default function WinesWithMemoriesScreen({ userId, viewerId }: WinesWithMemoriesScreenProps) {
  const router = useRouter();
  const { user: currentUser } = useUser();
  const { winesWithMemories, loading, error } = useWinesWithMemories(userId, viewerId);
  const [filter, setFilter] = useState<'all' | 'created' | 'mentioned'>('all');
  
  // État pour la modale de fiche de vin
  const [wineModalVisible, setWineModalVisible] = useState(false);
  const [selectedWine, setSelectedWine] = useState<WineWithMemory | null>(null);

  // Déterminer si l'utilisateur peut modifier (propre profil)
  const canModify = currentUser?.id === userId;

  // Filtrer les vins selon le filtre sélectionné
  const filteredWines = winesWithMemories.filter(wineWithMemory => {
    switch (filter) {
      case 'created':
        return wineWithMemory.isCreator;
      case 'mentioned':
        return wineWithMemory.isMentioned && !wineWithMemory.isCreator;
      case 'all':
      default:
        return true;
    }
  });

  const handleWinePress = (wineWithMemory: WineWithMemory) => {
    console.log('🍷 Ouverture modale fiche vin:', {
      wineId: wineWithMemory.wine.id,
      wineName: wineWithMemory.wine.name,
      userId, // ID de la personne dont on regarde les souvenirs
      viewerId, // ID de la personne qui regarde
      memoryId: wineWithMemory.memory.id
    });
    
    // Ouvrir la modale avec le vin sélectionné
    setSelectedWine(wineWithMemory);
    setWineModalVisible(true);
  };

  const handleCloseWineModal = () => {
    setWineModalVisible(false);
    setSelectedWine(null);
  };

  const renderWineCard = ({ item }: { item: WineWithMemory }) => {
    const { wine, memory, isCreator, isMentioned } = item;
    
    return (
      <TouchableOpacity
        style={styles.wineCardContainer}
        onPress={() => handleWinePress(item)}
      >
        <WineCard
          wine={wine}
          onPress={() => handleWinePress(item)}
          showMemoryIndicator={true}
          memoryCount={1} // Chaque vin a exactement 1 souvenir ici
        />
        
      </TouchableOpacity>
    );
  };

  const renderFilterButton = (filterType: 'all' | 'created' | 'mentioned', label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterType && styles.filterButtonActive
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Text style={[
        styles.filterButtonText,
        filter === filterType && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#F6A07A" />
        <Text style={styles.loadingText}>Chargement des souvenirs...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Erreur: {error}</Text>
      </View>
    );
  }

  if (winesWithMemories.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="wine" size={48} color="#666" />
        <Text style={styles.emptyText}>Aucun souvenir trouvé</Text>
        <Text style={styles.emptySubtext}>
          Créez des souvenirs ou demandez à vos amis de vous mentionner !
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filtres */}
      <View style={styles.filtersContainer}>
        {renderFilterButton('all', 'Tous')}
        {renderFilterButton('created', 'Créés')}
        {renderFilterButton('mentioned', 'Mentionnés')}
      </View>

      {/* Liste des vins */}
      <FlatList
        data={filteredWines}
        renderItem={renderWineCard}
        keyExtractor={(item) => `${item.wine.id}-${item.memory.id}`}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Modale pour la fiche de vin détaillée */}
      {selectedWine && (
        <WineDetailsModal
          visible={wineModalVisible}
          onClose={handleCloseWineModal}
          wineId={selectedWine.wine.id}
          viewerUserId={viewerId}
          contextOwnerUserId={selectedWine.memory.user_id}
          context={viewerId && viewerId !== selectedWine.memory.user_id ? 'friend' : 'user'}
          wineData={undefined}
          returnToOcr={undefined}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  loadingText: {
    color: '#FFF',
    fontSize: 16,
    marginTop: 16,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#333',
  },
  filterButtonActive: {
    backgroundColor: '#555',
  },
  filterButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#ccc',
  },
  listContainer: {
    padding: 16,
  },
  wineCardContainer: {
    marginBottom: 0,
    position: 'relative',
  },
  mentionedBadge: {
    backgroundColor: '#2196F3',
  },
  bothBadge: {
    backgroundColor: '#FF9800',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
});
