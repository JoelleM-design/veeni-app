import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StepMajority({ value, onChange, onNext, onBack, stepIndex = 0, totalSteps = 7 }: { value: boolean; onChange: (v: boolean) => void; onNext: () => void; onBack: () => void; stepIndex?: number; totalSteps?: number }) {
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#222' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  label: { color: '#FFF', fontSize: 20, marginBottom: 18, marginTop: 0 },
  row: { flexDirection: 'row', marginBottom: 32 },
  choiceBtn: { borderRadius: 18, paddingVertical: 14, paddingHorizontal: 32, marginHorizontal: 8 },
  noBtn: { backgroundColor: '#393C40', borderWidth: 1, borderColor: '#555', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  yesBtn: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#555', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  choiceText: { fontSize: 18, fontWeight: 'bold' },
  noText: { color: '#FFFFFF', fontWeight: 'bold' },
  yesText: { color: '#222', fontWeight: 'bold' },
  error: { color: '#FFFFFF', marginTop: 8, fontSize: 15, textAlign: 'center' },
}); 