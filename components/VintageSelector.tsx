import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface VintageSelectorProps {
  selectedVintage?: number;
  onVintageChange: (vintage: number | null) => void;
  disabled?: boolean;
}

export const VintageSelector: React.FC<VintageSelectorProps> = ({
  selectedVintage,
  onVintageChange,
  disabled = false
}) => {
  const [showVintagePicker, setShowVintagePicker] = useState(false);

  // Générer les années de millésime (de l'année actuelle à 1900)
  const currentYear = new Date().getFullYear();
  const vintageYears = Array.from(
    { length: currentYear - 1900 + 1 },
    (_, i) => currentYear - i
  );

  const handleVintageSelect = (vintage: number) => {
    onVintageChange(vintage);
    setShowVintagePicker(false);
  };

  const handleClearVintage = () => {
    onVintageChange(null);
    setShowVintagePicker(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.selector, disabled && styles.selectorDisabled]}
        onPress={() => setShowVintagePicker(true)}
        disabled={disabled}
      >
        <View style={styles.selectorContent}>
          <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
          <Text style={styles.selectorText}>
            {selectedVintage ? selectedVintage.toString() : 'Sélectionner le millésime'}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Picker Millésime */}
      {showVintagePicker && (
        <View style={styles.overlay}>
          <TouchableOpacity 
            style={styles.overlayBackground} 
            onPress={() => setShowVintagePicker(false)} 
          />
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Sélectionner le millésime</Text>
              <TouchableOpacity 
                onPress={() => setShowVintagePicker(false)} 
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            {/* Bouton pour effacer la sélection */}
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearVintage}
            >
              <Ionicons name="close-circle-outline" size={20} color="#FF4444" />
              <Text style={styles.clearButtonText}>Effacer le millésime</Text>
            </TouchableOpacity>

            <ScrollView style={styles.pickerList}>
              {vintageYears.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.pickerItem,
                    selectedVintage === year && styles.pickerItemSelected
                  ]}
                  onPress={() => handleVintageSelect(year)}
                  disabled={disabled}
                >
                  <Text style={styles.pickerItemText}>{year}</Text>
                  {selectedVintage === year && (
                    <Ionicons name="checkmark" size={20} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
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
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
  },
  clearButtonText: {
    color: '#FF4444',
    fontSize: 16,
    marginLeft: 8,
  },
  pickerList: {
    maxHeight: 300,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
  },
  pickerItemSelected: {
    backgroundColor: '#333333',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
});
