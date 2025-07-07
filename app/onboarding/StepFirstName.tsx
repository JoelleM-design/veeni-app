import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StepFirstName({ value, onChange, onNext, onBack, stepIndex = 1, totalSteps = 11 }: { value: string; onChange: (v: string) => void; onNext: () => void; onBack: () => void; stepIndex?: number; totalSteps?: number }) {
  const [error, setError] = useState('');
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={onBack} style={styles.headerBtn} hitSlop={{top: 16, bottom: 16, left: 16, right: 16}}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${Math.round((stepIndex+1)/totalSteps*100)}%` }]} />
        </View>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
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
  topRow: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingHorizontal: 16, marginTop: 0, marginBottom: 0, minHeight: 48 },
  headerBtn: { padding: 4, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.0)', marginRight: 8 },
  progressBarContainer: { flex: 1, height: 6, backgroundColor: '#393C40', borderRadius: 3, overflow: 'hidden' },
  progressBar: { height: 6, backgroundColor: '#F6A07A', borderRadius: 3 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  label: { color: '#FFF', fontSize: 20, marginBottom: 18 },
  input: { backgroundColor: '#333', color: '#FFF', borderRadius: 16, padding: 14, fontSize: 18, width: '100%', marginBottom: 18 },
  button: { backgroundColor: '#FFF', borderRadius: 24, paddingVertical: 14, paddingHorizontal: 36, marginBottom: 8 },
  buttonText: { color: '#222', fontWeight: 'bold', fontSize: 16 },
  error: { color: '#F6A07A', marginBottom: 8 },
}); 