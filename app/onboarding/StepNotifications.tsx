import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StepNotifications({ value, onChange, onNext, onBack, stepIndex = 0, totalSteps = 7 }: { value: boolean; onChange: (v: boolean) => void; onNext: () => void; onBack: () => void; stepIndex?: number; totalSteps?: number }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        <Text style={styles.label}>
          Pour profiter pleinement de <Text style={styles.veeniText}>Veeni</Text> :
        </Text>
        <TouchableOpacity style={[styles.option, value && styles.selected]} onPress={() => onChange(true)}>
          <Text style={styles.optionText}>Active tes notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.option, !value && styles.selected]} onPress={() => onChange(false)}>
          <Text style={styles.optionText}>Je ne veux pas de notifications</Text>
        </TouchableOpacity>
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
  veeniText: { fontFamily: 'VeganFont', fontSize: 22, paddingHorizontal: 10, textAlign: 'center' },
  option: { backgroundColor: '#333', borderRadius: 18, paddingVertical: 14, paddingHorizontal: 32, marginVertical: 8 },
  selected: { backgroundColor: '#393C40', borderWidth: 0 },
  optionText: { color: '#FFF', fontSize: 16 },
  button: { backgroundColor: '#393C40', borderWidth: 1, borderColor: '#555', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 36, marginTop: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  buttonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
}); 