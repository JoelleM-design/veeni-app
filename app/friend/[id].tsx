import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Modal, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ProfileStatsBar from '../../components/ProfileStatsBar';
import { StatsBar } from '../../components/StatsBar';
import { WineCard } from '../../components/WineCard';
import { WinePreferenceDisplay } from '../../components/WinePreferenceDisplay';
import { ActiveFiltersBar } from '../../components/ui/ActiveFiltersBar';
import { FilterModal } from '../../components/ui/FilterModal';
import { SearchFilterBar } from '../../components/ui/SearchFilterBar';
import { useProfileStats } from '../../hooks/useProfileStats';
import { useUser } from '../../hooks/useUser';
import { useUserStats } from '../../hooks/useUserStats';
import { useWineHistory } from '../../hooks/useWineHistory';
import { useWines } from '../../hooks/useWines';
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
  { key: 'sparkling', label: 'Pétillant', icon: 'wine', color: '#FFD700' },
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
  const { wines: myWines } = useWines();
  const myWineIdSet = useMemo(() => new Set((myWines || []).map((w: any) => String(w.id))), [myWines]);
  const [friend, setFriend] = useState<Friend | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupérer les stats de l'ami
  const { stats: friendStats, isLoading: statsLoading } = useUserStats(friend?.id || null);
  // Active le fallback pour éviter 0 si la RPC ne remonte rien (affiche au moins les bonnes tendances)
  const { stats: socialStatsFriend } = useProfileStats(friend?.id || null, user?.id);
  
  // Récupérer les vins de l'ami pour calculer sa préférence et les afficher
  const [friendWines, setFriendWines] = useState<any[]>([]);
  const [friendWishlistWines, setFriendWishlistWines] = useState<any[]>([]);
  const [friendTastedWines, setFriendTastedWines] = useState<any[]>([]);
  const [winesLoading, setWinesLoading] = useState(false);
  const [friendWineCards, setFriendWineCards] = useState<Wine[]>([]);
  
  // Vins de cave spécifiquement pour la préférence (toujours les vins de cave)
  const [friendCellarWines, setFriendCellarWines] = useState<Wine[]>([]);
  
  // Utiliser useWineHistory pour l'ami (pour les stats correctes)
  const { history: friendWineHistory, loading: friendHistoryLoading } = useWineHistory(friend?.id || null);
  
  // États pour la navigation et la recherche
  const [tab, setTab] = useState<WineListTab>('cellar');
  const [search, setSearch] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  // Contrôle d'affichage de la barre de recherche (temporaire)
  const showSearchBar = false;
  
  // États pour le menu
  const [menuVisible, setMenuVisible] = useState(false);

  // Fonctions du menu
  const handleRemoveFriend = async () => {
    if (!friend?.id || !user?.id) return;
    
    Alert.alert(
      'Supprimer cet ami',
      `Êtes-vous sûr de vouloir supprimer ${friend.first_name} de vos amis ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('friend')
                .delete()
                .or(`and(user_id.eq.${user.id},friend_id.eq.${friend.id}),and(user_id.eq.${friend.id},friend_id.eq.${user.id})`);
              
              if (error) {
                console.error('Erreur suppression amitié:', error);
                Alert.alert('Erreur', 'Impossible de supprimer cet ami');
              } else {
                Alert.alert('Succès', `${friend.first_name} a été supprimé de vos amis`);
                router.back();
              }
            } catch (err) {
              console.error('Erreur inattendue:', err);
              Alert.alert('Erreur', 'Une erreur inattendue s\'est produite');
            }
          }
        }
      ]
    );
  };

  const handleShareProfile = async () => {
    if (!friend) return;
    
    try {
      const message = `👤 Découvre le profil de ${friend.first_name} sur Veeni\nhttps://veeni.app`;
      
      console.log('👤 Tentative de partage profil:', message);
      const result = await Share.share({
        message,
      });
      console.log('👤 Résultat partage:', result);
    } catch (err) {
      console.error('Erreur partage:', err);
      Alert.alert('Erreur', 'Impossible de partager le profil');
    }
  };


  const handleReport = () => {
    Alert.alert(
      'Signaler le profil',
      `Voulez-vous signaler le profil de ${friend?.first_name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Signaler',
          style: 'destructive',
          onPress: () => {
            // TODO: Implémenter la logique de signalement
            Alert.alert('Signalement', 'Le profil a été signalé. Merci pour votre retour.');
          }
        }
      ]
    );
  };

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
      if (!friend?.id) {
        console.log('🍷 Debug - Pas d\'ami défini, arrêt de la récupération');
        return;
      }

      console.log('🍷 Debug - Récupération des vins pour l\'ami:', friend.id);
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

        // Récupérer les événements liés aux dégustations (tasted + stock_change)
        const { data: tastedData, error: tastedError } = await supabase
          .from('wine_history')
          .select(`
            id,
            wine_id,
            rating,
            notes,
            event_date,
            event_type,
            previous_amount,
            new_amount,
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
          .eq('event_type', 'stock_change')
          .order('event_date', { ascending: false });

        if (cellarError) {
          console.error('❌ Erreur récupération vins cave ami:', cellarError);
        } else {
          console.log('✅ Données vins cave ami récupérées:', cellarData?.length || 0, 'vins');
          console.log('🍷 Détail vins cave ami:', cellarData?.map(w => ({
            id: w.wine?.id,
            name: w.wine?.name,
            wine_type: w.wine?.wine_type,
            amount: w.amount,
            origin: 'cellar'
          })));
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
          console.log('🍷 Données vins dégustés ami récupérées (brut):', tastedData?.length || 0);
          const raw = (tastedData || []) as any[];
          // Filtrer: garder seulement les stock_change qui réduisent le stock
          const filtered = raw.filter((e: any) => {
            return e.event_type === 'stock_change' && Number(e.previous_amount) > Number(e.new_amount);
          });
          // Dédupliquer par vin (conserver l'événement le plus récent)
          const byWine = new Map<string, any>();
          for (const e of filtered) {
            const key = String(e.wine?.id || e.wine_id);
            const prev = byWine.get(key);
            if (!prev || new Date(e.event_date).getTime() > new Date(prev.event_date).getTime()) {
              byWine.set(key, e);
            }
          }
          const deduped = Array.from(byWine.values());
          console.log('🍷 Données vins dégustés ami filtrées+dédupliquées:', deduped.length);
          setFriendTastedWines(deduped);
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
        // Utiliser la liste filtrée/dédupliquée
        sourceData = friendTastedWines;
      }

      console.log('🍷 Debug updateWineCards - tab:', tab, 'sourceData length:', sourceData.length);

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
          note: tab === 'tasted' ? (item.rating ?? null) : null,
          personalComment: null,
          favorite: tab === 'tasted' ? false : (item.favorite || false), // Les dégustés n'ont pas de favori
          // Données spécifiques
          amount: tab === 'tasted' ? 0 : (item.amount || 0),
          user_wine_id: item.id,
          // Données spécifiques aux dégustés
          ...(tab === 'tasted' && {
            tasted_at: item.event_date,
            tastingCount: 1, // Chaque entrée = 1 dégustation
          })
        };
      });
      
      console.log('🍷 Cartes de vin finales pour onglet', tab, ':', wineCards);
      console.log('🍷 Debug friendWineCards mis à jour avec origin:', wineCards.map(w => ({ name: w.name, origin: w.origin })));
      setFriendWineCards(wineCards);
      
      // Créer les vins de cave spécifiquement pour la préférence
      if (tab === 'cellar') {
        const cellarWines = wineCards.filter(wine => wine.origin === 'cellar');
        console.log('🍷 Debug friendCellarWines mis à jour:', cellarWines.map(w => ({ name: w.name, origin: w.origin })));
        setFriendCellarWines(cellarWines);
      }
    };

    updateWineCards();
  }, [tab, friendWines, friendWishlistWines, friendTastedWines]);


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
        // Dégustés: s'appuyer sur la liste déjà filtrée/dédupliquée
        const events = friendTastedWines;
        const total = events.length;
        const red = events.filter(event => event.wine?.wine_type === 'red').length;
        const white = events.filter(event => event.wine?.wine_type === 'white').length;
        const rose = events.filter(event => event.wine?.wine_type === 'rose').length;
        const sparkling = events.filter(event => event.wine?.wine_type === 'sparkling').length;
        return { total, red, white, rose, sparkling };
    }
  }, [friendWines, friendWishlistWines, friendTastedWines, friendWineCards, friendWineHistory, tab]);

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
        <Text style={styles.headerTitle}>Profil de {friend.first_name || 'Utilisateur'}</Text>
        <TouchableOpacity 
          onPress={() => setMenuVisible(!menuVisible)} 
          style={styles.menuButton}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Menu modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.menuContainer}>
              <View style={styles.menuOptions}>
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    handleShareProfile();
                  }}
                >
                  <Ionicons name="share" size={20} color="#FFFFFF" />
                  <Text style={styles.menuItemText}>Partager le profil</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    handleRemoveFriend();
                  }}
                >
                  <Ionicons name="person-remove" size={20} color="#FF4444" />
                  <Text style={[styles.menuItemText, { color: '#FF4444' }]}>Supprimer cet ami</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.menuItem, styles.menuItemLast]}
                  onPress={() => {
                    setMenuVisible(false);
                    handleReport();
                  }}
                >
                  <Ionicons name="flag" size={20} color="#FF4444" />
                  <Text style={[styles.menuItemText, { color: '#FF4444' }]}>Signaler</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

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
          <WinePreferenceDisplay 
            wines={friendCellarWines} 
            winesLoading={winesLoading}
            style={styles.preferenceContainer}
            textStyle={styles.userPreference}
            iconStyle={styles.preferenceIcon}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistiques</Text>
          <ProfileStatsBar userId={friend?.id} viewerId={user?.id} />
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
            selectedColor={activeFilters.length === 1 ? (activeFilters[0] as any) : null}
            onColorPress={(color) => {
              setActiveFilters((prev) => {
                if (prev.length === 1 && prev[0] === color) return [];
                return [color];
              });
            }}
          />

          {/* Barre de recherche et filtres */}
          {showSearchBar && (
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
          )}

          {/* Liste des vins */}
          {winesLoading ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>Chargement...</Text>
            </View>
          ) : filteredWines.length > 0 ? (
            <View style={styles.winesGrid}>
              {filteredWines.map((wine, index) => (
                <View key={`${wine.id}-${index}`} style={styles.wineCardContainer}>
                  <WineCard
                    wine={wine}
                    readOnly={true}
                    showActions={false}
                    showStockButtons={false}
                    showStock={tab === 'cellar'}
                    onPress={() => {
                      console.log('[FriendProfile] Click carte', { wineId: wine.id, friendId: friend?.id });
                      router.push({ pathname: '/wine/[id]', params: { id: wine.id, readOnly: 'true', friendId: friend?.id || '' } });
                    }}
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
  // Styles du menu
  menuButton: {
    padding: 8,
    borderRadius: 20,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-start',
    paddingTop: 80,
  },
  menuContainer: {
    backgroundColor: '#2a2a2a',
    margin: 20,
    borderRadius: 12,
    maxHeight: 300,
    minWidth: 250,
    position: 'absolute',
    top: 20,
    right: 20,
    left: 'auto',
    width: 220,
  },
  menuOptions: {
    // Supprimé gap pour utiliser paddingVertical sur les items
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    minHeight: 56,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
}); 