import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function StepWelcome({ onNext }: { onNext: () => void }) {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
      <Text style={styles.title}>veeni</Text>
      <Text style={styles.subtitle}>Gère ta cave et partage tes vins avec tes proches !</Text>
      <TouchableOpacity style={styles.button} onPress={onNext}>
        <Text style={styles.buttonText}>Créer un compte</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={() => router.push('/login')}>
        <Text style={styles.linkText}>Tu as déjà un compte ? <Text style={{ textDecorationLine: 'underline' }}>Connecte-toi</Text></Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center', padding: 24 },
  logo: { width: 80, height: 80, marginBottom: 18 },
  title: { color: '#FFF', fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { color: '#FFF', fontSize: 16, textAlign: 'center', marginBottom: 32 },
  button: { backgroundColor: '#FFF', borderRadius: 24, paddingVertical: 14, paddingHorizontal: 36, marginBottom: 18 },
  buttonText: { color: '#222', fontWeight: 'bold', fontSize: 16 },
  link: { marginTop: 8 },
  linkText: { color: '#FFF', fontSize: 14, textAlign: 'center' },
}); 