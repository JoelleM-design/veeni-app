import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function validatePassword(pw: string) {
  const errors = [];
  if (pw.length < 8) errors.push('Au moins 8 caractères');
  if (!/[A-Z]/.test(pw)) errors.push('Une majuscule');
  if (!/[a-z]/.test(pw)) errors.push('Une minuscule');
  if (!/[0-9]/.test(pw)) errors.push('Un chiffre');
  return errors;
}

export default function StepPassword({ value, onChange, onNext, onBack, stepIndex = 4, totalSteps = 7 }: { value: string; onChange: (v: string) => void; onNext: () => void; onBack: () => void; stepIndex?: number; totalSteps?: number }) {
  const errors = validatePassword(value);
  const isValid = errors.length === 0;
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
          <Text style={styles.label}>Quel est ton mot de passe ?</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChange}
            placeholder="Mot de passe"
            placeholderTextColor="#888"
            secureTextEntry
            autoFocus
          />
          {errors.length > 0 && (
            <View style={styles.errorList}>
              {errors.map((err, i) => (
                <Text key={i} style={styles.error}>{err}</Text>
              ))}
            </View>
          )}
          <TouchableOpacity
            style={[styles.button, !isValid && { opacity: 0.5 }]}
            onPress={onNext}
            disabled={!isValid}
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
  input: { backgroundColor: '#333', color: '#FFF', borderRadius: 16, padding: 14, fontSize: 18, width: '100%', marginBottom: 8 },
  button: { backgroundColor: '#FFF', borderRadius: 24, paddingVertical: 14, paddingHorizontal: 36, marginTop: 16, marginBottom: 8 },
  buttonText: { color: '#222', fontWeight: '700', fontSize: 16 },
  error: { color: '#F6A07A', marginBottom: 2, fontSize: 14 },
  errorList: { alignSelf: 'flex-start', marginBottom: 4, marginTop: 2 },
}); 