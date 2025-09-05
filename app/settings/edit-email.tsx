import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../hooks/useUser';

export default function EditEmailScreen() {
  const router = useRouter();
  const { user, updateUser } = useUser();
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!newEmail || !confirmEmail) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (newEmail !== confirmEmail) {
      Alert.alert('Erreur', 'Les adresses email ne correspondent pas');
      return;
    }

    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      Alert.alert('Erreur', 'Veuillez saisir une adresse email valide');
      return;
    }

    if (newEmail === user?.email) {
      Alert.alert('Information', 'Cette adresse email est déjà la vôtre');
      return;
    }

    setLoading(true);

    try {
      await updateUser({ email: newEmail });
      Alert.alert(
        'Succès', 
        'Votre adresse email a été modifiée avec succès',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Erreur modification email:', error);
      Alert.alert('Erreur', 'Impossible de modifier l\'adresse email. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Modifier l'email</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Email actuel */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Email actuel</Text>
            <Text style={styles.currentEmail}>{user?.email}</Text>
          </View>

          {/* Nouvel email */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nouvel email</Text>
            <TextInput
              style={styles.input}
              placeholder="Saisissez votre nouvel email"
              placeholderTextColor="#666"
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Confirmation email */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Confirmer l'email</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirmez votre nouvel email"
              placeholderTextColor="#666"
              value={confirmEmail}
              onChangeText={setConfirmEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Informations */}
          <View style={styles.infoSection}>
            <Ionicons name="information-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.infoText}>
              Votre nouvel email sera utilisé pour vous connecter à votre compte Veeni.
            </Text>
          </View>
        </ScrollView>

        {/* Bouton de sauvegarde */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Modification...' : 'Modifier l\'email'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  currentEmail: {
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
  },
  input: {
    fontSize: 16,
    color: '#FFF',
    backgroundColor: '#2A2A2A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#CCC',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  saveButton: {
    backgroundColor: '#393C40', borderWidth: 0,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#666',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
}); 