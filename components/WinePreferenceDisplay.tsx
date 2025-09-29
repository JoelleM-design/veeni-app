import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useWinePreference } from '../hooks/useWinePreference';

interface WinePreferenceDisplayProps {
  wines: any[] | null | undefined;
  winesLoading?: boolean;
  style?: any;
  textStyle?: any;
  iconStyle?: any;
}

export function WinePreferenceDisplay({ 
  wines, 
  winesLoading = false, 
  style, 
  textStyle, 
  iconStyle 
}: WinePreferenceDisplayProps) {
  const { preference, colorIcons, colorLabels } = useWinePreference(wines);

  if (winesLoading) {
    return <Text style={[styles.userPreference, textStyle]}>Chargement...</Text>;
  }

  if (!wines || wines.length === 0) {
    return null;
  }

  if (preference) {
    return (
      <View style={[styles.preferenceContainer, style]}>
        <Text style={[styles.userPreference, textStyle]}>
          A une préférence pour le vin{' '}
        </Text>
        <View style={[styles.preferenceIcon, iconStyle]}>
          <Ionicons 
            name={colorIcons[preference as keyof typeof colorIcons].name as any} 
            size={16} 
            color={colorIcons[preference as keyof typeof colorIcons].color} 
          />
        </View>
        <Text style={[styles.userPreference, textStyle]}>
          {' '}{colorLabels[preference as keyof typeof colorLabels]}
        </Text>
      </View>
    );
  }

  return <Text style={[styles.userPreference, textStyle]}>Amateur de vins</Text>;
}

const styles = StyleSheet.create({
  preferenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  preferenceIcon: {
    marginHorizontal: 4,
  },
  userPreference: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
