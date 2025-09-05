import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useOnboarding } from '../context/OnboardingContext';

interface OnboardingHeaderProps {
  stepIndex: number;
  totalSteps: number;
  canGoBack: boolean;
}

export default function OnboardingHeader({ stepIndex, totalSteps, canGoBack }: OnboardingHeaderProps) {
  const { onBack } = useOnboarding();

  console.log('🔍 OnboardingHeader render:', { stepIndex, totalSteps, canGoBack, hasOnBack: !!onBack });

  // Ne pas afficher le header sur la première étape (welcome)
  if (stepIndex === 0) {
    return null;
  }

  const handleBack = () => {
    console.log('🔙 Header back button pressed');
    if (canGoBack && onBack) {
      onBack();
    }
  };

  // Calculer la progression en commençant à 0% pour la deuxième étape
  const progressPercentage = Math.round((stepIndex / 5) * 100);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {canGoBack && (
          <TouchableOpacity 
            onPress={handleBack} 
            style={styles.headerBtn} 
            hitSlop={{top: 16, bottom: 16, left: 16, right: 16}}
          >
            <Ionicons name="chevron-back" size={28} color="#FFF" />
          </TouchableOpacity>
        )}
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${progressPercentage}%` }
            ]} 
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 50, // Safe area pour iPhone
    backgroundColor: '#222',
  },
  topRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    width: '100%', 
    paddingHorizontal: 16, 
    marginTop: 0, 
    marginBottom: 0, 
    minHeight: 48, 
    height: 48 
  },
  headerBtn: { 
    padding: 4, 
    borderRadius: 20, 
    backgroundColor: 'rgba(0,0,0,0.0)', 
    marginRight: 8 
  },
  progressBarContainer: { 
    flex: 1, 
    height: 6, 
    backgroundColor: '#393C40', 
    borderWidth: 0, 
    borderRadius: 3, 
    overflow: 'hidden' 
  },
  progressBar: { 
    height: 6, 
    backgroundColor: '#FFFFFF', 
    borderWidth: 0, 
    borderRadius: 3 
  },
}); 