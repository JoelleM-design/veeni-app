import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.filterModal}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>{title}</Text>
            </View>

            <View style={styles.filterOptions}>
              {options.map((option, index) => {
                const isSelected = selectedFilters.includes(option.key);
                const isLast = index === options.length - 1;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.filterRow, isLast && styles.filterRowLast]}
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
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    paddingTop: 100, // Même position que la fiche de vin
  },
  filterModal: {
    backgroundColor: '#2a2a2a', // Même couleur que la fiche de vin
    margin: 20, // Centré avec marges
    borderRadius: 12, // Même border radius
    maxHeight: 400, // Même hauteur max
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  filterHeader: {
    alignItems: 'center', // Centrer le titre
    padding: 20, // Même padding que la fiche de vin
    borderBottomWidth: 1,
    borderBottomColor: '#444', // Même couleur de bordure
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600', // Même font weight que la fiche de vin
    color: '#FFFFFF', // Même couleur
    textAlign: 'center', // Centrer le texte
  },
  filterOptions: {
    // Supprimé gap pour utiliser paddingVertical sur les items
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16, // Même padding que pickerItem de la fiche de vin
    borderBottomWidth: 1,
    borderBottomColor: '#444', // Même couleur de bordure
  },
  filterRowLast: {
    borderBottomWidth: 0, // Supprimer la dernière bordure
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
    backgroundColor: '#393C40',
    borderWidth: 0,
  },
  filterContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterIcon: {
    marginRight: 12, // Même espacement que pickerItemIcon
  },
  filterLabel: {
    color: '#FFFFFF', // Même couleur que pickerItemText
    fontSize: 16, // Même taille
    flex: 1,
  },
  filterLabelSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
}); 