import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { VeeniColors } from '../../constants/Colors';

export interface FilterOption {
  key: string;
  label: string;
  color?: string;
  icon?: string;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  options: FilterOption[];
  selectedFilters: string[];
  onFilterChange: (filters: string[]) => void;
  title?: string;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  options,
  selectedFilters,
  onFilterChange,
  title = 'Filtres'
}) => {
  const getWineColor = (filterKey: string) => {
    switch (filterKey) {
      case 'red':
        return VeeniColors.wine.red;
      case 'white':
        return VeeniColors.wine.white;
      case 'rose':
        return VeeniColors.wine.rose;
      case 'sparkling':
        return VeeniColors.wine.sparkling;
      default:
        return '#FFFFFF';
    }
  };

  const toggleFilter = (key: string) => {
    const newFilters = selectedFilters.includes(key)
      ? selectedFilters.filter(f => f !== key)
      : [...selectedFilters, key];
    onFilterChange(newFilters);
  };

  const getFilterLabel = (key: string) => {
    const option = options.find(opt => opt.key === key);
    return option?.label || key;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.filterModal} onPress={() => {}}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterOptions}>
            {options.map((option) => {
              const isSelected = selectedFilters.includes(option.key);
              return (
                <TouchableOpacity
                  key={option.key}
                  style={styles.filterRow}
                  onPress={() => toggleFilter(option.key)}
                >
                  <View style={styles.radioContainer}>
                    <View style={[
                      styles.radioButton,
                      isSelected && styles.radioButtonSelected
                    ]}>
                      {isSelected && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.filterContent}>
                    {option.color && (
                      <View style={[
                        styles.colorIndicator,
                        { backgroundColor: option.color }
                      ]} />
                    )}
                    {option.icon && (
                      <Ionicons 
                        name={option.icon as any} 
                        size={16} 
                        color={getWineColor(option.key)} 
                        style={styles.filterIcon}
                      />
                    )}
                    <Text style={[
                      styles.filterLabel,
                      isSelected && styles.filterLabelSelected
                    ]}>
                      {option.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 20,
  },
  filterModal: {
    backgroundColor: '#333',
    borderRadius: 16,
    padding: 20,
    width: 280,
    maxWidth: 280,
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
    gap: 12,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radioContainer: {
    marginRight: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 0,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: 'transparent',
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#393C40', borderWidth: 0,
  },
  filterContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  filterIcon: {
    marginRight: 8,
  },
  filterLabel: {
    color: '#FFF',
    fontSize: 16,
    flex: 1,
  },
  filterLabelSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
}); 