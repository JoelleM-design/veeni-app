import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatsHeader } from '../../components/StatsHeader';
import { TastingNoteModal } from '../../components/TastingNoteModal';
import { SearchFilterBar } from '../../components/ui/SearchFilterBar';
import { WineCard } from '../../components/WineCard';
import { useUser } from '../../hooks/useUser';
import { useWineHistory } from '../../hooks/useWineHistory';
import { useWines } from '../../hooks/useWines';
import { Wine } from '../../types/wine';
// import { useUser } from '../../constants/UserContext';
// import { useWines } from '../../constants/WineContext';

const FILTERS = [
  { key: 'red', label: 'Rouge' },
  { key: 'white', label: 'Blanc' },
  { key: 'rose', label: 'Rosé' },
  { key: 'sparkling', label: 'Effervescent' },
  { key: 'favorite', label: 'Coup de cœur' },
];

export default function MyCellarScreen() {
  const { wines, loading, error, updateWine } = useWines();
  const { user } = useUser();
  const { addTastingEvent } = useWineHistory();
  // const { wines, setWines } = useWines();
  // const { user } = useUser();
  const [search, setSearch] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [tastingModalVisible, setTastingModalVisible] = useState(false);
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null);
  const router = useRouter();

  // Calcul dynamique des stats
  const stats = useMemo(() => {
    if (!wines) return { red: 0, white: 0, rose: 0, sparkling: 0, total: 0 };
    return wines.filter(w => w.origin === 'cellar').reduce((acc, wine) => {
      acc[wine.color] += wine.stock;
      acc.total += wine.stock;
      return acc;
    }, { red: 0, white: 0, rose: 0, sparkling: 0, total: 0 });
  }, [wines]);

  // Stats labels en français
  const statsLabels = {
    red: 'rouges',
    white: 'blancs',
    rose: 'rosés',
    sparkling: 'pétillants',
  };

  // Callbacks pour modifier le stock
  const handleAddBottle = async (id: string) => {
    try {
      const wine = wines?.find(w => w.id === id);
      if (wine) {
        await updateWine(id, { stock: wine.stock + 1 });
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout de bouteille:', error);
    }
  };

  const handleRemoveBottle = async (id: string) => {
    try {
      const wine = wines?.find(w => w.id === id);
      if (wine && wine.stock > 0) {
        // Ouvrir le modal de dégustation
        setSelectedWine(wine);
        setTastingModalVisible(true);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de bouteille:', error);
    }
  };

  const handleTastingSave = async (rating: number, notes?: string) => {
    if (!selectedWine) return;

    try {
      // Réduire le stock
      await updateWine(selectedWine.id, { stock: selectedWine.stock - 1 });
      
      // Ajouter l'événement de dégustation
      await addTastingEvent(selectedWine.id, rating, notes);
      
      setSelectedWine(null);
      setTastingModalVisible(false);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la dégustation:', error);
    }
  };

  const handleToggleFavorite = async (wine: Wine) => {
    try {
      await updateWine(wine.id, { favorite: !wine.favorite });
    } catch (error) {
      console.error('Erreur lors du changement de favori:', error);
    }
  };

  const scrollY = useRef(new Animated.Value(0)).current;
  const HEADER_HEIGHT = 270; // avatar + stats + total bien visible, augmenté

  // Fonction de filtrage combinée
  const filteredWines = useMemo(() => {
    if (!wines) return [];
    return wines.filter(w => w.origin === 'cellar').filter(wine => {
      const matchesSearch = wine.name.toLowerCase().includes(search.toLowerCase()) ||
        wine.domaine.toLowerCase().includes(search.toLowerCase()) ||
        wine.region.toLowerCase().includes(search.toLowerCase());
      const matchesFilters = activeFilters.length === 0 || activeFilters.includes(wine.color) || (activeFilters.includes('favorite') && wine.favorite);
      return matchesSearch && matchesFilters;
    });
  }, [wines, activeFilters, search]);

  // Gestion du toggle des filtres
  const toggleFilter = (key: string) => {
    setActiveFilters(f => f.includes(key) ? f.filter(k => k !== key) : [...f, key]);
  };

  // DEBUG
  console.log('wines:', wines, 'loading:', loading, 'error:', error);

  if (loading) {
    return <View style={styles.container}><Text>Chargement…</Text></View>;
  }
  if (error) {
    return <View style={styles.container}><Text>Erreur : {error.message}</Text></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header avatar + stats masqué au scroll */}
      <Animated.View style={{
        opacity: scrollY.interpolate({
          inputRange: [0, 40],
          outputRange: [1, 0],
          extrapolate: 'clamp',
        }),
        height: scrollY.interpolate({
          inputRange: [0, 40],
          outputRange: [HEADER_HEIGHT, 0],
          extrapolate: 'clamp',
        }),
        overflow: 'hidden',
      }}>
        <StatsHeader
          avatarUri={user?.avatar || undefined}
          name={user?.first_name}
          stats={stats}
          totalLabel="bouteilles"
          showAvatar={true}
          spacing={32}
          onAvatarPress={() => router.push('/(tabs)/profile')}
        />
      </Animated.View>
      {/* Barre de recherche sticky */}
      <Animated.View style={{ zIndex: 10 }}>
        <SearchFilterBar
          value={search}
          onChange={setSearch}
          onFilterPress={() => setFilterModalVisible(true)}
          placeholder="Rechercher un vin..."
        />
      </Animated.View>
      {/* Liste des vins filtrés */}
      <Animated.ScrollView
        style={styles.wineList}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {filteredWines.length === 0 ? (
          <View style={{alignItems: 'center', marginTop: 40}}>
            <Text style={{color: '#B0B0B0', fontSize: 16, textAlign: 'center', marginBottom: 18}}>Ta cave est vide !
Ajoute ton premier vin pour commencer à la remplir.</Text>
            <TouchableOpacity
              style={{backgroundColor: '#FFF', borderRadius: 24, paddingVertical: 14, paddingHorizontal: 36, marginTop: 8}}
              onPress={() => router.push('/add')}
            >
              <Text style={{color: '#222', fontWeight: 'bold', fontSize: 16}}>Ajouter un vin</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredWines.map((wine) => (
            <WineCard
              key={wine.id}
              wine={wine}
              showStockButtons={true}
              onAddBottle={() => handleAddBottle(wine.id)}
              onRemoveBottle={() => handleRemoveBottle(wine.id)}
              onToggleFavorite={() => handleToggleFavorite(wine)}
              onPress={() => router.push(`/wine/${wine.id}`)}
            />
          ))
        )}
      </Animated.ScrollView>

      {/* Modal de dégustation */}
      <TastingNoteModal
        visible={tastingModalVisible}
        onClose={() => {
          setTastingModalVisible(false);
          setSelectedWine(null);
        }}
        onSave={handleTastingSave}
        wineName={selectedWine?.name || ''}
      />

      {/* Modal de filtres */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setFilterModalVisible(false)}>
          <Pressable style={styles.filterModal} onPress={() => {}}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filtres</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.filterOptions}>
              {FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterOption,
                    activeFilters.includes(filter.key) && styles.filterOptionActive
                  ]}
                  onPress={() => {
                    setActiveFilters(prev =>
                      prev.includes(filter.key)
                        ? prev.filter(f => f !== filter.key)
                        : [...prev, filter.key]
                    );
                  }}
                >
                  <Text style={[
                    styles.filterOptionText,
                    activeFilters.includes(filter.key) && styles.filterOptionTextActive
                  ]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => setActiveFilters([])}
            >
              <Text style={styles.clearFiltersText}>Effacer les filtres</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  avatarRow: {
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 8,
  },
  avatarPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '600',
  },
  stickySearchRow: {
    backgroundColor: '#222',
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    paddingVertical: 8,
  },
  filterBtn: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 8,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModal: {
    backgroundColor: '#333',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  closeButton: {
    fontSize: 24,
    color: '#999',
    padding: 4,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#444',
    borderWidth: 1,
    borderColor: '#666',
  },
  filterOptionActive: {
    backgroundColor: '#F6A07A',
    borderColor: '#F6A07A',
  },
  filterOptionText: {
    color: '#FFF',
    fontSize: 14,
  },
  filterOptionTextActive: {
    color: '#222',
    fontWeight: '600',
  },
  clearFiltersButton: {
    backgroundColor: '#444',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearFiltersText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  wineList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyText: {
    color: '#B0B0B0',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
}); 