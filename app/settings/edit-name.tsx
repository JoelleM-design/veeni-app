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

export default function EditNameScreen() {
  const router = useRouter();
  const { user, updateUser } = useUser();
  const [newFirstName, setNewFirstName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!newFirstName.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre prénom');
      return;
    }

    // Validation du prénom (2-50 caractères, pas de caractères spéciaux dangereux)
    const trimmedName = newFirstName.trim();
    if (trimmedName.length < 2) {
      Alert.alert('Erreur', 'Le prénom doit contenir au moins 2 caractères');
      return;
    }

    if (trimmedName.length > 50) {
      Alert.alert('Erreur', 'Le prénom ne peut pas dépasser 50 caractères');
      return;
    }

    // Validation des caractères (pas de caractères spéciaux dangereux)
    const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
    if (!nameRegex.test(trimmedName)) {
      Alert.alert('Erreur', 'Le prénom ne peut contenir que des lettres, espaces, tirets et apostrophes');
      return;
    }

    if (trimmedName === user?.first_name) {
      Alert.alert('Information', 'Ce prénom est déjà le vôtre');
      return;
    }

    setLoading(true);

    try {
      await updateUser({ first_name: trimmedName });
      Alert.alert(
        'Succès', 
        'Votre prénom a été modifié avec succès',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Erreur modification prénom:', error);
      Alert.alert('Erreur', 'Impossible de modifier le prénom. Veuillez réessayer.');
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
          <Text style={styles.title}>Modifier le prénom</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Prénom actuel */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prénom actuel</Text>
            <Text style={styles.currentName}>{user?.first_name}</Text>
          </View>

          {/* Nouveau prénom */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nouveau prénom</Text>
            <TextInput
              style={styles.input}
              placeholder="Saisissez votre nouveau prénom"
              placeholderTextColor="#666"
              value={newFirstName}
              onChangeText={setNewFirstName}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={50}
            />
          </View>

          {/* Informations */}
          <View style={styles.infoSection}>
            <Ionicons name="information-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.infoText}>
              Votre prénom sera visible par vos amis et dans votre profil Veeni.
            </Text>
          </View>

          {/* Règles */}
          <View style={styles.rulesSection}>
            <Text style={styles.rulesTitle}>Règles :</Text>
            <Text style={styles.ruleText}>• 2 à 50 caractères maximum</Text>
            <Text style={styles.ruleText}>• Lettres, espaces, tirets et apostrophes autorisés</Text>
            <Text style={styles.ruleText}>• Pas de caractères spéciaux</Text>
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
              {loading ? 'Modification...' : 'Modifier le prénom'}
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
  currentName: {
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
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#CCC',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  rulesSection: {
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 8,
  },
  rulesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  ruleText: {
    fontSize: 14,
    color: '#CCC',
    marginBottom: 4,
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