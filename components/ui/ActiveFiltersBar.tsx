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
                {color && (
                  <View style={[
                    styles.colorIndicator,
                    { backgroundColor: color }
                  ]} />
                )}
                {icon && (
                  <Ionicons 
                    name={icon as any} 
                    size={12} 
                    color="#FFF" 
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
        
        {selectedFilters.length > 1 && (
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={onClearAll}
          >
            <Text style={styles.clearAllText}>Tout effacer</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#222',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  scrollContent: {
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#F6A07A',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  filterIcon: {
    marginRight: 4,
  },
  filterChipText: {
    color: '#222',
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