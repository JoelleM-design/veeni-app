import { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatsBar } from '../../components/StatsBar';
import { ActiveFiltersBar, FilterOption } from '../../components/ui/ActiveFiltersBar';
import { FilterModal } from '../../components/ui/FilterModal';
import { SearchFilterBar } from '../../components/ui/SearchFilterBar';
import { WineCard } from '../../components/WineCard';
import useWineList, { WineListTab } from '../hooks/useWineList';

const FILTER_OPTIONS: FilterOption[] = [
  { key: 'red', label: 'Rouge', color: '#FF4F8B' },
  { key: 'white', label: 'Blanc', color: '#FFF8DC' },
  { key: 'rose', label: 'Rosé', color: '#FFB6C1' },
  { key: 'sparkling', label: 'Pétillant', color: '#FFD700' },
  { key: 'favorite', label: 'Coup de cœur', icon: 'heart' },
];

const TABS = [
  { key: 'cellar', label: 'Ma cave' },
  { key: 'wishlist', label: 'Mes envies' },
  { key: 'tasted', label: 'Dégustés' },
];

export default function MesVinsScreen() {
  const [tab, setTab] = useState<WineListTab>('cellar');
  const [search, setSearch] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const wines = useWineList(tab);

  // Stats calculées (exemple, à adapter si besoin)
  const stats = {
    total: wines.length,
    red: wines.filter(w => w.color === 'red').length,
    white: wines.filter(w => w.color === 'white').length,
    rose: wines.filter(w => w.color === 'rose').length,
    sparkling: wines.filter(w => w.color === 'sparkling').length,
  };

  const filteredWines = wines.filter(wine => {
    const matchesSearch = wine.name.toLowerCase().includes(search.toLowerCase()) ||
      wine.domaine.toLowerCase().includes(search.toLowerCase()) ||
      wine.region.toLowerCase().includes(search.toLowerCase());
    const matchesFilters = activeFilters.length === 0 ||
      activeFilters.includes(wine.color) ||
      (activeFilters.includes('favorite') && wine.favorite);
    return matchesSearch && matchesFilters;
  });

  return (
    <SafeAreaView style={styles.safeContainer}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.header}>
          </View>
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
          <StatsBar values={stats} />
          <View style={{ marginTop: 24 }} />
          <SearchFilterBar
            value={search}
            onChange={setSearch}
            onFilterPress={() => setFilterModalVisible(true)}
            placeholder={tab === 'cellar' ? 'Cherchez un vin dans votre cave ...' : 'Cherchez un vin dans vos envies ...'}
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
              <Text style={styles.emptyText}>Aucun vin trouvé.</Text>
            ) : (
              <ScrollView>
                {filteredWines.map(wine => {
                  // Vérification que l'ID est valide
                  const safeKey = wine.id && typeof wine.id === 'string' ? wine.id : `wine-${Math.random()}`;
                  return (
                    <WineCard
                      key={safeKey}
                      wine={wine}
                      showStockButtons={tab === 'cellar'}
                      onToggleFavorite={() => {
                        // TODO: Implémenter la logique de toggle favorite
                        console.log('Toggle favorite for wine:', wine.id);
                      }}
                      onAddBottle={() => {
                        // TODO: Implémenter la logique d'ajout de bouteille
                        console.log('Add bottle for wine:', wine.id);
                      }}
                      onRemoveBottle={() => {
                        // TODO: Implémenter la logique de suppression de bouteille
                        console.log('Remove bottle for wine:', wine.id);
                      }}
                    />
                  );
                })}
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        options={FILTER_OPTIONS}
        selectedFilters={activeFilters}
        onFilterChange={setActiveFilters}
        title="Filtres"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
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
    textAlign: 'left',
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
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
    backgroundColor: '#F6A07A',
  },
  tabLabel: {
    color: '#999',
    fontWeight: '500',
    fontSize: 14,
  },
  tabLabelActive: {
    color: '#222',
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  emptyText: {
    color: '#B0B0B0',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
}); 