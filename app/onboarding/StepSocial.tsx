import { Ionicons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Linking, Platform, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StepSocial({ notifications, setNotifications, onNext, onBack, stepIndex = 5, totalSteps = 7 }: {
  notifications: boolean;
  setNotifications: (v: boolean) => void;
  onNext: () => void;
  onBack: () => void;
  stepIndex?: number;
  totalSteps?: number;
}) {
  const [contactsEnabled, setContactsEnabled] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    setNotifications(false);
    checkContactsPermission();
  }, []);

  async function checkContactsPermission() {
    setChecking(true);
    const { status } = await Contacts.getPermissionsAsync();
    setContactsEnabled(status === 'granted');
    setChecking(false);
  }

  const handleNotification = async (val: boolean) => {
    setNotifications(val);
    if (val && Platform.OS === 'ios') {
      try {
        await Linking.openSettings();
      } catch {}
    }
  };

  const handleContacts = async (val: boolean) => {
    if (val) {
      const { status: currentStatus } = await Contacts.getPermissionsAsync();
      
      if (currentStatus === 'granted') {
        setContactsEnabled(true);
        return;
      }
      
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        setContactsEnabled(true);
      } else {
        setContactsEnabled(false);
        Alert.alert('Permission refusée', "Impossible d'accéder à tes contacts sans autorisation.");
      }
    } else {
      const { status } = await Contacts.getPermissionsAsync();
      if (status === 'granted') {
        setContactsEnabled(true);
        Alert.alert('Autorisation active', "L'accès aux contacts est déjà autorisé et ne peut pas être désactivé depuis l'application.");
      } else {
        setContactsEnabled(false);
      }
    }
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
        <View style={{width: 36, height: 36, marginLeft: 8}} />
      </View>
      <View style={styles.container}>
        <Image source={require('../../assets/images/icon.png')} style={styles.illustration} />
        <Text style={styles.title}>Pour profiter pleinement de Veeni.</Text>
        <View style={styles.section}>
          <View style={styles.sectionTextWrap}>
            <Text style={styles.sectionTitle}>Active tes notifications</Text>
            <Text style={styles.sectionDesc}>Pour suivre les découvertes de tes proches autour du vin.</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={handleNotification}
            trackColor={{ false: '#393C40', true: '#F6A07A' }}
            thumbColor={notifications ? '#FFF' : '#FFF'}
          />
        </View>
        <View style={styles.section}>
          <View style={styles.sectionTextWrap}>
            <Text style={styles.sectionTitle}>Autorise l'accès à tes contacts</Text>
            <Text style={styles.sectionDesc}>Pour les retrouver facilement.</Text>
          </View>
          <Switch
            value={contactsEnabled}
            onValueChange={handleContacts}
            trackColor={{ false: '#393C40', true: '#F6A07A' }}
            thumbColor={contactsEnabled ? '#FFF' : '#FFF'}
            disabled={checking}
          />
        </View>
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
  progressBarContainer: { flex: 1, height: 6, backgroundColor: '#393C40', borderRadius: 3, overflow: 'hidden', marginHorizontal: 8 },
  progressBar: { height: 6, backgroundColor: '#F6A07A', borderRadius: 3 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  illustration: { width: 64, height: 64, marginBottom: 24 },
  title: { color: '#FFF', fontWeight: 'bold', fontSize: 18, textAlign: 'center', marginBottom: 32 },
  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 28 },
  sectionTextWrap: { flex: 1 },
  sectionTitle: { color: '#FFF', fontWeight: 'bold', fontSize: 16, marginBottom: 2 },
  sectionDesc: { color: '#B0B0B0', fontSize: 14 },
  button: { backgroundColor: '#FFF', borderRadius: 24, paddingVertical: 14, paddingHorizontal: 36, marginBottom: 8 },
  buttonText: { color: '#222', fontWeight: 'bold', fontSize: 16 },
}); 