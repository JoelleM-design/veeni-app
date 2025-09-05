import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StepFriends({ onNext, onBack, stepIndex = 0, totalSteps = 7 }: { onNext: () => void; onBack: () => void; stepIndex?: number; totalSteps?: number }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <Text style={styles.label}>Invite tes amis</Text>
        <Text style={styles.text}>Partage tes vins avec tes proches et découvre leurs caves</Text>
        <TouchableOpacity style={styles.button} onPress={onNext}>
          <Text style={styles.buttonText}>Suivant</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#222' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  label: { color: '#FFF', fontSize: 20, marginBottom: 18 },
  text: { color: '#FFF', fontSize: 16, textAlign: 'center', marginBottom: 32 },
  button: { backgroundColor: '#393C40', borderWidth: 1, borderColor: '#555', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 36, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  buttonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
}); 