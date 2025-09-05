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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  label: { color: '#FFF', fontSize: 20, marginBottom: 18 },
  input: { backgroundColor: '#333', color: '#FFF', borderRadius: 16, padding: 14, fontSize: 18, width: '100%', marginBottom: 8 },
  button: { backgroundColor: '#393C40', borderWidth: 1, borderColor: '#555', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 36, marginTop: 16, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  error: { color: '#FFFFFF', marginBottom: 2, fontSize: 14 },
  errorList: { alignSelf: 'flex-start', marginBottom: 4, marginTop: 2 },
}); 