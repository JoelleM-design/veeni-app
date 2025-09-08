import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface FilterOption {
  key: string;
  label: string;
  color?: string;
  icon?: string;
}

interface ActiveFiltersBarProps {
  selectedFilters: string[];
  options: FilterOption[];
  onRemoveFilter: (filterKey: string) => void;
  onClearAll: () => void;
}

export const ActiveFiltersBar: React.FC<ActiveFiltersBarProps> = ({
  selectedFilters,
  options,
  onRemoveFilter,
  onClearAll,
}) => {
  if (selectedFilters.length === 0) {
    return null;
  }

  const getFilterLabel = (key: string) => {
    const option = options.find(opt => opt.key === key);
    return option?.label || key;
  };

  const getFilterColor = (key: string) => {
    const option = options.find(opt => opt.key === key);
    return option?.color;
  };

  const getFilterIcon = (key: string) => {
    const option = options.find(opt => opt.key === key);
    return option?.icon;
  };

  return (
    <View style={styles.container}>
      {selectedFilters.length === 1 ? (
        // Un seul filtre : pas de scroll, aligné à gauche
        <View style={styles.singleFilterContainer}>
          {selectedFilters.map((filterKey) => {
            const color = getFilterColor(filterKey);
            const icon = getFilterIcon(filterKey);
            
            return (
              <TouchableOpacity
                key={filterKey}
                style={styles.filterChip}
                onPress={() => onRemoveFilter(filterKey)}
              >
                <View style={styles.filterChipContent}>
                  {icon && (
                    <Ionicons 
                      name={icon as any} 
                      size={12} 
                      color={color || "#FFF"} 
                      style={styles.filterIcon}
                    />
                  )}
                  <Text style={styles.filterChipText}>
                    {getFilterLabel(filterKey)}
                  </Text>
                  <Ionicons 
                    name="close-circle" 
                    size={16} 
                    color="#FFF" 
                    style={styles.removeIcon}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        // Plusieurs filtres : scroll horizontal
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {selectedFilters.map((filterKey) => {
            const color = getFilterColor(filterKey);
            const icon = getFilterIcon(filterKey);
            
            return (
              <TouchableOpacity
                key={filterKey}
                style={styles.filterChip}
                onPress={() => onRemoveFilter(filterKey)}
              >
                <View style={styles.filterChipContent}>
                  {icon && (
                    <Ionicons 
                      name={icon as any} 
                      size={12} 
                      color={color || "#FFF"} 
                      style={styles.filterIcon}
                    />
                  )}
                  <Text style={styles.filterChipText}>
                    {getFilterLabel(filterKey)}
                  </Text>
                  <Ionicons 
                    name="close-circle" 
                    size={16} 
                    color="#FFF" 
                    style={styles.removeIcon}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
          
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={onClearAll}
          >
            <Text style={styles.clearAllText}>Tout effacer</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#222',
    paddingHorizontal: 16, // Aligné avec SearchFilterBar
    paddingVertical: 8,
  },
  singleFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  filterChip: {
    backgroundColor: '#393C40', borderWidth: 0,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8, // Espacement entre les filtres
  },
  filterChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterIcon: {
    marginRight: 4,
  },
  filterChipText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  removeIcon: {
    marginLeft: 2,
  },
  clearAllButton: {
    backgroundColor: '#444',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'center',
  },
  clearAllText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
}); 