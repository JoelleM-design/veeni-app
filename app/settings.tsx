import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Contacts from 'expo-contacts';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SharedCaveModal } from '../components/SharedCaveModal';
import { useSharedCave } from '../hooks/useSharedCave';

export default function SettingsScreen() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [contactsEnabled, setContactsEnabled] = useState(false);
  const [contactsStatusChecked, setContactsStatusChecked] = useState(false);
  const [showHouseholdModal, setShowHouseholdModal] = useState(false);
  const [modalMode, setModalMode] = useState<'join' | 'share' | 'manage' | null>(null);
  const router = useRouter();
  const { sharedCave, caveState, userRole } = useSharedCave();

  // Déterminer le texte à afficher pour la cave partagée
  const getSharedCaveText = () => {
    if (!sharedCave) return null;
    
    if (caveState === 'owner_only' && userRole === 'owner') {
      return 'Cave partagée (en attente d\'un partenaire)';
    } else if (caveState === 'shared' && userRole === 'owner') {
      return 'Cave partagée active';
    } else if (caveState === 'shared' && userRole === 'partner') {
      return 'Cave partagée active';
    }
    
    return null;
  };

  const sharedCaveText = getSharedCaveText();

  // Gestion des actions
  const handleJoinCave = () => {
    setModalMode('join');
    setShowHouseholdModal(true);
  };
  const handleShareCave = () => {
    setModalMode('share');
    setShowHouseholdModal(true);
  };
  const handleManageCave = () => {
    setModalMode('manage');
    setShowHouseholdModal(true);
  };

  // Vérifier la permission au montage
  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('contactsEnabled');
      if (stored !== null) setContactsEnabled(stored === 'true');
      const { status } = await Contacts.getPermissionsAsync();
      setContactsStatusChecked(true);
      if (status === 'granted') setContactsEnabled(true);
    })();
  }, []);

  // Gestion du switch contacts
  const handleContactsSwitch = async (value: boolean) => {
    if (value) {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        setContactsEnabled(true);
        await AsyncStorage.setItem('contactsEnabled', 'true');
      } else {
        setContactsEnabled(false);
        await AsyncStorage.setItem('contactsEnabled', 'false');
      }
    } else {
      setContactsEnabled(false);
      await AsyncStorage.setItem('contactsEnabled', 'false');
    }
  };

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
        {/* Contacts */}
        <Text style={styles.sectionTitle}>Contacts</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.label}>Autoriser l'accès à mes contacts</Text>
          <Switch
            value={contactsEnabled}
            onValueChange={handleContactsSwitch}
            trackColor={{ false: '#888', true: '#F6A07A' }}
            thumbColor={contactsEnabled ? '#FFF' : '#FFF'}
            disabled={!contactsStatusChecked}
          />
        </View>
        <Text style={styles.subLabel}>Permets à Veeni de lire tes contacts pour retrouver tes amis plus facilement.</Text>
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
        {/* Cave partagée - seulement affiché si il y en a une */}
        {sharedCaveText && (
          <>
            <Text style={styles.sectionTitle}>Cave partagée</Text>
            <TouchableOpacity style={styles.settingItem} onPress={handleJoinCave}>
              <Text style={styles.settingText}>Rejoindre une cave</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem} onPress={handleShareCave}>
              <Text style={styles.settingText}>Partager ma cave</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem} onPress={handleManageCave}>
              <Text style={styles.settingText}>Gérer ma cave</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
            <View style={styles.separator} />
          </>
        )}
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

      {/* Modal Cave partagée */}
      {modalMode && (
        <SharedCaveModal
          visible={showHouseholdModal}
          onClose={() => { setShowHouseholdModal(false); setModalMode(null); }}
          mode={modalMode}
        />
      )}
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
  linkText: {
    color: '#F6A07A',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 0,
  },
  settingText: {
    color: '#FFF',
    fontSize: 16,
    marginLeft: 2,
  },
}); 