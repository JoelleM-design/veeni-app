import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WineCard } from '../components/WineCard';
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
    const { wine, memory } = wineWithMemory;
    
    // Déterminer qui est le propriétaire du vin et qui regarde
    const wineOwnerId = memory.user_id; // Le créateur du souvenir est le propriétaire du vin
    const isViewingOwnWines = viewerId === wineOwnerId;
    
    console.log('🍷 Navigation vers fiche vin:', {
      wineId: wine.id,
      wineName: wine.name,
      userId, // ID de la personne dont on regarde les souvenirs
      viewerId, // ID de la personne qui regarde
      wineOwnerId, // ID du propriétaire du vin
      isViewingOwnWines,
      memoryId: memory.id
    });
    
    try {
      // Navigation vers la fiche de vin avec l'onglet souvenir actif
      router.push({
        pathname: '/wine/[id]',
        params: {
          id: wine.id,
          tab: 'memories',
          // Si on regarde les vins d'un ami, passer en mode lecture seule avec l'ID du propriétaire du vin
          ...(viewerId && !isViewingOwnWines && { 
            readOnly: 'true', 
            friendId: wineOwnerId 
          })
        }
      });
      console.log('✅ Navigation lancée');
    } catch (error) {
      console.error('❌ Erreur navigation:', error);
    }
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
        
        {/* Indicateur de type de souvenir */}
        <View style={styles.memoryTypeIndicator}>
          {isCreator && (
            <View style={[styles.typeBadge, styles.createdBadge]}>
              <Ionicons name="create" size={12} color="#FFFFFF" />
              <Text style={styles.badgeText}>Créé</Text>
            </View>
          )}
          {isMentioned && !isCreator && (
            <View style={[styles.typeBadge, styles.mentionedBadge]}>
              <Ionicons name="person" size={12} color="#FFFFFF" />
              <Text style={styles.badgeText}>Mentionné</Text>
            </View>
          )}
          {isCreator && isMentioned && (
            <View style={[styles.typeBadge, styles.bothBadge]}>
              <Ionicons name="people" size={12} color="#FFFFFF" />
              <Text style={styles.badgeText}>Créé + Mentionné</Text>
            </View>
          )}
        </View>
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
    backgroundColor: '#F6A07A',
  },
  filterButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFF',
  },
  listContainer: {
    padding: 16,
  },
  wineCardContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  memoryTypeIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  createdBadge: {
    backgroundColor: '#4CAF50',
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
