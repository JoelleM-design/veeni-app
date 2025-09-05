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
import { supabase } from '../../lib/supabase';

export default function EditPasswordScreen() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validatePassword = (password: string) => {
    // Règles de sécurité iOS
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    if (password.length < minLength) {
      errors.push(`Au moins ${minLength} caractères`);
    }
    if (!hasUpperCase) {
      errors.push('Au moins une majuscule');
    }
    if (!hasLowerCase) {
      errors.push('Au moins une minuscule');
    }
    if (!hasNumbers) {
      errors.push('Au moins un chiffre');
    }
    if (!hasSpecialChar) {
      errors.push('Au moins un caractère spécial');
    }

    return errors;
  };

  const handleSave = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert('Erreur', 'Le nouveau mot de passe doit être différent de l\'actuel');
      return;
    }

    // Validation du nouveau mot de passe
    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      Alert.alert('Erreur', `Le mot de passe doit contenir :\n• ${passwordErrors.join('\n• ')}`);
      return;
    }

    setLoading(true);

    try {
      // Vérifier le mot de passe actuel et le changer
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      Alert.alert(
        'Succès', 
        'Votre mot de passe a été modifié avec succès',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Erreur modification mot de passe:', error);
      Alert.alert('Erreur', 'Impossible de modifier le mot de passe. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const passwordErrors = newPassword ? validatePassword(newPassword) : [];

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
          <Text style={styles.title}>Modifier le mot de passe</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Mot de passe actuel */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mot de passe actuel</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Saisissez votre mot de passe actuel"
                placeholderTextColor="#666"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                <Ionicons 
                  name={showCurrentPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Nouveau mot de passe */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nouveau mot de passe</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Saisissez votre nouveau mot de passe"
                placeholderTextColor="#666"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Ionicons 
                  name={showNewPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirmation nouveau mot de passe */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Confirmer le nouveau mot de passe</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirmez votre nouveau mot de passe"
                placeholderTextColor="#666"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-off" : "eye"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Validation du mot de passe */}
          {newPassword && (
            <View style={styles.validationSection}>
              <Text style={styles.validationTitle}>Critères de sécurité :</Text>
              {[
                { condition: newPassword.length >= 8, text: 'Au moins 8 caractères' },
                { condition: /[A-Z]/.test(newPassword), text: 'Au moins une majuscule' },
                { condition: /[a-z]/.test(newPassword), text: 'Au moins une minuscule' },
                { condition: /\d/.test(newPassword), text: 'Au moins un chiffre' },
                { condition: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword), text: 'Au moins un caractère spécial' }
              ].map((criterion, index) => (
                <View key={index} style={styles.criterionRow}>
                  <Ionicons 
                    name={criterion.condition ? "checkmark-circle" : "close-circle"} 
                    size={16} 
                    color={criterion.condition ? "#4CAF50" : "#F44336"} 
                  />
                  <Text style={[
                    styles.criterionText,
                    { color: criterion.condition ? "#4CAF50" : "#F44336" }
                  ]}>
                    {criterion.text}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Informations */}
          <View style={styles.infoSection}>
            <Ionicons name="information-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.infoText}>
              Votre nouveau mot de passe sera utilisé pour vous connecter à votre compte Veeni.
            </Text>
          </View>
        </ScrollView>

        {/* Bouton de sauvegarde */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.saveButton, 
              (loading || passwordErrors.length > 0) && styles.saveButtonDisabled
            ]}
            onPress={handleSave}
            disabled={loading || passwordErrors.length > 0}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Modification...' : 'Modifier le mot de passe'}
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  eyeButton: {
    padding: 12,
  },
  validationSection: {
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  validationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  criterionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  criterionText: {
    fontSize: 14,
    marginLeft: 8,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 8,
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