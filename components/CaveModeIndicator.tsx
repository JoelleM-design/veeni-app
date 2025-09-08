import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useActiveCave } from '../hooks/useActiveCave';

interface CaveModeIndicatorProps {
  onPress?: () => void;
  showIcon?: boolean;
}

export const CaveModeIndicator: React.FC<CaveModeIndicatorProps> = ({ 
  onPress, 
  showIcon = true 
}) => {
  const { caveMode, isShared, householdName, loading } = useActiveCave();

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const getModeText = () => {
    if (isShared && householdName) {
      return `Cave partagée : ${householdName}`;
    }
    return 'Ma cave';
  };

  const getModeIcon = () => {
    if (isShared) {
      return 'people' as const;
    }
    return 'person' as const;
  };

  const getModeColor = () => {
    if (isShared) {
      return '#4CAF50'; // Vert pour partagé
    }
    return '#2196F3'; // Bleu pour personnel
  };

  return (
    <TouchableOpacity 
      style={[styles.container, onPress && styles.pressable]}
      onPress={onPress}
      disabled={!onPress}
    >
      {showIcon && (
        <Ionicons 
          name={getModeIcon()} 
          size={16} 
          color={getModeColor()} 
          style={styles.icon}
        />
      )}
      <Text style={[styles.text, { color: getModeColor() }]}>
        {getModeText()}
      </Text>
      {onPress && (
        <Ionicons 
          name="chevron-down" 
          size={14} 
          color={getModeColor()} 
          style={styles.chevron}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    marginVertical: 4,
  },
  pressable: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  icon: {
    marginRight: 6,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  chevron: {
    marginLeft: 4,
  },
  loadingText: {
    color: '#999',
    fontSize: 14,
  },
});
