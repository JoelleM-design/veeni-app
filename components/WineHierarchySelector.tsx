import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useWineHierarchy, WineAppellation, WineCountry, WineGrape, WineRegion } from '../hooks/useWineHierarchy';

interface WineHierarchySelectorProps {
  selectedCountry?: string;
  selectedRegion?: string;
  selectedAppellation?: string;
  selectedGrapes?: string[];
  onCountryChange: (country: WineCountry | null) => void;
  onRegionChange: (region: WineRegion | null) => void;
  onAppellationChange: (appellation: WineAppellation | null) => void;
  onGrapesChange: (grapes: WineGrape[]) => void;
  disabled?: boolean;
}

export const WineHierarchySelector: React.FC<WineHierarchySelectorProps> = ({
  selectedCountry,
  selectedRegion,
  selectedAppellation,
  selectedGrapes = [],
  onCountryChange,
  onRegionChange,
  onAppellationChange,
  onGrapesChange,
  disabled = false
}) => {
  const {
    countries,
    regions,
    appellations,
    grapes,
    loading,
    error,
    fetchRegionsByCountry,
    fetchAppellationsByRegion,
    fetchGrapesByAppellation,
    resetSelections
  } = useWineHierarchy();

  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [showAppellationPicker, setShowAppellationPicker] = useState(false);
  const [showGrapesPicker, setShowGrapesPicker] = useState(false);

  // Charger les régions quand un pays est sélectionné
  useEffect(() => {
    if (selectedCountry) {
      fetchRegionsByCountry(selectedCountry);
    } else {
      resetSelections();
    }
  }, [selectedCountry]);

  // Charger les appellations quand une région est sélectionnée
  useEffect(() => {
    if (selectedRegion) {
      fetchAppellationsByRegion(selectedRegion);
    }
  }, [selectedRegion]);

  // Charger les cépages quand une appellation est sélectionnée
  useEffect(() => {
    if (selectedAppellation) {
      fetchGrapesByAppellation(selectedAppellation);
    }
  }, [selectedAppellation]);

  const handleCountrySelect = (country: WineCountry) => {
    onCountryChange(country);
    onRegionChange(null);
    onAppellationChange(null);
    onGrapesChange([]);
    resetSelections(); // Réinitialiser les données chargées
    setShowCountryPicker(false);
  };

  const handleRegionSelect = (region: WineRegion) => {
    onRegionChange(region);
    onAppellationChange(null);
    onGrapesChange([]);
    setShowRegionPicker(false);
  };

  const handleAppellationSelect = (appellation: WineAppellation) => {
    onAppellationChange(appellation);
    onGrapesChange([]);
    setShowAppellationPicker(false);
  };

  const handleGrapeToggle = (grape: WineGrape) => {
    const isSelected = selectedGrapes.some(g => g === grape.name);
    if (isSelected) {
      onGrapesChange(selectedGrapes.filter(g => g !== grape.name));
    } else {
      onGrapesChange([...selectedGrapes, grape.name]);
    }
  };

  const getSelectedCountry = () => {
    return countries.find(c => c.name === selectedCountry);
  };

  const getSelectedRegion = () => {
    return regions.find(r => r.name === selectedRegion);
  };

  const getSelectedAppellation = () => {
    return appellations.find(a => a.name === selectedAppellation);
  };

  const renderPicker = (
    visible: boolean,
    onClose: () => void,
    title: string,
    items: any[],
    onSelect: (item: any) => void,
    getItemKey: (item: any) => string,
    getItemLabel: (item: any) => string,
    getItemIcon?: (item: any) => string
  ) => {
    if (!visible) return null;

    return (
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.overlayBackground} onPress={onClose} />
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerList}>
            {items.map((item) => (
              <TouchableOpacity
                key={getItemKey(item)}
                style={styles.pickerItem}
                onPress={() => onSelect(item)}
                disabled={disabled}
              >
                {getItemIcon && (
                  <Ionicons 
                    name={getItemIcon(item)} 
                    size={20} 
                    color="#FFFFFF" 
                    style={styles.pickerItemIcon}
                  />
                )}
                <Text style={styles.pickerItemText}>{getItemLabel(item)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Sélection Pays */}
      <TouchableOpacity
        style={[styles.selector, disabled && styles.selectorDisabled]}
        onPress={() => setShowCountryPicker(true)}
        disabled={disabled}
      >
        <View style={styles.selectorContent}>
          <Ionicons name="globe-outline" size={20} color="#FFFFFF" />
          <Text style={styles.selectorText}>
            {getSelectedCountry() ? `${getSelectedCountry()?.flag_emoji} ${getSelectedCountry()?.name}` : 'Sélectionner un pays'}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Sélection Région */}
      {selectedCountry && (
        <TouchableOpacity
          style={[styles.selector, disabled && styles.selectorDisabled]}
          onPress={() => setShowRegionPicker(true)}
          disabled={disabled || !selectedCountry}
        >
          <View style={styles.selectorContent}>
            <Ionicons name="location-outline" size={20} color="#FFFFFF" />
            <Text style={styles.selectorText}>
              {getSelectedRegion()?.name || 'Sélectionner une région'}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Sélection Appellation */}
      {selectedRegion && (
        <TouchableOpacity
          style={[styles.selector, disabled && styles.selectorDisabled]}
          onPress={() => setShowAppellationPicker(true)}
          disabled={disabled || !selectedRegion}
        >
          <View style={styles.selectorContent}>
            <Ionicons name="wine-outline" size={20} color="#FFFFFF" />
            <Text style={styles.selectorText}>
              {getSelectedAppellation()?.name || 'Sélectionner une appellation'}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Sélection Cépages */}
      {selectedAppellation && (
        <TouchableOpacity
          style={[styles.selector, disabled && styles.selectorDisabled]}
          onPress={() => setShowGrapesPicker(true)}
          disabled={disabled || !selectedAppellation}
        >
          <View style={styles.selectorContent}>
            <Ionicons name="leaf-outline" size={20} color="#FFFFFF" />
            <Text style={styles.selectorText}>
              {selectedGrapes.length > 0 
                ? `${selectedGrapes.length} cépages sélectionnés` 
                : 'Sélectionner des cépages'
              }
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Pickers */}
      {renderPicker(
        showCountryPicker,
        () => setShowCountryPicker(false),
        'Sélectionner un pays',
        countries,
        handleCountrySelect,
        (country) => country.id,
        (country) => `${country.flag_emoji} ${country.name}`
      )}

      {renderPicker(
        showRegionPicker,
        () => setShowRegionPicker(false),
        'Sélectionner une région',
        regions,
        handleRegionSelect,
        (region) => region.id,
        (region) => region.name
      )}

      {renderPicker(
        showAppellationPicker,
        () => setShowAppellationPicker(false),
        'Sélectionner une appellation',
        appellations,
        handleAppellationSelect,
        (appellation) => appellation.id,
        (appellation) => appellation.name
      )}

      {/* Picker Cépages (multi-sélection) */}
      {showGrapesPicker && (
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayBackground} onPress={() => setShowGrapesPicker(false)} />
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Sélectionner des cépages</Text>
              <TouchableOpacity onPress={() => setShowGrapesPicker(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              {grapes.map((grape) => {
                const isSelected = selectedGrapes.includes(grape.name);
                return (
                  <TouchableOpacity
                    key={grape.id}
                    style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                    onPress={() => handleGrapeToggle(grape)}
                    disabled={disabled}
                  >
                    <View style={styles.grapeItemContent}>
                      <View style={styles.grapeInfo}>
                        <Text style={styles.pickerItemText}>{grape.name}</Text>
                        {grape.is_primary && (
                          <Text style={styles.primaryLabel}>Principal</Text>
                        )}
                      </View>
                      <View style={[styles.colorIndicator, { backgroundColor: getGrapeColor(grape.color) }]} />
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color="#4CAF50" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      )}

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const getGrapeColor = (color: string) => {
  switch (color) {
    case 'red': return '#8B0000';
    case 'white': return '#F5F5DC';
    case 'rose': return '#FFB6C1';
    case 'sparkling': return '#FFF8DC';
    default: return '#666666';
  }
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444444',
  },
  selectorDisabled: {
    opacity: 0.5,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectorText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  overlayBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    maxHeight: 400,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  pickerList: {
    maxHeight: 300,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
  },
  pickerItemSelected: {
    backgroundColor: '#333333',
  },
  pickerItemIcon: {
    marginRight: 12,
  },
  pickerItemText: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
  grapeItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  grapeInfo: {
    flex: 1,
  },
  primaryLabel: {
    fontSize: 12,
    color: '#4CAF50',
    fontStyle: 'italic',
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});
