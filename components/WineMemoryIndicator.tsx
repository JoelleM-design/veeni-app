import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { VeeniColors } from '../constants/Colors';

interface WineMemoryIndicatorProps {
  hasMemories: boolean;
  memoriesCount?: number;
  size?: 'small' | 'medium' | 'large';
}

export default function WineMemoryIndicator({ 
  hasMemories, 
  memoriesCount = 0, 
  size = 'small' 
}: WineMemoryIndicatorProps) {
  if (!hasMemories) return null;

  const sizeConfig = {
    small: {
      container: styles.smallContainer,
      icon: 12,
      text: 10,
    },
    medium: {
      container: styles.mediumContainer,
      icon: 16,
      text: 12,
    },
    large: {
      container: styles.largeContainer,
      icon: 20,
      text: 14,
    },
  };

  const config = sizeConfig[size];

  return (
    <View style={[styles.container, config.container]}>
      <Ionicons 
        name="camera" 
        size={config.icon} 
        color="#FFFFFF" 
      />
      {memoriesCount > 0 && (
        <Text style={[styles.count, { fontSize: config.text }]}>
          {memoriesCount}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: VeeniColors.wine.red,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  smallContainer: {
    minWidth: 20,
    height: 20,
  },
  mediumContainer: {
    minWidth: 24,
    height: 24,
  },
  largeContainer: {
    minWidth: 28,
    height: 28,
  },
  count: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 2,
  },
});

