import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProfileStatsBar } from '../../components/ProfileStatsBar';
import { SearchFilterBar } from '../../components/ui/SearchFilterBar';
import { WineCard } from '../../components/WineCard';
import { BorderRadius, Spacing, Typography, VeeniColors } from '../../constants/Colors';
import { useProfileStats } from '../../hooks/useProfileStats';
import { useUser } from '../../hooks/useUser';
import { useWineHistory } from '../../hooks/useWineHistory';
import { useWines } from '../../hooks/useWines';

const HEADER_MAX_HEIGHT = 280; // Hauteur maximale du header
const HEADER_MIN_HEIGHT = 110; // Hauteur minimale du header (barre de navigation + search bar)
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

export default function ProfileScreen() {
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const { wines, loading: winesLoading, error: winesError } = useWines();
  const { user, loading: userLoading, error: userError, updateUser, updateAvatar } = useUser();
  const { stats: profileStats, loading: statsLoading, error: statsError } = useProfileStats(user?.id);
  const { history: wineHistory, loading: historyLoading, getRecentTastings } = useWineHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{
    color?: string;
    region?: string;
    vintage?: string;
  }>({});

  // Animations pour le header
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const searchBarTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -HEADER_SCROLL_DISTANCE + 60],
    extrapolate: 'clamp',
  });

  // Utiliser l'historique des dégustations depuis le nouveau hook
  const tastingHistory = useMemo(() => {
    if (!wineHistory || !wines) return [];
    
    const recentTastings = getRecentTastings(20); // Limiter à 20 dégustations récentes
    
    return recentTastings.map(tasting => {
      // Trouver le vin correspondant
      const wine = wines.find(w => w.id === tasting.wineId);
      if (!wine) return null;
      
      return {
        wine,
        date: tasting.eventDate,
        type: tasting.eventType as 'tasted' | 'removed',
        rating: tasting.rating,
        previousStock: tasting.previousAmount
      };
    }).filter((item): item is NonNullable<typeof item> => item !== null);
  }, [wineHistory, wines, getRecentTastings]);

  const filteredHistory = useMemo(() => {
    if (!tastingHistory) return [];
    
    return tastingHistory.filter(item => {
      const wine = item.wine;
      if (!wine) return false;
      
      const matchesSearch = wine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wine.domaine.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wine.region.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesColor = !activeFilters.color || wine.color === activeFilters.color;
      const matchesRegion = !activeFilters.region || wine.region === activeFilters.region;
      const matchesVintage = !activeFilters.vintage || wine.vintage.toString() === activeFilters.vintage;
      
      return matchesSearch && matchesColor && matchesRegion && matchesVintage;
    });
  }, [tastingHistory, searchQuery, activeFilters]);

  // Calcul de la préférence dynamique basée sur les vins
  const userPreference = useMemo(() => {
    if (!wines || wines.length === 0) return null;
    
    const cellarWines = wines.filter(wine => wine.origin === 'cellar');
    if (cellarWines.length === 0) return null;
    
    // Compter les vins par couleur
    const colorCount = cellarWines.reduce((acc, wine) => {
      acc[wine.color] = (acc[wine.color] || 0) + wine.stock;
      return acc;
    }, {} as Record<string, number>);
    
    // Trouver la couleur dominante
    const dominantColor = Object.entries(colorCount).reduce((a, b) => 
      (colorCount[a[0]] || 0) > (colorCount[b[0]] || 0) ? a : b
    )[0];
    
    return dominantColor;
  }, [wines]);

  // Icônes pour les couleurs de vin
  const colorIcons = {
    red: <Ionicons name="wine" size={16} color="#FF4F8B" />,
    white: <Ionicons name="cafe" size={16} color="#FFF8DC" />,
    rose: <Ionicons name="color-palette" size={16} color="#FFB6C1" />,
    sparkling: <Ionicons name="wine" size={16} color="#FFD700" />,
  };

  // Labels pour les couleurs
  const colorLabels = {
    red: 'rouge',
    white: 'blanc',
    rose: 'rosé',
    sparkling: 'effervescent',
  };

  const handleAvatarPress = async () => {
    // TODO: Implémenter la sélection d'image
  };

  const handleFriendsPress = () => {
    router.push('/(tabs)/friends');
  };

  const handleSettingsPress = () => {
    router.push('/(tabs)/settings');
  };

  // Filtrer les vins récents (dégustés)
  const recentWines = wines?.filter(wine => wine.origin === 'cellar').slice(0, 5) || [];

  if (winesLoading || userLoading || statsLoading || historyLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (winesError || userError || statsError) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Erreur : {winesError?.message || userError?.message || statsError?.message}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header fixe */}
      <View style={styles.fixedHeader}>
        <TouchableOpacity 
          style={styles.headerIconLeft}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Profil</Text>
        
        <TouchableOpacity 
          style={styles.headerIconRight}
          onPress={() => router.push('/(tabs)/settings')}
        >
          <Ionicons name="settings-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Contenu scrollable */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section profil */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarUnified}>
            {user?.avatar ? (
              <View style={styles.avatarPlaceholderUnified}>
                <Text style={styles.avatarInitialUnified}>
                  {user.first_name?.charAt(0).toUpperCase()}
                </Text>
              </View>
            ) : (
              <View style={styles.avatarPlaceholderUnified}>
                <Text style={styles.avatarInitialUnified}>
                  {user?.first_name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
          </View>
          
          <Text style={styles.userName}>{user?.first_name || 'Utilisateur'}</Text>
          
          {/* Préférence dynamique */}
          {userPreference ? (
            <View style={styles.preferenceContainer}>
              <Text style={styles.userPreference}>
                A une préférence pour le vin{' '}
              </Text>
              <View style={styles.preferenceIcon}>
                {colorIcons[userPreference as keyof typeof colorIcons]}
              </View>
              <Text style={styles.userPreference}>
                {' '}{colorLabels[userPreference as keyof typeof colorLabels]}
              </Text>
            </View>
          ) : (
            <Text style={styles.userPreference}>Amateur de vins</Text>
          )}
        </View>

        {/* Barre de statistiques */}
        <View style={styles.statsBar}>
          <ProfileStatsBar
            tastedCount={profileStats.tastedCount}
            favoritesCount={profileStats.favoritesCount}
            visitsCount={profileStats.visitsCount}
            loading={statsLoading}
            error={statsError}
          />
        </View>

        {/* Bouton "Voir mes amis" */}
        <TouchableOpacity 
          style={styles.friendsButton}
          onPress={() => router.push('/(tabs)/friends')}
        >
          <Text style={styles.friendsButtonText}>Voir mes amis</Text>
        </TouchableOpacity>

        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <SearchFilterBar
            value={searchQuery}
            onChange={setSearchQuery}
            onFilterPress={() => setShowFilterModal(true)}
            placeholder="Rechercher dans mon historique..."
          />
        </View>

        {/* Section historique */}
        {filteredHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Historique des dégustations</Text>
            
            {filteredHistory.map((item, index) => (
              <WineCard
                key={`${item.wine.id}-${index}`}
                wine={item.wine}
                onPress={() => router.push(`/wine/${item.wine.id}`)}
                showStockButtons={false}
                footer={
                  <View style={styles.historyFooter}>
                    <Text style={styles.historyDate}>
                      Dégusté le {new Date(item.date).toLocaleDateString('fr-FR')}
                    </Text>
                    {item.rating && (
                      <Text style={styles.historyRating}>
                        Note : {item.rating}/5
                      </Text>
                    )}
                    {item.type === 'removed' && item.previousStock && (
                      <Text style={styles.historyStock}>
                        Stock précédent : {item.previousStock}
                      </Text>
                    )}
                  </View>
                }
              />
            ))}
          </View>
        )}

        {/* Message si pas d'historique */}
        {filteredHistory.length === 0 && !historyLoading && (
          <View style={styles.section}>
            <Text style={styles.emptyText}>
              Aucune dégustation dans ton historique
            </Text>
          </View>
        )}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  fixedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#222',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerIconLeft: {
    padding: 8,
  },
  headerIconRight: {
    padding: 8,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  avatarUnified: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  avatarPlaceholderUnified: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitialUnified: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '600',
  },
  userName: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  userPreference: {
    color: '#999',
    fontSize: 14,
    marginTop: 4,
  },
  statsBar: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.base,
    width: '100%',
  },
  searchContainer: {
    marginBottom: Spacing.base,
    width: '100%',
  },
  friendsButton: {
    backgroundColor: VeeniColors.button.primary,
    marginHorizontal: Spacing.base,
    marginVertical: Spacing.base,
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius['2xl'],
    alignItems: 'center',
    width: '90%',
  },
  friendsButtonText: {
    color: VeeniColors.background.primary,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
  },
  section: {
    flex: 1,
    paddingHorizontal: Spacing.base,
  },
  sectionTitle: {
    color: VeeniColors.text.primary,
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.semibold,
    marginBottom: Spacing.base,
  },
  emptyText: {
    color: VeeniColors.text.tertiary,
    fontSize: Typography.size.base,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  loadingText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 24,
  },
  errorText: {
    color: '#F6A07A',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 24,
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
    maxHeight: '80%',
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
  filterSection: {
    marginBottom: 20,
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
    borderColor: 'transparent',
  },
  filterCircleActive: {
    borderColor: '#F6A07A',
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#444',
    borderWidth: 1,
    borderColor: 'transparent',
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
  preferenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  preferenceIcon: {
    marginHorizontal: 4,
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
  },
  historyDate: {
    color: '#999',
    fontSize: 14,
  },
  historyStock: {
    color: '#F6A07A',
    fontSize: 14,
  },
  historyRating: {
    color: '#999',
    fontSize: 14,
  },
}); 