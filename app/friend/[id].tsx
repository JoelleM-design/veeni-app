import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatsBar } from '../../components/StatsBar';
import { WineCardCompact } from '../../components/WineCardCompact';
import { ActiveFiltersBar } from '../../components/ui/ActiveFiltersBar';
import { FilterModal } from '../../components/ui/FilterModal';
import { SearchFilterBar } from '../../components/ui/SearchFilterBar';
import { useUser } from '../../hooks/useUser';
import { useUserStats } from '../../hooks/useUserStats';
import { supabase } from '../../lib/supabase';
import { Wine } from '../../types/wine';

const colorIcons = {
  red: <Ionicons name="wine" size={16} color="#8B0000" />,
  white: <Ionicons name="wine" size={16} color="#FFD700" />,
  rose: <Ionicons name="wine" size={16} color="#FFB6C1" />,
  sparkling: <Ionicons name="sparkles" size={16} color="#C0C0C0" />,
};

const FILTER_OPTIONS = [
  { key: 'all', label: 'Tous', icon: 'list', color: '#FFFFFF' },
  { key: 'red', label: 'Rouge', icon: 'wine', color: '#FF4F8B' },
  { key: 'white', label: 'Blanc', icon: 'wine', color: '#FFF8DC' },
  { key: 'rose', label: 'Rosé', icon: 'wine', color: '#FFB6C1' },
  { key: 'sparkling', label: 'Effervescent', icon: 'wine', color: '#FFD700' },
];

const TABS = [
  { key: 'cellar', label: 'Sa cave' },
  { key: 'wishlist', label: 'Ses envies' },
  { key: 'tasted', label: 'Dégustés' },
];

type WineListTab = 'cellar' | 'wishlist' | 'tasted';

interface Friend {
  id: string;
  first_name: string;
  email: string;
  avatar?: string;
  created_at: string;
}

export default function FriendDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const [friend, setFriend] = useState<Friend | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupérer les stats de l'ami
  const { stats: friendStats, isLoading: statsLoading } = useUserStats(friend?.id || null);
  
  // Récupérer les vins de l'ami pour calculer sa préférence et les afficher
  const [friendWines, setFriendWines] = useState<any[]>([]);
  const [friendWishlistWines, setFriendWishlistWines] = useState<any[]>([]);
  const [friendTastedWines, setFriendTastedWines] = useState<any[]>([]);
  const [winesLoading, setWinesLoading] = useState(false);
  const [friendWineCards, setFriendWineCards] = useState<Wine[]>([]);
  
  // États pour la navigation et la recherche
  const [tab, setTab] = useState<WineListTab>('cellar');
  const [search, setSearch] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  useEffect(() => {
    const fetchFriend = async () => {
      if (!id) {
        setError('ID de l\'ami manquant');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('User')
          .select('id, first_name, email, avatar, created_at')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Erreur lors de la récupération de l\'ami:', error);
          setError('Impossible de charger les données de l\'ami');
        } else if (data) {
          setFriend(data);
        } else {
          setError('Ami non trouvé');
        }
      } catch (err) {
        console.error('Erreur lors de la récupération de l\'ami:', err);
        setError('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchFriend();
  }, [id]);

  // Récupérer les vins de l'ami pour calculer sa préférence
  useEffect(() => {
    const fetchFriendWines = async () => {
      if (!friend?.id) return;

      setWinesLoading(true);
      try {
        // Récupérer les vins de cave
        const { data: cellarData, error: cellarError } = await supabase
          .from('user_wine')
          .select(`
            id,
            amount,
            favorite,
            wine_id,
            wine (
              id,
              name,
              producer_id,
              year,
              wine_type,
              country_id,
              region,
              image_uri,
              producer (
                name
              ),
              country (
                name
              )
            )
          `)
          .eq('user_id', friend.id)
          .eq('origin', 'cellar');

        // Récupérer les vins de wishlist
        const { data: wishlistData, error: wishlistError } = await supabase
          .from('user_wine')
          .select(`
            id,
            amount,
            favorite,
            wine_id,
            wine (
              id,
              name,
              producer_id,
              year,
              wine_type,
              country_id,
              region,
              image_uri,
              producer (
                name
              ),
              country (
                name
              )
            )
          `)
          .eq('user_id', friend.id)
          .eq('origin', 'wishlist');

        // Récupérer les vins dégustés
        const { data: tastedData, error: tastedError } = await supabase
          .from('wine_history')
          .select(`
            id,
            wine_id,
            note,
            tasted_at,
            wine (
              id,
              name,
              producer_id,
              year,
              wine_type,
              country_id,
              region,
              image_uri,
              producer (
                name
              ),
              country (
                name
              )
            )
          `)
          .eq('user_id', friend.id)
          .eq('action', 'tasted')
          .order('tasted_at', { ascending: false });

        if (cellarError) {
          console.error('Erreur récupération vins cave ami:', cellarError);
        } else {
          console.log('🍷 Données vins cave ami récupérées:', cellarData);
          setFriendWines(cellarData || []);
        }

        if (wishlistError) {
          console.error('Erreur récupération vins wishlist ami:', wishlistError);
        } else {
          console.log('🍷 Données vins wishlist ami récupérées:', wishlistData);
          setFriendWishlistWines(wishlistData || []);
        }

        if (tastedError) {
          console.error('Erreur récupération vins dégustés ami:', tastedError);
        } else {
          console.log('🍷 Données vins dégustés ami récupérées:', tastedData);
          setFriendTastedWines(tastedData || []);
        }
      } catch (err) {
        console.error('Erreur inattendue vins ami:', err);
      } finally {
        setWinesLoading(false);
      }
    };

    fetchFriendWines();
  }, [friend?.id]);

  // Mettre à jour les cartes de vin selon l'onglet actif
  useEffect(() => {
    const updateWineCards = () => {
      let sourceData: any[] = [];
      
      if (tab === 'cellar') {
        sourceData = friendWines;
      } else if (tab === 'wishlist') {
        sourceData = friendWishlistWines;
      } else if (tab === 'tasted') {
        sourceData = friendTastedWines;
      }

      const wineCards: Wine[] = sourceData.map((item: any) => {
        const wineData = item.wine || item; // Pour les dégustés, les données sont directement dans item
        console.log('🍷 Mapping vin pour onglet', tab, ':', wineData?.name);
        
        return {
          id: wineData.id,
          name: wineData.name,
          vintage: wineData.year ? parseInt(wineData.year) : null,
          color: wineData.wine_type as 'red' | 'white' | 'rose' | 'sparkling',
          domaine: wineData.producer?.name || 'Domaine inconnu',
          region: wineData.region || '',
          country: wineData.country?.name || '',
          grapes: [], // Pas de données de cépages dans la table wine
          imageUri: wineData.image_uri,
          stock: tab === 'tasted' ? 0 : (item.amount || 0), // Les dégustés n'ont pas de stock
          origin: tab as 'cellar' | 'wishlist' | 'tasted',
          note: tab === 'tasted' ? item.note : null,
          personalComment: null,
          favorite: tab === 'tasted' ? false : (item.favorite || false), // Les dégustés n'ont pas de favori
          // Données spécifiques
          amount: tab === 'tasted' ? 0 : (item.amount || 0),
          user_wine_id: item.id,
          // Données spécifiques aux dégustés
          ...(tab === 'tasted' && {
            tasted_at: item.tasted_at,
            tastingCount: 1, // Chaque entrée = 1 dégustation
          })
        };
      });
      
      console.log('🍷 Cartes de vin finales pour onglet', tab, ':', wineCards);
      setFriendWineCards(wineCards);
    };

    updateWineCards();
  }, [tab, friendWines, friendWishlistWines, friendTastedWines]);

  // Calculer la préférence de l'ami
  const friendPreference = useMemo(() => {
    if (!friendWines || friendWines.length === 0) return null;
    
    const colorCounts = friendWines.reduce((acc, wine) => {
      const color = wine.wine?.wine_type;
      if (color) {
        acc[color] = (acc[color] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const mostCommonColor = Object.entries(colorCounts).reduce((a, b) => 
      colorCounts[a[0]] > colorCounts[b[0]] ? a : b
    )?.[0];

    return mostCommonColor;
  }, [friendWines]);

  // Stats calculées selon l'onglet actif
  const localStats = useMemo(() => {
    if (tab === 'cellar') {
      // Sa cave : somme des stocks
      const total = friendWines.reduce((sum, wine) => sum + (wine.amount || 0), 0);
      const red = friendWines
        .filter(w => w.wine?.wine_type === 'red')
        .reduce((sum, wine) => sum + (wine.amount || 0), 0);
      const white = friendWines
        .filter(w => w.wine?.wine_type === 'white')
        .reduce((sum, wine) => sum + (wine.amount || 0), 0);
      const rose = friendWines
        .filter(w => w.wine?.wine_type === 'rose')
        .reduce((sum, wine) => sum + (wine.amount || 0), 0);
      const sparkling = friendWines
        .filter(w => w.wine?.wine_type === 'sparkling')
        .reduce((sum, wine) => sum + (wine.amount || 0), 0);
      
      return { total, red, white, rose, sparkling };
    } else if (tab === 'wishlist') {
      // Ses envies : nombre de vins uniques
      const total = friendWishlistWines.length;
      const red = friendWishlistWines.filter(w => w.wine?.wine_type === 'red').length;
      const white = friendWishlistWines.filter(w => w.wine?.wine_type === 'white').length;
      const rose = friendWishlistWines.filter(w => w.wine?.wine_type === 'rose').length;
      const sparkling = friendWishlistWines.filter(w => w.wine?.wine_type === 'sparkling').length;
      
      return { total, red, white, rose, sparkling };
    } else {
      // Dégustés : nombre total de dégustations
      const total = friendTastedWines.length;
      const red = friendTastedWines.filter(w => w.wine?.wine_type === 'red').length;
      const white = friendTastedWines.filter(w => w.wine?.wine_type === 'white').length;
      const rose = friendTastedWines.filter(w => w.wine?.wine_type === 'rose').length;
      const sparkling = friendTastedWines.filter(w => w.wine?.wine_type === 'sparkling').length;
      
      return { total, red, white, rose, sparkling };
    }
  }, [friendWines, friendWishlistWines, friendTastedWines, tab]);

  // Filtrage des vins
  const filteredWines = friendWineCards.filter(wine => {
    const matchesSearch = wine.name.toLowerCase().includes(search.toLowerCase()) ||
      (wine.domaine && wine.domaine.toLowerCase().includes(search.toLowerCase())) ||
      (wine.region && wine.region.toLowerCase().includes(search.toLowerCase()));
    
    const matchesFilters = activeFilters.length === 0 ||
      activeFilters.some(filter => {
        switch (filter) {
          case 'all':
            return true;
          case 'red':
            return wine.color === 'red';
          case 'white':
            return wine.color === 'white';
          case 'rose':
            return wine.color === 'rose';
          case 'sparkling':
            return wine.color === 'sparkling';
          default:
            return false;
        }
      });
    
    return matchesSearch && matchesFilters;
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profil</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  if (error || !friend) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profil</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Ami non trouvé'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profile}>
          <View style={styles.avatarContainer}>
            {friend.avatar ? (
              <Image source={{ uri: friend.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {friend.first_name?.charAt(0).toUpperCase() || 'A'}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.name}>{friend.first_name || 'Utilisateur'}</Text>
          {!winesLoading && friendWines && friendWines.length > 0 && friendPreference ? (
            <View style={styles.preferenceContainer}>
              <Text style={styles.userPreference}>
                A une préférence pour le vin{' '}
              </Text>
              <View style={styles.preferenceIcon}>
                {colorIcons[friendPreference as keyof typeof colorIcons]}
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistiques</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {statsLoading ? '...' : (friendStats?.total_bottles_in_cellar || 0)}
              </Text>
              <Text style={styles.statLabel}>En cave</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {statsLoading ? '...' : (friendStats?.wishlist_count || 0)}
              </Text>
              <Text style={styles.statLabel}>À acheter</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {statsLoading ? '...' : (friendStats?.total_tasted_wines || 0)}
              </Text>
              <Text style={styles.statLabel}>Dégustés</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {statsLoading ? '...' : (friendStats?.favorite_wines_count || 0)}
              </Text>
              <Text style={styles.statLabel}>Favoris</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ses vins</Text>
          
          {/* Barre de navigation */}
          <View style={styles.tabRow}>
            {TABS.map(t => (
              <TouchableOpacity
                key={t.key}
                style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
                onPress={() => setTab(t.key as WineListTab)}
              >
                <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Stats bar */}
          <StatsBar 
            values={localStats} 
            totalLabel={tab === 'cellar' ? 'bouteilles' : tab === 'tasted' ? 'dégustations' : 'vins'}
          />

          {/* Barre de recherche et filtres */}
          <SearchFilterBar
            value={search}
            onChange={setSearch}
            onFilterPress={() => setFilterModalVisible(true)}
            placeholder={
              tab === 'cellar' ? 'Cherchez un vin dans sa cave ...' :
              tab === 'wishlist' ? 'Cherchez un vin dans ses envies ...' :
              'Cherchez un vin dans ses dégustations ...'
            }
            filterActive={activeFilters.length > 0}
          >
            <ActiveFiltersBar
              selectedFilters={activeFilters}
              options={FILTER_OPTIONS}
              onRemoveFilter={(filterKey) => {
                setActiveFilters(prev => prev.filter(f => f !== filterKey));
              }}
              onClearAll={() => setActiveFilters([])}
            />
          </SearchFilterBar>

          {/* Liste des vins */}
          {winesLoading ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>Chargement...</Text>
            </View>
          ) : filteredWines.length > 0 ? (
            <View style={styles.winesGrid}>
              {filteredWines.map((wine) => (
                <View key={wine.id} style={styles.wineCardContainer}>
                  <WineCardCompact
                    wine={wine}
                    readOnly={true}
                    onPress={() => router.push(`/wine/${wine.id}?readOnly=true&friendId=${friend?.id}`)}
                  />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptySection}>
              <Ionicons name="wine-outline" size={48} color="#666" />
              <Text style={styles.emptyText}>
                {tab === 'cellar' ? 'Aucun vin dans sa cave.' :
                 tab === 'wishlist' ? 'Aucun vin dans ses envies.' :
                 'Aucune dégustation trouvée.'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Modal de filtres */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        options={FILTER_OPTIONS}
        selectedFilters={activeFilters}
        onFilterChange={setActiveFilters}
        title="Filtres"
      />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  profile: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#999',
    marginBottom: 8,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#999',
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  preferenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  userPreference: {
    fontSize: 14,
    color: '#999',
  },
  preferenceIcon: {
    marginLeft: 4,
  },
  winesGrid: {
    flexDirection: 'column',
    marginTop: 8,
  },
  wineCardContainer: {
    marginBottom: 12,
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#393C40',
    borderWidth: 0,
  },
  tabLabel: {
    color: '#999',
    fontWeight: '500',
    fontSize: 14,
  },
  tabLabelActive: {
    color: '#FFF',
    fontWeight: '600',
  },
}); 