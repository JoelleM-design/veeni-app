import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StepFirstName({ value, onChange, onNext, onBack, stepIndex = 0, totalSteps = 7 }: { value: string; onChange: (v: string) => void; onNext: () => void; onBack: () => void; stepIndex?: number; totalSteps?: number }) {
  const [error, setError] = useState('');
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.container}>
          <Text style={styles.label}>Quel est ton prénom ?</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChange}
            placeholder="Prénom"
            placeholderTextColor="#888"
            autoFocus
            returnKeyType="done"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity
            style={[styles.button, !value && { opacity: 0.5 }]}
            onPress={() => {
              if (!value) setError('Merci de renseigner ton prénom');
              else { setError(''); onNext(); }
            }}
            disabled={!value}
          >
            <Text style={styles.buttonText}>Suivant</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#222' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  label: { color: '#FFF', fontSize: 20, marginBottom: 18 },
  input: { backgroundColor: '#333', color: '#FFF', borderRadius: 16, padding: 14, fontSize: 18, width: '100%', marginBottom: 18 },
  button: { backgroundColor: '#393C40', borderWidth: 1, borderColor: '#555', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 36, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  buttonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  error: { color: '#FFFFFF', marginBottom: 8 },
}); 