import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('Erreur', error.message);
      return;
    }
    router.replace('/(tabs)');
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Renseigne ton email', 'Merci de saisir ton email pour recevoir un lien de réinitialisation.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) {
      Alert.alert('Erreur', error.message);
      return;
    }
    setShowConfirm(true);
    setTimeout(() => setShowConfirm(false), 2500);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        placeholderTextColor="#888"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity style={styles.forgotLink} onPress={handleForgotPassword}>
        <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, (!email || !password) && { opacity: 0.5 }]}
        onPress={handleLogin}
        disabled={!email || !password || loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Connexion…' : 'Se connecter'}</Text>
      </TouchableOpacity>
      <Modal
        visible={showConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirm(false)}
      >
        <View style={styles.overlayBg}>
          <View style={styles.iosAlertBox}>
            <Text style={styles.iosAlertTitle}>Renseigne ton email</Text>
            <Text style={styles.iosAlertText}>Merci de saisir ton email pour recevoir un lien de réinitialisation.</Text>
            <TouchableOpacity style={styles.iosAlertBtn} onPress={() => setShowConfirm(false)}>
              <Text style={styles.iosAlertBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { color: '#FFF', fontSize: 28, fontWeight: 'bold', marginBottom: 32 },
  input: { backgroundColor: '#333', color: '#FFF', borderRadius: 16, padding: 14, fontSize: 18, width: '100%', marginBottom: 18 },
  button: { backgroundColor: '#F6A07A', borderRadius: 24, paddingVertical: 14, paddingHorizontal: 36, marginTop: 8, width: '100%', alignItems: 'center' },
  buttonText: { color: '#222', fontWeight: 'bold', fontSize: 16 },
  forgotLink: { alignSelf: 'flex-end', marginBottom: 12 },
  forgotText: { color: '#F6A07A', fontSize: 15 },
  overlayBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  iosAlertBox: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 24,
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  iosAlertTitle: {
    color: '#222',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
  },
  iosAlertText: {
    color: '#222',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 18,
  },
  iosAlertBtn: {
    paddingVertical: 8,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  iosAlertBtnText: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
}); 