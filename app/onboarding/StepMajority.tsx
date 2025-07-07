import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StepMajority({ value, onChange, onNext, onBack, stepIndex = 3, totalSteps = 11 }: { value: boolean; onChange: (v: boolean) => void; onNext: () => void; onBack: () => void; stepIndex?: number; totalSteps?: number }) {
  const [error, setError] = useState('');

  const handleYes = () => {
    setError('');
    onChange(true);
    setTimeout(onNext, 150); // passage direct à l'étape suivante
  };
  const handleNo = () => {
    onChange(false);
    setError('Désolé, tu dois être majeur pour utiliser l\'application.');
  };

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
          <Text style={styles.label}>Es-tu majeur ?</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.choiceBtn, styles.noBtn]}
              onPress={handleNo}
            >
              <Text style={[styles.choiceText, styles.noText]}>Non</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.choiceBtn, styles.yesBtn]}
              onPress={handleYes}
            >
              <Text style={[styles.choiceText, styles.yesText]}>Oui</Text>
            </TouchableOpacity>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
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
  label: { color: '#FFF', fontSize: 20, marginBottom: 18, marginTop: 0 },
  row: { flexDirection: 'row', marginBottom: 32 },
  choiceBtn: { borderRadius: 18, paddingVertical: 14, paddingHorizontal: 32, marginHorizontal: 8 },
  noBtn: { backgroundColor: '#393C40' },
  yesBtn: { backgroundColor: '#FFF' },
  choiceText: { fontSize: 18, fontWeight: 'bold' },
  noText: { color: '#FFF', fontWeight: 'bold' },
  yesText: { color: '#222', fontWeight: 'bold' },
  error: { color: '#F6A07A', marginTop: 8, fontSize: 15, textAlign: 'center' },
}); 