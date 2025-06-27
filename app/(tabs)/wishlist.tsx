import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatsBar } from '../../components/StatsBar';
import { SearchFilterBar } from '../../components/ui/SearchFilterBar';
import { WineCard } from '../../components/WineCard';
import { useWines } from '../../hooks/useWines';
import { Wine } from '../../types/wine';

export default function WishlistScreen() {
  const router = useRouter();
  const { wines, loading, error, addWineToCellar, updateWine } = useWines();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{
    color?: string;
    region?: string;
    vintage?: string;
  }>({});

  const wishlistWines = useMemo(() => {
    if (!wines) return [];
    return wines.filter(wine => wine.origin === 'wishlist');
  }, [wines]);

  const stats = useMemo(() => {
    if (!wishlistWines) return { total: 0, red: 0, white: 0, rose: 0, sparkling: 0 };
    
    return wishlistWines.reduce((acc, wine) => {
      acc.total += 1;
      acc[wine.color] += 1;
      return acc;
    }, { total: 0, red: 0, white: 0, rose: 0, sparkling: 0 });
  }, [wishlistWines]);

  const filteredWines = useMemo(() => {
    if (!wishlistWines) return [];
    
    return wishlistWines.filter(wine => {
      const matchesSearch = wine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wine.domaine.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wine.region.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesColor = !activeFilters.color || wine.color === activeFilters.color;
      const matchesRegion = !activeFilters.region || wine.region === activeFilters.region;
      const matchesVintage = !activeFilters.vintage || wine.vintage.toString() === activeFilters.vintage;
      
      return matchesSearch && matchesColor && matchesRegion && matchesVintage;
    });
  }, [wishlistWines, searchQuery, activeFilters]);

  const handleToggleFavorite = async (wine: Wine) => {
    try {
      await updateWine(wine.id, { favorite: !wine.favorite });
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleAddToCellar = async (wine: Wine) => {
    try {
      await addWineToCellar(wine);
    } catch (error) {
      console.error('Error adding wine to cellar:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Erreur : {error.message}</Text>
      </View>
    );
  }

  if (!filteredWines.length) {
    return (
      <View style={styles.container}>
        <StatsBar values={stats} />
        <SearchFilterBar value={searchQuery} onChange={setSearchQuery} onFilterPress={() => setShowFilterModal(true)} placeholder="Rechercher un vin..." />
        <Text style={{ color: '#B0B0B0', textAlign: 'center', marginTop: 40 }}>Aucun vin trouvé.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Liste d'envie</Text>
      </View>

      <StatsBar values={stats} />

      <SearchFilterBar
        value={searchQuery}
        onChange={setSearchQuery}
        onFilterPress={() => setShowFilterModal(true)}
        placeholder="Rechercher un vin..."
      />

      <ScrollView style={styles.wineList}>
        {filteredWines.map(wine => (
          <WineCard
            key={wine.id}
            wine={wine}
            onPress={() => router.push(`/wine/${wine.id}`)}
            onToggleFavorite={() => handleToggleFavorite(wine)}
            showStockButtons={false}
          />
        ))}
      </ScrollView>

      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModal}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filtres</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Couleur</Text>
              <View style={styles.filterOptions}>
                {['red', 'white', 'rose', 'sparkling'].map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.filterCircle,
                      { backgroundColor: color === 'red' ? '#FF4F8B' : color === 'white' ? '#FFF8DC' : color === 'rose' ? '#FFB6C1' : '#FFD700' },
                      activeFilters.color === color && styles.filterCircleActive
                    ]}
                    onPress={() => setActiveFilters(prev => ({
                      ...prev,
                      color: prev.color === color ? undefined : color
                    }))}
                  />
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Région</Text>
              <View style={styles.filterOptions}>
                {['Bordeaux', 'Bourgogne', 'Champagne', 'Loire', 'Rhône'].map(region => (
                  <TouchableOpacity
                    key={region}
                    style={[
                      styles.filterOption,
                      activeFilters.region === region && styles.filterOptionActive
                    ]}
                    onPress={() => setActiveFilters(prev => ({
                      ...prev,
                      region: prev.region === region ? undefined : region
                    }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      activeFilters.region === region && styles.filterOptionTextActive
                    ]}>
                      {region}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Millésime</Text>
              <View style={styles.filterOptions}>
                {['2023', '2022', '2021', '2020', '2019'].map(vintage => (
                  <TouchableOpacity
                    key={vintage}
                    style={[
                      styles.filterOption,
                      activeFilters.vintage === vintage && styles.filterOptionActive
                    ]}
                    onPress={() => setActiveFilters(prev => ({
                      ...prev,
                      vintage: prev.vintage === vintage ? undefined : vintage
                    }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      activeFilters.vintage === vintage && styles.filterOptionTextActive
                    ]}>
                      {vintage}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  wineList: {
    flex: 1,
    paddingHorizontal: 16,
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
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  filterCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#666',
  },
  filterCircleActive: {
    borderColor: '#F6A07A',
    borderWidth: 3,
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
}); 