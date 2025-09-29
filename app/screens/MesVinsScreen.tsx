import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatsBar } from '../../components/StatsBar';
import TastingConfirmationModal from '../../components/TastingConfirmationModal';
import TastingHistoryModal from '../../components/TastingHistoryModal';
import { ActiveFiltersBar } from '../../components/ui/ActiveFiltersBar';
import { FilterModal } from '../../components/ui/FilterModal';
import { SearchFilterBar } from '../../components/ui/SearchFilterBar';
import { WineCard } from '../../components/WineCard';
import { useFriendsWithWine } from '../../hooks/useFriendsWithWine';
import { useSocialStats } from '../../hooks/useSocialStats';
import { useStats } from '../../hooks/useStats';
import { useUser } from '../../hooks/useUser';
import { useWineHistory } from '../../hooks/useWineHistory';
import { useWineList } from '../../hooks/useWineList';
import { useWines } from '../../hooks/useWines';
import { supabase } from '../../lib/supabase';

type WineListTab = 'cellar' | 'wishlist' | 'tasted';

const FILTER_OPTIONS = [
  { key: 'all', label: 'Tous', icon: 'list', color: '#FFFFFF' },
  { key: 'red', label: 'Rouge', icon: 'wine', color: '#FF4F8B' },
  { key: 'white', label: 'Blanc', icon: 'wine', color: '#FFF8DC' },
  { key: 'rose', label: 'Rosé', icon: 'wine', color: '#FFB6C1' },
  { key: 'sparkling', label: 'Effervescent', icon: 'wine', color: '#FFD700' },
];

const TABS = [
  { key: 'cellar', label: 'Ma cave' },
  { key: 'wishlist', label: 'Mes envies' },
  { key: 'tasted', label: 'Dégustés' },
];

// Composant pour une carte de vin avec informations sociales
const WineCardWithSocial = ({ 
  wine, 
  tab, 
  onWinePress,
  onOpenTastingModal,
  setRefreshKey,
}: {
  wine: any;
  tab: string;
  onWinePress: (wineId: string, wineData?: any) => void;
  onOpenTastingModal: (wine: any) => void;
  setRefreshKey: (value: React.SetStateAction<number>) => void;
}) => {
  const { wines, updateWine } = useWines();
  const { refreshStats } = useStats(); // Nouveau hook SWR
  const freshWine = wines.find(w => w?.id === wine.id);
  const wineToDisplay = freshWine || wine;
  const wineId = wineToDisplay?.id;
  if (!wineId) return null;

  const handleToggleFavorite = async () => {
    console.log('🔄 handleToggleFavorite appelé sur carte:', { wineId, currentFavorite: wineToDisplay.favorite, newFavorite: !wineToDisplay.favorite });
    try {
      await updateWine(wineId, { favorite: !wineToDisplay.favorite });
      // Forcer un léger refresh visuel sans fetch
      setRefreshKey(prev => prev + 1);
      await refreshStats(); // Refresh stats after favorite toggle
      console.log('✅ handleToggleFavorite terminé avec succès sur carte');
    } catch (error) {
      console.error('❌ Erreur lors du toggle favorite sur carte:', error);
    }
  };

  const handleAddBottle = async () => {
    const currentStock = wineToDisplay.stock || 0;
    console.log('🔄 handleAddBottle appelé sur carte:', { currentStock, wineId });
    try {
      console.log('🔄 Tentative de mise à jour du stock...');
      await updateWine(wineId, { stock: currentStock + 1 });
      console.log('🔄 Stock mis à jour, refresh des stats...');
      await refreshStats(); // Refresh stats after stock change
      setRefreshKey(prev => prev + 1); // Force re-render comme dans handleConfirmTasting
      console.log('✅ handleAddBottle terminé avec succès sur carte');
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de bouteille sur carte:', error);
    }
  };

  const handleRemoveBottle = async () => {
    const currentStock = wineToDisplay.stock || 0;
    if (currentStock <= 0) return;
    
    console.log('🔄 handleRemoveBottle appelé sur carte:', { currentStock, wineId });
    console.log('🔄 Ouverture du popup de dégustation...');
    
    // Ouvrir le popup de dégustation au lieu de supprimer directement
    onOpenTastingModal(wineToDisplay);
  };

  // Récupérer les amis qui ont aussi ce vin (pour badge)
  // Eviter les requêtes coûteuses sur l’onglet "Dégustés"
  const { friendsWithWine } = useFriendsWithWine(tab === 'tasted' ? '' : wineId);

  return (
    <WineCard
      wine={wineToDisplay}
      onPress={() => { 
        if (wineId) { 
          // S'assurer que le vin a la bonne propriété origin selon le tab
          const wineWithOrigin = { ...wineToDisplay, origin: tab };
          onWinePress(wineId, wineWithOrigin); 
        } 
      }}
      onToggleFavorite={handleToggleFavorite}
      showStockButtons={tab === 'cellar'}
      onAddBottle={handleAddBottle}
      onRemoveBottle={handleRemoveBottle}
      friendsWithWine={friendsWithWine}
    />
  );
};

interface MesVinsScreenProps {
  onWinePress: (wineId: string, wineData?: any) => void;
}

export default function MesVinsScreen({ onWinePress }: MesVinsScreenProps) {
  const router = useRouter();
  const [tab, setTab] = useState<WineListTab>('cellar');
  const [search, setSearch] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  
  // État simple pour forcer le re-rendu
  const [refreshKey, setRefreshKey] = useState(0);
  
  // État pour la modal de confirmation de dégustation
  const [tastingModalVisible, setTastingModalVisible] = useState(false);
  const [selectedWineForTasting, setSelectedWineForTasting] = useState<any>(null);
  const [tastingHistoryModalVisible, setTastingHistoryModalVisible] = useState(false);
  const [selectedTastedWine, setSelectedTastedWine] = useState<any>(null);

  const { wines: allWines, updateWine, cleanupDuplicates, subscribeToUpdates } = useWines();
  const wines = useWineList(tab, allWines);
  const { addTasting, reAddToCellar, tastedWines } = useWineHistory();
  const { stats, isLoading: statsLoading, error: statsError, refreshStats } = useStats(); // Utilise simplement useStats
  const { user } = useUser();
  const { stats: socialStats } = useSocialStats(user?.id || null);
  
  // logs réduits

  // Utiliser les vins transformés par useWineList pour tous les onglets
  const winesToDisplay = wines;
  
  // Pour les stats, utiliser les vins transformés par useWineList
  const winesForStats = wines;

  // Forcer le re-rendu quand l'écran redevient actif
  useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // S'abonner aux mises à jour globales du hook pour rafraîchir instantanément
  useEffect(() => {
    const unsubscribe = subscribeToUpdates?.(() => {
      setRefreshKey(prev => prev + 1);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [subscribeToUpdates]);

  // Fonction pour gérer la dégustation d'un vin
  const handleTasteWine = (wine: any) => {
    setSelectedWineForTasting(wine);
    setTastingModalVisible(true);
  };

  // Fonction pour confirmer la dégustation
  const handleConfirmTasting = async (note?: string) => {
    if (!selectedWineForTasting) return;

    try {
      console.log('🔄 handleConfirmTasting: Vin sélectionné:', selectedWineForTasting);
      const result = await addTasting(selectedWineForTasting.id, note);
      
      if (result.success) {
        // Supprimer une bouteille après la dégustation
        const currentStock = selectedWineForTasting.stock || selectedWineForTasting.amount || 0;
        console.log('🔄 handleConfirmTasting: Stock actuel:', currentStock, 'Nouveau stock:', currentStock - 1);
        
        if (currentStock > 0) {
          await supabase
            .from('user_wine')
            .update({ amount: currentStock - 1 })
            .eq('wine_id', selectedWineForTasting.id)
            .eq('user_id', (await supabase.auth.getUser()).data.user?.id as any);
          console.log('✅ handleConfirmTasting: Stock décrémenté');
        }
        
        // Mettre à jour la note personnelle si fournie
        if (note) {
          await supabase
            .from('user_wine')
            .update({ personal_comment: note })
            .eq('wine_id', selectedWineForTasting.id)
            .eq('user_id', (await supabase.auth.getUser()).data.user?.id as any);
          console.log('✅ handleConfirmTasting: Note personnelle mise à jour');
        }
        
        // La mise à jour des données se fait automatiquement via le hook
        setTastingModalVisible(false);
        setSelectedWineForTasting(null);
        await refreshStats(); // Refresh stats via SWR
        setRefreshKey(prev => prev + 1); // Force re-render
      } else {
        Alert.alert('Erreur', 'Impossible d\'enregistrer la dégustation');
      }
    } catch (error) {
      console.error('Erreur lors de la dégustation:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la dégustation');
    }
  };

  // Fonction pour annuler la dégustation
  const handleCancelTasting = () => {
    setTastingModalVisible(false);
    setSelectedWineForTasting(null);
  };

  // Fonction pour réajouter un vin à la cave
  const handleReAddToCellar = async (wineId: string) => {
    try {
      const result = await reAddToCellar(wineId);
      if (result.success) {
        await refreshStats(); // Refresh stats via SWR
        setRefreshKey(prev => prev + 1);
      } else {
        Alert.alert('Erreur', 'Impossible de réajouter le vin à la cave');
      }
    } catch (error) {
      console.error('Erreur lors de la réajout à la cave:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  };

  const handleOpenTastingHistory = (tastedWine: any) => {
    setSelectedTastedWine(tastedWine);
    setTastingHistoryModalVisible(true);
  };

  const handleCloseTastingHistory = () => {
    setTastingHistoryModalVisible(false);
    setSelectedTastedWine(null);
  };

  const handleReAddFromHistory = () => {
    if (selectedTastedWine) {
      handleReAddToCellar(selectedTastedWine.wine.id);
      handleCloseTastingHistory();
    }
  };

  // Stats calculées selon la logique de chaque onglet
  const localStats = useMemo(() => {
    // logs réduits
    
    if (tab === 'cellar') {
      // 🧺 Ma cave : somme des stocks (ex: 3x Les Roches Blanches = 3)
      const cellarWines = winesForStats.filter(w => w.origin === 'cellar');
      const total = cellarWines.reduce((sum, wine) => sum + (wine.stock || 0), 0);
      const red = cellarWines
        .filter(w => w.color === 'red')
        .reduce((sum, wine) => sum + (wine.stock || 0), 0);
      const white = cellarWines
        .filter(w => w.color === 'white')
        .reduce((sum, wine) => sum + (wine.stock || 0), 0);
      const rose = cellarWines
        .filter(w => w.color === 'rose')
        .reduce((sum, wine) => sum + (wine.stock || 0), 0);
      const sparkling = cellarWines
        .filter(w => w.color === 'sparkling')
        .reduce((sum, wine) => sum + (wine.stock || 0), 0);
      
      const result = { total, red, white, rose, sparkling };
      // logs réduits
      return result;
    } else if (tab === 'wishlist') {
      // ⭐ Mes envies : nombre de vins uniques (1 par vin désiré)
      const wishlistWines = winesForStats.filter(w => w.origin === 'wishlist');
      const total = wishlistWines.length;
      const red = wishlistWines.filter(w => w.color === 'red').length;
      const white = wishlistWines.filter(w => w.color === 'white').length;
      const rose = wishlistWines.filter(w => w.color === 'rose').length;
      const sparkling = wishlistWines.filter(w => w.color === 'sparkling').length;
      
      const result = { total, red, white, rose, sparkling };
      // logs réduits
      return result;
    } else {
      // 🍷 Dégustés : utiliser les données brutes de useWineHistory pour les stats
      const total = tastedWines.reduce((sum, entry) => sum + (entry.tastingCount || 0), 0);
      const red = tastedWines
        .filter(entry => entry.wine.wine_type === 'red')
        .reduce((sum, entry) => sum + (entry.tastingCount || 0), 0);
      const white = tastedWines
        .filter(entry => entry.wine.wine_type === 'white')
        .reduce((sum, entry) => sum + (entry.tastingCount || 0), 0);
      const rose = tastedWines
        .filter(entry => entry.wine.wine_type === 'rose')
        .reduce((sum, entry) => sum + (entry.tastingCount || 0), 0);
      const sparkling = tastedWines
        .filter(entry => entry.wine.wine_type === 'sparkling')
        .reduce((sum, entry) => sum + (entry.tastingCount || 0), 0);

      console.log('🍷 Debug MesVins Dégustés – total bouteilles:', total, 'byColor:', { red, white, rose, sparkling });
      console.log('🍷 Debug MesVins Dégustés – raw tastedWines:', tastedWines.length, tastedWines.map(t => ({ 
        wineId: t.wine.id, 
        wineName: t.wine.name, 
        wineType: t.wine.wine_type,
        tastingCount: t.tastingCount
      })));

      const result = { total, red, white, rose, sparkling };
      return result;
    }
  }, [wines, tab, winesToDisplay, refreshKey, allWines, stats, tastedWines]);

  const filteredWines = winesToDisplay.filter(wine => {
    // Maintenant que useWineList transforme les données, la structure est uniforme
    const wineName = wine.name;
    const wineDomaine = wine.domaine;
    const wineRegion = wine.region;
    const wineColor = wine.color;
    
    const matchesSearch = wineName.toLowerCase().includes(search.toLowerCase()) ||
      (wineDomaine && wineDomaine.toLowerCase().includes(search.toLowerCase())) ||
      (wineRegion && wineRegion.toLowerCase().includes(search.toLowerCase()));
    
    const matchesFilters = activeFilters.length === 0 ||
      activeFilters.some(filter => {
        switch (filter) {
          case 'all':
            return true;
          case 'red':
            return wineColor === 'red';
          case 'white':
            return wineColor === 'white';
          case 'rose':
            return wineColor === 'rose';
          case 'sparkling':
            return wineColor === 'sparkling';
          default:
            return false;
        }
      });
    
    return matchesSearch && matchesFilters;
  });

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Barre de navigation fixe */}
      <View style={styles.fixedHeader}>
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
      </View>
      
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
            {(() => {
              // Utiliser les stats SWR pour "Ma cave" et "Mes envies".
              // Pour "Dégustés", on utilise uniquement le calcul local (vins distincts et par couleur).
              const statsToUse = tab === 'tasted' ? localStats : {
                total: tab === 'cellar' ? stats?.total_bottles_in_cellar || 0 : localStats.total,
                red: tab === 'cellar' ? stats?.red_wines_count || 0 : localStats.red,
                white: tab === 'cellar' ? stats?.white_wines_count || 0 : localStats.white,
                rose: tab === 'cellar' ? stats?.rose_wines_count || 0 : localStats.rose,
                sparkling: tab === 'cellar' ? stats?.sparkling_wines_count || 0 : localStats.sparkling,
              };
              
              // logs réduits
              return (
                <StatsBar 
                  key={`stats-${tab}-${refreshKey}-${JSON.stringify(statsToUse)}`}
                  values={statsToUse} 
                  totalLabel={tab === 'cellar' ? 'bouteilles' : tab === 'tasted' ? 'dégustations' : 'vins'}
                />
              );
            })()}
            <View style={{ marginTop: 24 }} />
            <SearchFilterBar
              value={search}
              onChange={setSearch}
              onFilterPress={() => setFilterModalVisible(true)}
              placeholder={
                tab === 'cellar' ? 'Cherchez un vin dans votre cave ...' :
                tab === 'wishlist' ? 'Cherchez un vin dans vos envies ...' :
                'Cherchez un vin dans vos dégustations ...'
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
            
            <View style={styles.listContainer}>
              {filteredWines.length === 0 ? (
                <Text style={styles.emptyText}>
                  {tab === 'cellar' ? 'Aucun vin dans votre cave.' :
                   tab === 'wishlist' ? 'Aucun vin dans vos envies.' :
                   'Aucune dégustation trouvée.'}
                </Text>
              ) : (
                filteredWines.map(wine => {
                  // Vérification que l'ID est valide
                  const safeKey = wine.id && typeof wine.id === 'string' ? wine.id : `wine-${Math.random()}`;
                  
                  if (!wine?.id) {
                    console.warn('MesVinsScreen: vin sans ID valide, ignoré', { wine, tab });
                    return null;
                  }
                  
                  // Créer une clé unique simple
                  const uniqueKey = `${safeKey}-favorite-${wine.favorite ? 'true' : 'false'}-refresh-${refreshKey}`;
                  
                  return (
                    <WineCardWithSocial
                      key={uniqueKey}
                      wine={wine}
                      tab={tab}
                      onWinePress={onWinePress}
                      onOpenTastingModal={handleTasteWine}
                      setRefreshKey={setRefreshKey}
                    />
                  );
                })
              )}
            </View>
          </ScrollView>
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        options={FILTER_OPTIONS}
        selectedFilters={activeFilters}
        onFilterChange={setActiveFilters}
        title="Filtres"
      />
      
      {/* Modal de confirmation de dégustation */}
      <TastingConfirmationModal
        visible={tastingModalVisible}
        wineName={selectedWineForTasting?.name || ''}
        onCancel={handleCancelTasting}
        onConfirm={handleConfirmTasting}
      />
      
      <TastingHistoryModal
        visible={tastingHistoryModalVisible}
        tastedWine={selectedTastedWine}
        onClose={handleCloseTastingHistory}
        onReAddToCellar={handleReAddFromHistory}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#222',
  },
  fixedHeader: {
    backgroundColor: '#222',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    zIndex: 10,
    position: 'relative',
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 4,
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
    backgroundColor: '#393C40', borderWidth: 0,
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 140,
  },
  listContainer: {
    marginTop: 8,
  },
  emptyText: {
    color: '#B0B0B0',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
}); 