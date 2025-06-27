import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StepNotifications({ value, onChange, onNext, onBack, stepIndex = 8, totalSteps = 11 }: { value: boolean; onChange: (v: boolean) => void; onNext: () => void; onBack: () => void; stepIndex?: number; totalSteps?: number }) {
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
      <View style={styles.container}>
        <Text style={styles.label}>Pour profiter pleinement de Veeni :</Text>
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
  topRow: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingHorizontal: 16, marginTop: 0, marginBottom: 0, minHeight: 48 },
  headerBtn: { padding: 4, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.0)', marginRight: 8 },
  progressBarContainer: { flex: 1, height: 6, backgroundColor: '#393C40', borderRadius: 3, overflow: 'hidden' },
  progressBar: { height: 6, backgroundColor: '#F6A07A', borderRadius: 3 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  label: { color: '#FFF', fontSize: 20, marginBottom: 18, textAlign: 'center' },
  option: { backgroundColor: '#333', borderRadius: 18, paddingVertical: 14, paddingHorizontal: 32, marginVertical: 8 },
  selected: { backgroundColor: '#F6A07A' },
  optionText: { color: '#FFF', fontSize: 16 },
  button: { backgroundColor: '#FFF', borderRadius: 24, paddingVertical: 14, paddingHorizontal: 36, marginTop: 18 },
  buttonText: { color: '#222', fontWeight: 'bold', fontSize: 16 },
}); 