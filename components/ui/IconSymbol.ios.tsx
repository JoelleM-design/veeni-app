import { Ionicons } from '@expo/vector-icons';
import { StyleProp, ViewStyle } from 'react-native';

export function IconSymbol({ 
  name, 
  weight = 'regular', 
  style 
}: { 
  name: string; 
  weight?: 'regular' | 'bold' | 'light'; 
  style?: StyleProp<ViewStyle>; 
}) {
  // Fallback vers Ionicons pour Expo Go
  const iconName = name as keyof typeof Ionicons.glyphMap;
  return <Ionicons name={iconName} size={24} style={style} />;
}
