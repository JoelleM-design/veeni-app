import { Ionicons } from '@expo/vector-icons';
import { Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StepFinish({ firstName, onNext, onBack, stepIndex = 10, totalSteps = 11 }: { firstName: string; onNext: () => void; onBack?: () => void; stepIndex?: number; totalSteps?: number }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.topRow}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.headerBtn} hitSlop={{top: 16, bottom: 16, left: 16, right: 16}}>
            <Ionicons name="chevron-back" size={28} color="#FFF" />
          </TouchableOpacity>
        )}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${Math.round((stepIndex+1)/totalSteps*100)}%` }]} />
        </View>
        {!onBack && <View style={{width: 36, height: 36, marginLeft: 8}} />}
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <View style={styles.container}>
          <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
          <Text style={styles.title}>Bienvenue sur Veeni !</Text>
          <Text style={styles.text}>La seule cave, connectée à ceux qui partagent votre passion.</Text>
          <TouchableOpacity style={styles.button} onPress={onNext}>
            <Text style={styles.buttonText}>C'est parti !</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#222' },
  topRow: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingHorizontal: 16, marginTop: 0, marginBottom: 0, minHeight: 48 },
  headerBtn: { padding: 4, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.0)', marginRight: 8 },
  progressBarContainer: { flex: 1, height: 6, backgroundColor: '#393C40', borderRadius: 3, overflow: 'hidden' },
  progressBar: { height: 6, backgroundColor: '#F6A07A', borderRadius: 3 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  logo: { width: 80, height: 80, marginBottom: 18 },
  title: { color: '#FFF', fontSize: 28, fontWeight: 'bold', marginBottom: 18 },
  text: { color: '#FFF', fontSize: 16, textAlign: 'center', marginBottom: 32 },
  button: { backgroundColor: '#FFF', borderRadius: 24, paddingVertical: 14, paddingHorizontal: 36, marginBottom: 8 },
  buttonText: { color: '#222', fontWeight: 'bold', fontSize: 16 },
}); 