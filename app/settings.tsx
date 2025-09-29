import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Contacts from 'expo-contacts';
import * as MailComposer from 'expo-mail-composer';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, Platform, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SharedCaveModal } from '../components/SharedCaveModal';
import { VeeniColors } from '../constants/Colors';
import { useSharedCave } from '../hooks/useSharedCave';
import { supabase } from '../lib/supabase';

export default function SettingsScreen() {
  const [pushEnabled, setPushEnabled] = useState(false);
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

  // Vérifier les permissions au montage (contacts + notifications)
  useEffect(() => {
    (async () => {
      const storedContacts = await AsyncStorage.getItem('contactsEnabled');
      if (storedContacts !== null) setContactsEnabled(storedContacts === 'true');
      const { status } = await Contacts.getPermissionsAsync();
      setContactsStatusChecked(true);
      if (status === 'granted') setContactsEnabled(true);

      try {
        const storedPush = await AsyncStorage.getItem('pushEnabled');
        if (storedPush !== null) setPushEnabled(storedPush === 'true');
        // Import dynamique pour éviter crash si le module n'est pas présent
        const Notifications = await import('expo-notifications');
        const settings = await Notifications.getPermissionsAsync();
        if (settings?.granted) {
          setPushEnabled(true);
          await AsyncStorage.setItem('pushEnabled', 'true');
        }
      } catch (_) {
        // Module non présent ou indisponible: on garde l'état stocké
      }
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
        Alert.alert('Permission refusée', 'Active l\'accès aux contacts dans les Réglages pour utiliser cette fonction.', [
          { text: 'Ouvrir les réglages', onPress: () => Linking.openSettings() },
          { text: 'OK', style: 'cancel' },
        ]);
      }
    } else {
      // Impossible de révoquer par code: proposer d'ouvrir les réglages
      setContactsEnabled(false);
      await AsyncStorage.setItem('contactsEnabled', 'false');
      Alert.alert('Désactivation', 'Pour désactiver complètement, rends-toi dans les Réglages système.', [
        { text: 'Ouvrir les réglages', onPress: () => Linking.openSettings() },
        { text: 'OK', style: 'cancel' },
      ]);
    }
  };

  // Gestion du switch notifications
  const handlePushSwitch = async (value: boolean) => {
    try {
      const Notifications = await import('expo-notifications');
      if (value) {
        const { granted, status } = await Notifications.requestPermissionsAsync();
        if (granted || status === 'granted') {
          setPushEnabled(true);
          await AsyncStorage.setItem('pushEnabled', 'true');
        } else {
          setPushEnabled(false);
          await AsyncStorage.setItem('pushEnabled', 'false');
          Alert.alert('Permission notifications', 'Active les notifications dans les Réglages pour les recevoir.', [
            { text: 'Ouvrir les réglages', onPress: () => Linking.openSettings() },
            { text: 'OK', style: 'cancel' },
          ]);
        }
      } else {
        // On ne peut pas révoquer côté app, proposer les réglages
        setPushEnabled(false);
        await AsyncStorage.setItem('pushEnabled', 'false');
        Alert.alert('Désactivation', 'Désactive les notifications depuis les Réglages système si besoin.', [
          { text: 'Ouvrir les réglages', onPress: () => Linking.openSettings() },
          { text: 'OK', style: 'cancel' },
        ]);
      }
    } catch (_) {
      // Module non disponible
      setPushEnabled(false);
      await AsyncStorage.setItem('pushEnabled', 'false');
      Alert.alert('Notifications indisponibles', 'Le module de notifications n\'est pas disponible dans cette build.');
    }
  };

  // Gestion du contact support
  const handleContactSupport = async () => {
    try {
      const isAvailable = await MailComposer.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Erreur', 'L\'application mail n\'est pas disponible sur cet appareil.');
        return;
      }

      await MailComposer.composeAsync({
        recipients: ['hello@veeni.fr'],
        subject: '[Veeni Support] Demande d\'assistance',
        body: `Bonjour l'équipe Veeni,

J'ai besoin d'aide concernant l'application Veeni.

Merci de votre retour.

---
Informations techniques :
- Plateforme : ${Platform.OS}
- Version OS : ${Platform.Version}
- Version app : ${Constants.expoConfig?.version || '1.0.0'}`,
      });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ouvrir l\'application mail. Veuillez réessayer.');
    }
  };

  // Gestion de la déconnexion
  const handleLogout = async () => {
    Alert.alert(
      'Se déconnecter',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.auth.signOut();
              if (error) {
                Alert.alert('Erreur', 'Impossible de se déconnecter. Veuillez réessayer.');
                return;
              }
              // Sécuriser la redirection immédiatement
              try { router.replace('/login'); } catch {}
            } catch (error) {
              Alert.alert('Erreur', 'Une erreur est survenue lors de la déconnexion.');
            }
          },
        },
      ]
    );
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
            onValueChange={handlePushSwitch}
            trackColor={{ false: '#4A4A4A', true: VeeniColors.accent.primary }}
            thumbColor={pushEnabled ? '#FFFFFF' : '#E0E0E0'}
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
            trackColor={{ false: '#4A4A4A', true: VeeniColors.accent.primary }}
            thumbColor={contactsEnabled ? '#FFFFFF' : '#E0E0E0'}
            disabled={!contactsStatusChecked}
          />
        </View>
        <Text style={styles.subLabel}>Permets à Veeni de lire tes contacts pour retrouver tes amis plus facilement.</Text>
        <View style={styles.separator} />
        {/* Mon compte */}
        <Text style={styles.sectionTitle}>Mon compte</Text>
        <TouchableOpacity style={styles.rowBetween} onPress={() => router.push('/settings/edit-email')}>
          <Text style={styles.label}>Mail</Text>
          <Ionicons name="chevron-forward" size={20} color="#B0B0B0" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.rowBetween} onPress={() => router.push('/settings/edit-name')}>
          <Text style={styles.label}>Modifier mon nom</Text>
          <Ionicons name="chevron-forward" size={20} color="#B0B0B0" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.rowBetween} onPress={() => router.push('/settings/edit-password')}>
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
        <TouchableOpacity style={styles.rowBetween} onPress={() => router.push('/settings/terms')}>
          <Text style={styles.label}>Conditions générales d'utilisation</Text>
          <Ionicons name="chevron-forward" size={20} color="#B0B0B0" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.rowBetween} onPress={() => router.push('/settings/privacy')}>
          <Text style={styles.label}>Politique de confidentialité</Text>
          <Ionicons name="chevron-forward" size={20} color="#B0B0B0" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.rowBetween} onPress={handleContactSupport}>
          <Text style={styles.label}>Contacter le support</Text>
          <Ionicons name="chevron-forward" size={20} color="#B0B0B0" />
        </TouchableOpacity>
        
        {/* Déconnexion */}
        <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
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
    backgroundColor: '#393C40', borderWidth: 0,
    marginVertical: 22,
  },
  logoutRow: {
    paddingVertical: 16,
    paddingHorizontal: 0,
    alignItems: 'flex-start',
  },
  logoutText: {
    color: '#FFFFFF',
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
    color: '#FFFFFF',
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