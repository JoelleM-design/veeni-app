import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header avec bouton back */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} hitSlop={{top: 16, bottom: 16, left: 16, right: 16}}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
          <Text style={styles.headerTitle}>Réglages</Text>
        </View>
        {/* Espace réservé pour équilibrer le header */}
        <View style={{ width: 36 }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
        {/* Notifications */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.label}>Activer les notifications push</Text>
          <Switch
            value={pushEnabled}
            onValueChange={setPushEnabled}
            trackColor={{ false: '#888', true: '#F6A07A' }}
            thumbColor={pushEnabled ? '#FFF' : '#FFF'}
          />
        </View>
        <Text style={styles.subLabel}>Reçois une alerte quand un ami ajoute ou aime un vin.</Text>
        <View style={styles.separator} />
        {/* Mon compte */}
        <Text style={styles.sectionTitle}>Mon compte</Text>
        <TouchableOpacity style={styles.rowBetween}>
          <Text style={styles.label}>Mail</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.rowBetween}>
          <Text style={styles.label}>Modifier mon nom</Text>
          <Ionicons name="chevron-forward" size={20} color="#B0B0B0" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.rowBetween}>
          <Text style={styles.label}>Modifier mon mot de passe</Text>
          <Ionicons name="chevron-forward" size={20} color="#B0B0B0" />
        </TouchableOpacity>
        <View style={styles.separator} />
        {/* Mentions légales */}
        <Text style={styles.sectionTitle}>Mentions légales</Text>
        <TouchableOpacity style={styles.rowBetween}>
          <Text style={styles.label}>Conditions générales d'utilisation</Text>
          <Ionicons name="chevron-forward" size={20} color="#B0B0B0" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.rowBetween}>
          <Text style={styles.label}>Politique de confidentialité</Text>
          <Ionicons name="chevron-forward" size={20} color="#B0B0B0" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.rowBetween}>
          <Text style={styles.label}>Contacter le support</Text>
          <Ionicons name="chevron-forward" size={20} color="#B0B0B0" />
        </TouchableOpacity>
        {/* Déconnexion */}
        <TouchableOpacity style={styles.logoutRow}>
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#23262A',
  },
  sectionTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 20,
    marginTop: 32,
    marginBottom: 16,
    marginLeft: 0,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 0,
  },
  label: {
    color: '#FFF',
    fontSize: 16,
    marginLeft: 2,
  },
  subLabel: {
    color: '#B0B0B0',
    fontSize: 15,
    marginBottom: 12,
    marginLeft: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#393C40',
    marginVertical: 22,
  },
  logoutRow: {
    paddingVertical: 16,
    paddingHorizontal: 0,
    alignItems: 'flex-start',
  },
  logoutText: {
    color: '#F6A07A',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 0,
    paddingHorizontal: 0,
  },
  headerBtn: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.0)',
    marginRight: 8,
  },
  headerTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
  },
}); 